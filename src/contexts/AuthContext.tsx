// Authentication context with Supabase
// NOTE: This is the SINGLE SOURCE OF TRUTH for user/profile state.
// Do not duplicate profile state elsewhere (e.g., Zustand store).
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

// Explicit auth state machine - auth can NEVER get stuck in an indeterminate state
// - 'initializing': checking session (only on mount, transitions exactly once)
// - 'signed_out': no user
// - 'signed_in': user present (profile may or may not exist yet)
type AuthStatus = 'initializing' | 'signed_out' | 'signed_in';

// Explicit profile state machine - profile can NEVER be ambiguous
// - 'idle': no user signed in, profile not applicable
// - 'loading': fetching profile from database
// - 'exists': profile confirmed to exist
// - 'missing': profile confirmed to NOT exist (new user needs onboarding)
type ProfileStatus = 'idle' | 'loading' | 'exists' | 'missing';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  // Auth state machine - replaces boolean loading flag
  authStatus: AuthStatus;
  // Profile state machine - explicit status instead of boolean
  profileStatus: ProfileStatus;
  // Derived helpers for backwards compatibility
  loading: boolean;           // True only during 'initializing'
  isLoadingProfile: boolean;  // True only during 'loading' profile status
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Track whether initial session check is complete to avoid duplicate loads
  const initialLoadComplete = useRef(false);

  // Load user profile - returns whether profile exists
  // Options:
  //   showLoading: true (default) - sets profileStatus to 'loading' (shows spinner)
  //   showLoading: false - silent background refresh (no spinner)
  const loadUserData = async (userId: string, options?: { showLoading?: boolean }): Promise<boolean> => {
    const showLoading = options?.showLoading ?? true;
    if (showLoading) {
      setProfileStatus('loading');
    }
    try {
      setError(null);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // PGRST116 = no rows found, which is expected for new users who haven't created a profile yet
        if (profileError.code === 'PGRST116') {
          setProfile(null);
          setProfileStatus('missing');
          return false;
        }
        throw profileError;
      }

      setProfile(profileData);
      setProfileStatus('exists');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
      // On error, treat as missing to avoid infinite loading
      setProfileStatus('missing');
      return false;
    }
  };

  useEffect(() => {
    // Get initial session (handles page refresh and email confirmation redirect)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Wait for profile to load before transitioning state
          await loadUserData(session.user.id);
          setAuthStatus('signed_in');
        } else {
          // No user = no profile to load, set profile status to idle
          setProfileStatus('idle');
          setAuthStatus('signed_out');
        }
      } catch {
        // Network error or Supabase issue - treat as signed out
        // User will see login page and can retry
        setProfileStatus('idle');
        setAuthStatus('signed_out');
      } finally {
        // Mark initial load complete regardless of outcome
        initialLoadComplete.current = true;
      }
    };

    initializeAuth();

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // DEBUG: Log all auth events to identify what fires on tab switch
      console.log('[AuthContext] onAuthStateChange:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id?.slice(0, 8),
        initialLoadComplete: initialLoadComplete.current,
        currentProfileStatus: profileStatus,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // Skip if initial load already handled this session
          // This prevents duplicate profile loads on email confirmation redirect
          if (!initialLoadComplete.current) {
            return; // initializeAuth() will handle the profile load and state transition
          }
          // Manual sign-in after initial load
          // CRITICAL: Set profileStatus to 'loading' BEFORE any async work
          // This prevents race condition where ProtectedRoute sees user but not loading
          setProfileStatus('loading');
          setAuthStatus('signed_in');
          await loadUserData(session.user.id);
        } else {
          // For other events (TOKEN_REFRESHED, etc.), load in background silently
          // Don't change authStatus or show loading spinner - user is still signed in
          loadUserData(session.user.id, { showLoading: false });
        }
      } else {
        // User signed out
        setProfile(null);
        setProfileStatus('idle');
        setAuthStatus('signed_out');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  // Derive loading flags for backwards compatibility
  const loading = authStatus === 'initializing';
  const isLoadingProfile = profileStatus === 'loading';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        authStatus,
        profileStatus,
        loading,
        isLoadingProfile,
        error,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

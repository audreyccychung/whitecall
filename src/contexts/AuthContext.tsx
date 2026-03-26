// Authentication context with Supabase
// NOTE: This is the SINGLE SOURCE OF TRUTH for user/profile state.
// Do not duplicate profile state elsewhere (e.g., Zustand store).
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAllCaches } from '../utils/cacheManager';
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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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

  // Track current auth/profile status via refs for use in onAuthStateChange closure
  // (useState values get stale in the closure, refs always have current value)
  const authStatusRef = useRef<AuthStatus>(authStatus);
  const profileStatusRef = useRef<ProfileStatus>(profileStatus);
  authStatusRef.current = authStatus;
  profileStatusRef.current = profileStatus;

  // Load user profile - returns whether profile exists
  // Options:
  //   showLoading: true (default) - sets profileStatus to 'loading' (shows spinner)
  //   showLoading: false - silent background refresh (no spinner)
  const loadUserData = async (userId: string, options?: { showLoading?: boolean; retries?: number }): Promise<boolean> => {
    const showLoading = options?.showLoading ?? true;
    const maxRetries = options?.retries ?? 2;
    if (showLoading) {
      setProfileStatus('loading');
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setError(null);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          // PGRST116 = no rows found, which is expected for new users who haven't created a profile yet
          // This is a definitive "no profile" — no retry needed
          if (profileError.code === 'PGRST116') {
            setProfile(null);
            setProfileStatus('missing');
            return false;
          }
          throw profileError;
        }

        setProfile(profileData);
        setProfileStatus('exists');
        // Cache profile for instant render on next app open
        try {
          sessionStorage.setItem(`wc_profile_${userId}`, JSON.stringify(profileData));
        } catch {
          // sessionStorage full or unavailable — no-op
        }
        return true;
      } catch (err) {
        // If we have retries left, wait briefly and try again
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        // All retries exhausted — this is a network error, NOT a missing profile
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
        setProfileStatus('missing');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    // Get initial session (handles page refresh and email confirmation redirect)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Try cached profile for instant render (no spinner on reopen)
          const cached = sessionStorage.getItem(`wc_profile_${session.user.id}`);
          if (cached) {
            try {
              const cachedProfile = JSON.parse(cached) as Profile;
              setProfile(cachedProfile);
              setProfileStatus('exists');
              setAuthStatus('signed_in');
              // Background refresh — no spinner, overwrites cached data with fresh
              loadUserData(session.user.id, { showLoading: false });
            } catch {
              // Corrupted cache — fall through to normal load
              sessionStorage.removeItem(`wc_profile_${session.user.id}`);
              await loadUserData(session.user.id);
              setAuthStatus('signed_in');
            }
          } else {
            // No cache (first time) — must wait for profile load
            await loadUserData(session.user.id);
            setAuthStatus('signed_in');
          }
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
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // Skip if initial load already handled this session
          // This prevents duplicate profile loads on email confirmation redirect
          if (!initialLoadComplete.current) {
            return; // initializeAuth() will handle the profile load and state transition
          }

          // Skip if we're already signed in with a loaded profile
          // This handles cross-tab login broadcasts - other tabs don't need to re-authenticate
          if (authStatusRef.current === 'signed_in' && profileStatusRef.current === 'exists') {
            return;
          }

          // Fresh sign-in in this tab
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

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      return { error: error ?? null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    // Clear all module-level caches to prevent data leakage between users
    clearAllCaches();
    // Clear sessionStorage profile cache
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('wc_profile_')) sessionStorage.removeItem(key);
      });
    } catch {
      // sessionStorage unavailable — no-op
    }
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
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Authentication context with Supabase
// NOTE: This is the SINGLE SOURCE OF TRUTH for user/profile state.
// Do not duplicate profile state elsewhere (e.g., Zustand store).
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;           // True during initial auth check
  isLoadingProfile: boolean;  // True while profile is being fetched
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
  const [loading, setLoading] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether initial session check is complete to avoid duplicate loads
  const initialLoadComplete = useRef(false);

  // Load user profile
  const loadUserData = async (userId: string) => {
    setIsLoadingProfile(true);
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
          return;
        }
        throw profileError;
      }

      setProfile(profileData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Get initial session (handles page refresh and email confirmation redirect)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Wait for profile to load before setting loading to false
        await loadUserData(session.user.id);
      } else {
        // No user = no profile to load
        setIsLoadingProfile(false);
      }

      // Mark initial load as complete BEFORE setting loading to false
      // This prevents onAuthStateChange from triggering duplicate loads
      initialLoadComplete.current = true;
      setLoading(false);
    });

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
            return; // getSession() will handle the profile load
          }
          // Only show loading for manual sign-ins after initial load
          setLoading(true);
          await loadUserData(session.user.id);
          setLoading(false);
        } else {
          // For other events (TOKEN_REFRESHED, etc.), load in background
          loadUserData(session.user.id);
        }
      } else {
        setProfile(null);
        setLoading(false);
        setIsLoadingProfile(false);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
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

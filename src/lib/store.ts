// Global state management with Zustand
import { create } from 'zustand';
import type { Profile, UserSettings } from '../types/database';

interface AppState {
  // User state
  user: Profile | null;
  settings: UserSettings | null;
  isLoadingUser: boolean;

  // UI state
  showOnboardingModal: boolean;

  // Actions
  setUser: (user: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setIsLoadingUser: (loading: boolean) => void;
  setShowOnboardingModal: (show: boolean) => void;
  updateUserStreak: (currentStreak: number, longestStreak: number) => void;
  updateCallStatus: (isOnCall: boolean, callDate: string | null) => void;
  completeOnboarding: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  settings: null,
  isLoadingUser: true,
  showOnboardingModal: false,

  // Actions
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setIsLoadingUser: (loading) => set({ isLoadingUser: loading }),
  setShowOnboardingModal: (show) => set({ showOnboardingModal: show }),

  updateUserStreak: (currentStreak, longestStreak) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, current_streak: currentStreak, longest_streak: longestStreak }
        : null,
    })),

  updateCallStatus: (isOnCall, callDate) =>
    set((state) => ({
      user: state.user ? { ...state.user, is_on_call: isOnCall, call_date: callDate } : null,
    })),

  completeOnboarding: () =>
    set((state) => ({
      user: state.user ? { ...state.user, onboarding_completed: true } : null,
      showOnboardingModal: false,
    })),
}));

// Global state management with Zustand
// NOTE: Profile/user state is managed by AuthContext (single source of truth).
// This store is only for cross-component data that needs to sync without prop drilling.
import { create } from 'zustand';
import type { ShiftType } from '../types/database';

interface AppState {
  // Shift status - global so it updates everywhere (e.g., HomePage reads, CallsPage writes)
  shiftMap: Map<string, ShiftType>; // YYYY-MM-DD -> shift type
  isCallStatusLoaded: boolean;

  // Onboarding state - allows Settings to trigger tutorial re-view
  showOnboardingManual: boolean;
  // Track if user dismissed onboarding this session (prevents re-showing if DB update fails)
  onboardingDismissedThisSession: boolean;

  // Shift status actions
  setShiftMap: (entries: Array<{ date: string; shiftType: ShiftType }>) => void;

  // Onboarding actions
  openOnboarding: () => void;
  closeOnboarding: () => void;
  dismissOnboarding: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  shiftMap: new Map(),
  isCallStatusLoaded: false,
  showOnboardingManual: false,
  onboardingDismissedThisSession: false,

  // Shift status actions
  setShiftMap: (entries) => {
    const map = new Map<string, ShiftType>();
    for (const { date, shiftType } of entries) {
      map.set(date, shiftType);
    }
    set({ shiftMap: map, isCallStatusLoaded: true });
  },

  // Onboarding actions
  openOnboarding: () => set({ showOnboardingManual: true, onboardingDismissedThisSession: false }),
  closeOnboarding: () => set({ showOnboardingManual: false }),
  dismissOnboarding: () => set({ onboardingDismissedThisSession: true }),
}));

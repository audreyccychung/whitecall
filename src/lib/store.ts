// Global state management with Zustand
import { create } from 'zustand';
import type { Profile } from '../types/database';

interface AppState {
  // User state
  user: Profile | null;
  isLoadingUser: boolean;

  // Call status - global so it updates everywhere
  callDates: Set<string>; // Set of YYYY-MM-DD strings
  isCallStatusLoaded: boolean;

  // Actions
  setUser: (user: Profile | null) => void;
  setIsLoadingUser: (loading: boolean) => void;

  // Call status actions
  setCallDates: (dates: string[]) => void;
  addCallDate: (date: string) => void;
  removeCallDate: (date: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isLoadingUser: true,
  callDates: new Set(),
  isCallStatusLoaded: false,

  // Actions
  setUser: (user) => set({ user }),
  setIsLoadingUser: (loading) => set({ isLoadingUser: loading }),

  // Call status actions
  setCallDates: (dates) => {
    set({ callDates: new Set(dates), isCallStatusLoaded: true });
  },
  addCallDate: (date) => {
    const newDates = new Set(get().callDates);
    newDates.add(date);
    set({ callDates: newDates });
  },
  removeCallDate: (date) => {
    const newDates = new Set(get().callDates);
    newDates.delete(date);
    set({ callDates: newDates });
  },
}));

// Global state management with Zustand
// NOTE: Profile/user state is managed by AuthContext (single source of truth).
// This store is only for cross-component data that needs to sync without prop drilling.
import { create } from 'zustand';

interface AppState {
  // Call status - global so it updates everywhere (e.g., HomePage reads, CallsPage writes)
  callDates: Set<string>; // Set of YYYY-MM-DD strings
  isCallStatusLoaded: boolean;

  // Call status actions
  setCallDates: (dates: string[]) => void;
  addCallDate: (date: string) => void;
  removeCallDate: (date: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  callDates: new Set(),
  isCallStatusLoaded: false,

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

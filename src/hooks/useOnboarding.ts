// Onboarding state management hook
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../lib/store';

interface UseOnboardingReturn {
  showOnboarding: boolean;
  isManualTrigger: boolean;
  openOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { profile, refreshProfile } = useAuth();

  // Global state for manual trigger (from Settings)
  const showOnboardingManual = useStore((state) => state.showOnboardingManual);
  const openOnboardingGlobal = useStore((state) => state.openOnboarding);
  const closeOnboardingGlobal = useStore((state) => state.closeOnboarding);

  // Show onboarding if:
  // 1. Profile exists AND onboarding not completed (new user)
  // 2. OR manually triggered from Settings (global state)
  const shouldShowOnboarding = profile && !profile.onboarding_completed;
  const showOnboarding = shouldShowOnboarding || showOnboardingManual;
  const isManualTrigger = showOnboardingManual;

  // Open onboarding manually (from Settings "View Tutorial" button)
  const openOnboarding = useCallback(() => {
    openOnboardingGlobal();
  }, [openOnboardingGlobal]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async () => {
    // Close the modal first (instant feedback)
    closeOnboardingGlobal();

    // Only update DB if this was a first-time user (not manual re-view)
    if (profile && !profile.onboarding_completed) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', profile.id);

        if (error) {
          console.error('[useOnboarding] Failed to mark complete:', error);
          return;
        }

        // Refresh profile to update local state
        await refreshProfile();
      } catch (err) {
        console.error('[useOnboarding] Error completing onboarding:', err);
      }
    }
  }, [profile, refreshProfile, closeOnboardingGlobal]);

  return {
    showOnboarding,
    isManualTrigger,
    openOnboarding,
    completeOnboarding,
  };
}

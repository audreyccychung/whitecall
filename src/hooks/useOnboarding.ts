// Onboarding state management hook
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../lib/store';
import { CURRENT_ONBOARDING_VERSION } from '../constants/onboarding';

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
  // 1. Profile exists AND user hasn't seen current version
  // 2. OR manually triggered from Settings (global state)
  const userVersion = profile?.onboarding_version ?? 0;
  const needsOnboarding = profile && userVersion < CURRENT_ONBOARDING_VERSION;
  const showOnboarding = needsOnboarding || showOnboardingManual;
  const isManualTrigger = showOnboardingManual;

  // Open onboarding manually (from Settings "View Tutorial" button)
  const openOnboarding = useCallback(() => {
    openOnboardingGlobal();
  }, [openOnboardingGlobal]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async () => {
    // Close the modal first (instant feedback)
    closeOnboardingGlobal();

    // Only update DB if user needs to be upgraded to current version
    if (profile && userVersion < CURRENT_ONBOARDING_VERSION) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_version: CURRENT_ONBOARDING_VERSION,
          })
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
  }, [profile, userVersion, refreshProfile, closeOnboardingGlobal]);

  return {
    showOnboarding,
    isManualTrigger,
    openOnboarding,
    completeOnboarding,
  };
}

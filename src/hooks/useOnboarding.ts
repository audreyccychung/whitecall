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

  // Global state for manual trigger (from Settings) and dismissed state
  const showOnboardingManual = useStore((state) => state.showOnboardingManual);
  const onboardingDismissedThisSession = useStore((state) => state.onboardingDismissedThisSession);
  const openOnboardingGlobal = useStore((state) => state.openOnboarding);
  const closeOnboardingGlobal = useStore((state) => state.closeOnboarding);
  const dismissOnboardingGlobal = useStore((state) => state.dismissOnboarding);

  // Show onboarding if:
  // 1. Profile exists AND user hasn't seen current version AND hasn't dismissed this session
  // 2. OR manually triggered from Settings (global state)
  const userVersion = profile?.onboarding_version ?? 0;
  const needsOnboarding = profile && userVersion < CURRENT_ONBOARDING_VERSION && !onboardingDismissedThisSession;
  const showOnboarding = needsOnboarding || showOnboardingManual;
  const isManualTrigger = showOnboardingManual;

  // Open onboarding manually (from Settings "View Tutorial" button)
  const openOnboarding = useCallback(() => {
    openOnboardingGlobal();
  }, [openOnboardingGlobal]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async () => {
    // Close the modal first (instant feedback) - this handles both manual and auto-triggered
    closeOnboardingGlobal();
    // Mark as dismissed this session so it doesn't reappear even if DB update fails
    dismissOnboardingGlobal();

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
          // Still keep modal closed - user dismissed it, we'll try again next session
          return;
        }

        // Refresh profile to update local state
        await refreshProfile();
      } catch (err) {
        console.error('[useOnboarding] Error completing onboarding:', err);
        // Still keep modal closed - user dismissed it
      }
    }
  }, [profile, userVersion, refreshProfile, closeOnboardingGlobal, dismissOnboardingGlobal]);

  return {
    showOnboarding,
    isManualTrigger,
    openOnboarding,
    completeOnboarding,
  };
}

// Hook for managing push notification subscriptions
// Handles permission requests, subscription storage, and status tracking

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  PushPermissionStatus,
  PushSubscriptionResult,
  SavePushSubscriptionCode,
} from '../types/push';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert base64 VAPID key to Uint8Array for subscribe()
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// Detect if iOS but not installed as PWA
function isIOSNotInstalled(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && !isStandalone;
}

export function usePushNotifications(userId: string | undefined) {
  const [status, setStatus] = useState<PushPermissionStatus>('unsupported');
  const [loading, setLoading] = useState(false);

  // Check initial status on mount and when userId changes
  useEffect(() => {
    checkPushStatus();
  }, [userId]);

  const checkPushStatus = useCallback(async () => {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    // iOS requires PWA installation for push
    if (isIOSNotInstalled()) {
      setStatus('ios_not_installed');
      return;
    }

    // Check permission status
    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    if (permission === 'default') {
      setStatus('prompt');
      return;
    }

    // Permission is granted - check if we have an active subscription
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setStatus('subscribed');
      } else {
        setStatus('granted');
      }
    } catch (error) {
      console.warn('[Push] Error checking subscription:', error);
      setStatus('granted');
    }
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscriptionResult> => {
    if (!userId) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        error: 'You must be logged in.',
      };
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID public key not configured');
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: 'Push notifications not configured.',
      };
    }

    setLoading(true);

    try {
      // Request permission if needed
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return {
          success: false,
          code: 'UNKNOWN_ERROR',
          error: 'Notification permission denied.',
        };
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Extract subscription data
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscriptionJson.endpoint!;
      const p256dh = subscriptionJson.keys!.p256dh;
      const auth = subscriptionJson.keys!.auth;

      // Save to database via RPC function
      const { data, error } = await supabase.rpc('save_push_subscription', {
        p_endpoint: endpoint,
        p_p256dh: p256dh,
        p_auth: auth,
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        return {
          success: false,
          code: 'UNKNOWN_ERROR',
          error: 'Failed to save subscription.',
        };
      }

      // Parse result
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      const code = (result.code as SavePushSubscriptionCode) || 'UNKNOWN_ERROR';

      if (code === 'SUCCESS') {
        setStatus('subscribed');
        return { success: true, code };
      }

      return {
        success: false,
        code,
        error: result.detail || 'Failed to save subscription.',
      };

    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: error instanceof Error ? error.message : 'Something went wrong.',
      };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const unsubscribe = useCallback(async (): Promise<PushSubscriptionResult> => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase.rpc('remove_push_subscription', {
          p_endpoint: endpoint,
        });

        if (error) {
          console.error('[Push] Error removing subscription:', error);
          // Don't fail - the browser subscription is already removed
        }
      }

      setStatus('granted');
      return { success: true, code: 'SUCCESS' };

    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: error instanceof Error ? error.message : 'Something went wrong.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    status,
    loading,
    subscribe,
    unsubscribe,
    checkPushStatus,
    // Convenience booleans
    isSupported: status !== 'unsupported' && status !== 'ios_not_installed',
    isSubscribed: status === 'subscribed',
    needsInstall: status === 'ios_not_installed',
    isDenied: status === 'denied',
  };
}

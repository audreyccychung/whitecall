// Push notification types

// Result codes for saving push subscriptions (single source of truth)
export type SavePushSubscriptionCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'INVALID_SUBSCRIPTION'
  | 'UNKNOWN_ERROR';

// Result codes for removing push subscriptions
export type RemovePushSubscriptionCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

// Push permission and subscription status
export type PushPermissionStatus =
  | 'unsupported'      // Browser doesn't support push
  | 'ios_not_installed' // iOS but not installed as PWA
  | 'denied'           // User denied permission
  | 'prompt'           // Permission not yet requested
  | 'granted'          // Permission granted but not subscribed
  | 'subscribed';      // Granted AND actively subscribed

// Result from subscribe/unsubscribe operations
export interface PushSubscriptionResult {
  success: boolean;
  code: SavePushSubscriptionCode | RemovePushSubscriptionCode;
  error?: string;
}

// User-facing messages for result codes
export const SAVE_SUBSCRIPTION_MESSAGES: Record<SavePushSubscriptionCode, string> = {
  SUCCESS: 'Notifications enabled!',
  UNAUTHORIZED: 'You must be logged in.',
  INVALID_SUBSCRIPTION: 'Invalid subscription data.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export const REMOVE_SUBSCRIPTION_MESSAGES: Record<RemovePushSubscriptionCode, string> = {
  SUCCESS: 'Notifications disabled.',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

-- Migration: Drop broken heart push notification trigger
-- The trigger called an Edge Function with broken encryption (mixed aesgcm/aes128gcm).
-- Replaced by Vercel API route: api/send-heart-notification.ts
-- Called fire-and-forget from frontend after heart send.

DROP TRIGGER IF EXISTS heart_push_notification_trigger ON hearts;
DROP FUNCTION IF EXISTS trigger_heart_push_notification();

// Push notification sender for Vercel API routes
// Uses web-push library for Web Push protocol
import webpush from 'web-push';
import { supabase } from './supabase.js';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@whitecall.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Send push notification to a user
 * Handles multiple subscriptions and cleans up stale ones
 */
export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; total: number }> {
  // Get user's push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.error(`[Push] Failed to fetch subscriptions for ${userId}:`, error);
    return { sent: 0, total: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, total: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.svg',
    badge: payload.badge || '/icons/icon-192.svg',
    tag: payload.tag || 'whitecall-notification',
    data: payload.data || {},
  });

  let sent = 0;

  // Send to all subscriptions
  await Promise.all(
    subscriptions.map(async (sub: PushSubscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload,
          { TTL: 86400 } // 24 hours
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        console.error(`[Push] Failed for ${sub.endpoint}:`, error.message);

        // Delete stale subscriptions (410 Gone, 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Deleting stale subscription ${sub.id}`);
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    })
  );

  return { sent, total: subscriptions.length };
}

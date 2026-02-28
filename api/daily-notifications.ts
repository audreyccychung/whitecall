// Vercel Cron: Daily notifications - "X friends on call today"
// Schedule: 10:00 AM Hong Kong time (02:00 UTC)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { sendPushToUser } from './_lib/send-push.js';

export const config = {
  // Vercel cron requires this
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel sets this header)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ code: 'UNAUTHORIZED' });
  }

  try {
    // Get users who:
    // 1. Have notifications enabled
    // 2. Have at least one friend on call today
    // 3. Haven't sent any hearts today yet (can still help)
    const { data: users, error } = await supabase.rpc('get_users_for_daily_notification');

    if (error) {
      console.error('[DailyNotif] RPC error:', error);
      return res.status(500).json({ code: 'UNKNOWN_ERROR', detail: error.message });
    }

    if (!users || users.length === 0) {
      console.log('[DailyNotif] No users to notify');
      return res.status(200).json({ code: 'NO_USERS', sent: 0 });
    }

    console.log(`[DailyNotif] Notifying ${users.length} users`);

    let totalSent = 0;

    // Send notifications
    await Promise.all(
      users.map(async (user: { user_id: string; friends_on_call: number }) => {
        const friendText = user.friends_on_call === 1 ? 'friend is' : 'friends are';
        const result = await sendPushToUser(user.user_id, {
          title: 'WhiteCall',
          body: `${user.friends_on_call} ${friendText} on call today. Send support!`,
          tag: 'daily-reminder',
          data: { type: 'daily_reminder', url: '/home' },
        });
        totalSent += result.sent;
      })
    );

    console.log(`[DailyNotif] Sent ${totalSent} notifications`);
    return res.status(200).json({ code: 'SUCCESS', users: users.length, sent: totalSent });
  } catch (err) {
    console.error('[DailyNotif] Error:', err);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

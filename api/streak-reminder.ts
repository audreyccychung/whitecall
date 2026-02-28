// Vercel Cron: Streak reminder - "Send a heart to keep your streak!"
// Schedule: 5:30 PM Hong Kong time (09:30 UTC)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { sendPushToUser } from './_lib/send-push.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ code: 'UNAUTHORIZED' });
  }

  try {
    // Get users who:
    // 1. Have notifications enabled
    // 2. Have an active streak (>= 1 day)
    // 3. Haven't sent any hearts today
    // 4. Have at least one friend on call (can still send)
    const { data: users, error } = await supabase.rpc('get_users_for_streak_reminder');

    if (error) {
      console.error('[StreakReminder] RPC error:', error);
      return res.status(500).json({ code: 'UNKNOWN_ERROR', detail: error.message });
    }

    if (!users || users.length === 0) {
      console.log('[StreakReminder] No users at risk');
      return res.status(200).json({ code: 'NO_USERS', sent: 0 });
    }

    console.log(`[StreakReminder] Notifying ${users.length} users`);

    let totalSent = 0;

    // Send notifications
    await Promise.all(
      users.map(async (user: { user_id: string; current_streak: number }) => {
        const result = await sendPushToUser(user.user_id, {
          title: 'WhiteCall',
          body: `Send a heart to keep your ${user.current_streak}-day streak!`,
          tag: 'streak-reminder',
          data: { type: 'streak_reminder', url: '/home' },
        });
        totalSent += result.sent;
      })
    );

    console.log(`[StreakReminder] Sent ${totalSent} notifications`);
    return res.status(200).json({ code: 'SUCCESS', users: users.length, sent: totalSent });
  } catch (err) {
    console.error('[StreakReminder] Error:', err);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// Vercel Cron: Weekly recap - "Your week in review"
// Schedule: 11:00 AM Hong Kong time Sunday (03:00 UTC Sunday)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { sendPushToUser } from './_lib/send-push.js';

export const config = {
  maxDuration: 60,
};

interface WeeklyRecapUser {
  user_id: string;
  calls_this_week: number;
  hearts_received_this_week: number;
  avg_sleep_this_week: number | null;
}

/**
 * Build the notification body from recap data.
 * Omits segments where the value is 0 or null so the message
 * only surfaces data that exists.
 *
 * Examples:
 *   "3 calls · 2.5h avg sleep · 5 hearts received"
 *   "1 call · 3 hearts received"
 *   "2 calls · 1.0h avg sleep"
 */
function buildRecapBody(user: WeeklyRecapUser): string {
  const parts: string[] = [];

  const callWord = user.calls_this_week === 1 ? 'call' : 'calls';
  parts.push(`${user.calls_this_week} ${callWord}`);

  if (user.avg_sleep_this_week !== null && user.avg_sleep_this_week > 0) {
    parts.push(`${user.avg_sleep_this_week}h avg sleep`);
  }

  if (user.hearts_received_this_week > 0) {
    const heartWord = user.hearts_received_this_week === 1 ? 'heart' : 'hearts';
    parts.push(`${user.hearts_received_this_week} ${heartWord} received`);
  }

  return parts.join(' · ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel sets this header)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ code: 'UNAUTHORIZED' });
  }

  try {
    const { data: users, error } = await supabase.rpc('get_weekly_recap_data');

    if (error) {
      console.error('[WeeklyRecap] RPC error:', error);
      return res.status(500).json({ code: 'UNKNOWN_ERROR', detail: error.message });
    }

    if (!users || users.length === 0) {
      console.log('[WeeklyRecap] No users to notify');
      return res.status(200).json({ code: 'NO_USERS', sent: 0 });
    }

    console.log(`[WeeklyRecap] Notifying ${users.length} users`);

    // Send notifications and collect results
    const results = await Promise.all(
      users.map(async (user: WeeklyRecapUser) => {
        const result = await sendPushToUser(user.user_id, {
          title: 'Your week in review',
          body: buildRecapBody(user),
          tag: 'weekly-recap',
          data: { type: 'weekly_recap', url: '/profile' },
        });
        return result.sent;
      })
    );

    const totalSent = results.reduce((sum, n) => sum + n, 0);
    console.log(`[WeeklyRecap] Sent ${totalSent} notifications`);
    return res.status(200).json({ code: 'SUCCESS', users: users.length, sent: totalSent });
  } catch (err) {
    console.error('[WeeklyRecap] Error:', err);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

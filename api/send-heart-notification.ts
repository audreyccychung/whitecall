// Vercel API route: Send push notification after heart is sent
// Called fire-and-forget from frontend. Heart is already committed.
// Reuses existing sendPushToUser() utility (web-push library).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';
import { sendPushToUser } from './lib/send-push';

type ResultCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'NO_HEART_FOUND'
  | 'RECIPIENT_OPTED_OUT'
  | 'NO_SUBSCRIPTIONS'
  | 'PUSH_FAILED'
  | 'UNKNOWN_ERROR';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'UNAUTHORIZED' as ResultCode });
  }

  // 1. Extract and verify JWT
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ code: 'UNAUTHORIZED' as ResultCode });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ code: 'UNAUTHORIZED' as ResultCode });
  }

  // 2. Parse body
  const { recipient_id, shift_date } = req.body || {};

  if (!recipient_id || !shift_date) {
    return res.status(400).json({ code: 'UNKNOWN_ERROR' as ResultCode });
  }

  try {
    // 3. Verify heart exists (sender must be the authenticated user)
    const { data: heart, error: heartError } = await supabase
      .from('hearts')
      .select('id, message')
      .eq('sender_id', user.id)
      .eq('recipient_id', recipient_id)
      .eq('shift_date', shift_date)
      .limit(1)
      .single();

    if (heartError || !heart) {
      console.log(`[HeartNotif] No heart found: sender=${user.id}, recipient=${recipient_id}, date=${shift_date}`);
      return res.status(404).json({ code: 'NO_HEART_FOUND' as ResultCode });
    }

    // 4. Check if recipient has notifications enabled
    const { data: settings } = await supabase
      .from('user_settings')
      .select('notifications_enabled')
      .eq('user_id', recipient_id)
      .single();

    if (!settings?.notifications_enabled) {
      console.log(`[HeartNotif] Recipient ${recipient_id} has notifications disabled or no settings`);
      return res.status(200).json({ code: 'RECIPIENT_OPTED_OUT' as ResultCode });
    }

    // 5. Get sender display name for notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.display_name || senderProfile?.username || 'Someone';

    // 6. Send push notification
    const result = await sendPushToUser(recipient_id, {
      title: 'WhiteCall',
      body: `${senderName} sent you a white heart!`,
      tag: 'heart-received',
      data: { type: 'heart_received', url: '/home' },
    });

    if (result.total === 0) {
      console.log(`[HeartNotif] No subscriptions for recipient ${recipient_id}`);
      return res.status(200).json({ code: 'NO_SUBSCRIPTIONS' as ResultCode });
    }

    if (result.sent === 0) {
      console.log(`[HeartNotif] All pushes failed for recipient ${recipient_id}`);
      return res.status(200).json({ code: 'PUSH_FAILED' as ResultCode });
    }

    console.log(`[HeartNotif] Sent ${result.sent}/${result.total} to recipient ${recipient_id}`);
    return res.status(200).json({ code: 'SUCCESS' as ResultCode, sent: result.sent });

  } catch (err) {
    console.error('[HeartNotif] Error:', err);
    return res.status(500).json({ code: 'UNKNOWN_ERROR' as ResultCode });
  }
}

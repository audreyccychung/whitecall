// Heart management hook - refetch on visibility change (no realtime)
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { HeartWithSender, SendHeartResult, SendHeartCode, HeartStats } from '../types/heart';
import { getTodayDate } from '../utils/date';

// Exhaustive mapping: every code maps to exactly one message
const SEND_HEART_MESSAGES: Record<SendHeartCode, string> = {
  SUCCESS: 'Heart sent!',
  UNAUTHORIZED: 'You must be logged in to send hearts.',
  CANNOT_SEND_TO_SELF: 'You cannot send a heart to yourself.',
  RECIPIENT_NOT_FOUND: 'User not found.',
  NOT_FRIENDS: 'You can only send hearts to friends.',
  RECIPIENT_NOT_ON_CALL: 'This friend is not on call today.',
  ALREADY_SENT_TODAY: 'You already sent a heart to this friend today.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

export function useHearts(userId: string | undefined) {
  const [heartsReceived, setHeartsReceived] = useState<HeartWithSender[]>([]);
  const [heartsSent, setHeartsSent] = useState<HeartWithSender[]>([]);
  const [stats, setStats] = useState<HeartStats>({
    total_received: 0,
    total_sent: 0,
    received_today: 0,
    sent_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const lastFetchedAt = useRef<number>(0);

  // Load hearts
  const loadHearts = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    // Skip if data is fresh (unless forced)
    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = getTodayDate();

      // Load hearts received
      const { data: receivedData, error: receivedError } = await supabase
        .from('hearts')
        .select(
          `
          *,
          sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
        `
        )
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const received: HeartWithSender[] =
        receivedData?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsReceived(received);

      // Load hearts sent
      const { data: sentData, error: sentError } = await supabase
        .from('hearts')
        .select(
          `
          *,
          sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
        `
        )
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      const sent: HeartWithSender[] =
        sentData?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsSent(sent);

      // Calculate stats
      const receivedToday = received.filter((h) => h.shift_date === today).length;
      const sentToday = sent.filter((h) => h.shift_date === today).length;

      setStats({
        total_received: received.length,
        total_sent: sent.length,
        received_today: receivedToday,
        sent_today: sentToday,
      });
      lastFetchedAt.current = Date.now();
    } catch {
      // Silent fail - stats will show 0
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearts({ force: true }); // Force on mount/userId change
  }, [userId]);

  // Refetch on visibility change (more reliable than focus for mobile/PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadHearts(); // Stale-time check happens inside
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Optimistically update sent_today count
  const incrementSentToday = () => {
    setStats((prev) => ({ ...prev, sent_today: prev.sent_today + 1 }));
  };

  const decrementSentToday = () => {
    setStats((prev) => ({ ...prev, sent_today: Math.max(0, prev.sent_today - 1) }));
  };

  // Send heart to friend - uses optimistic UI pattern
  const sendHeart = async (
    recipientId: string,
    message: string = 'wishes you a white call!'
  ): Promise<SendHeartResult> => {
    // Optimistic update: increment sent count immediately
    incrementSentToday();

    // Call the single source of truth: send_heart DB function
    const { data, error } = await supabase.rpc('send_heart', {
      p_recipient_id: recipientId,
      p_message: message,
    });

    // Network or RPC error - rollback
    if (error) {
      decrementSentToday();
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: SEND_HEART_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Normalize response: handle string, object, or unexpected shapes
    let result: { code?: string; heart_id?: string };
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch {
        result = {};
      }
    } else if (data && typeof data === 'object') {
      result = data;
    } else {
      result = {};
    }

    const code = (result.code as SendHeartCode) || 'UNKNOWN_ERROR';
    const errorMessage = SEND_HEART_MESSAGES[code];

    if (code === 'SUCCESS') {
      // Success - optimistic update was correct, no refetch needed
      return { success: true, code, heart_id: result.heart_id };
    }

    // Failure - rollback optimistic update
    decrementSentToday();
    return { success: false, code, error: errorMessage };
  };

  return {
    heartsReceived,
    heartsSent,
    stats,
    loading,
    sendHeart,
    refreshHearts: loadHearts,
  };
}

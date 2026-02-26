// Heart management hook - refetch on visibility change (no realtime)
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
import { getTodayDate } from '../utils/date';
import type { HeartWithSender, SendHeartResult, SendHeartCode, HeartStats } from '../types/heart';

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

export interface UseHeartsResult {
  heartsReceived: HeartWithSender[];
  heartsSent: HeartWithSender[];
  stats: HeartStats;
  loading: boolean;
  sendHeart: (recipientId: string, message?: string) => Promise<SendHeartResult>;
  sendHeartWithOptimism: (recipientId: string, options?: {
    onOptimisticUpdate?: () => void;
    onRollback?: () => void;
    message?: string;
  }) => Promise<SendHeartResult>;
  refreshHearts: (options?: { force?: boolean }) => Promise<void>;
}

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache to persist across component remounts
const heartsCache = {
  stats: { total_received: 0, total_sent: 0, received_today: 0, sent_today: 0 } as HeartStats,
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout (called from AuthContext)
export function clearHeartsCache() {
  heartsCache.stats = { total_received: 0, total_sent: 0, received_today: 0, sent_today: 0 };
  heartsCache.lastFetchedAt = 0;
  heartsCache.userId = null;
}

export function useHearts(userId: string | undefined): UseHeartsResult {
  // Initialize from cache if same user (regardless of staleness for initial render)
  // This prevents loading spinner on remounts - we show cached data immediately
  // and refresh in background if stale
  const hasCachedData =
    userId &&
    heartsCache.userId === userId &&
    heartsCache.lastFetchedAt > 0; // Any cached data exists

  const [heartsReceived, setHeartsReceived] = useState<HeartWithSender[]>([]);
  const [heartsSent, setHeartsSent] = useState<HeartWithSender[]>([]);
  const [stats, setStats] = useState<HeartStats>(
    hasCachedData ? heartsCache.stats : { total_received: 0, total_sent: 0, received_today: 0, sent_today: 0 }
  );
  // Only show loading spinner if we have NO cached data at all
  const [isInitialLoad, setIsInitialLoad] = useState(!hasCachedData);
  const lastFetchedAt = useRef<number>(hasCachedData ? heartsCache.lastFetchedAt : 0);

  // Load hearts
  const loadHearts = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    // Skip if data is fresh (unless forced) - don't touch loading state
    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setIsInitialLoad(false);
      return;
    }

    try {
      const today = getTodayDate();

      // Run data queries (capped at 200) and count queries in parallel
      const [receivedResult, sentResult, receivedCountResult, sentCountResult] = await Promise.all([
        // Recent hearts received (with sender info for display)
        supabase
          .from('hearts')
          .select(
            `
            *,
            sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
          `
          )
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false })
          .limit(200),
        // Recent hearts sent (with sender info for display)
        supabase
          .from('hearts')
          .select(
            `
            *,
            sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
          `
          )
          .eq('sender_id', userId)
          .order('created_at', { ascending: false })
          .limit(200),
        // Exact total received (index-only, no row data transferred)
        supabase
          .from('hearts')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId),
        // Exact total sent (index-only, no row data transferred)
        supabase
          .from('hearts')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', userId),
      ]);

      if (receivedResult.error) throw receivedResult.error;
      if (sentResult.error) throw sentResult.error;

      const received: HeartWithSender[] =
        receivedResult.data?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsReceived(received);

      const sent: HeartWithSender[] =
        sentResult.data?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsSent(sent);

      // Calculate stats - use exact counts for totals, filtered data for today
      const receivedToday = received.filter((h) => h.shift_date === today).length;
      const sentToday = sent.filter((h) => h.shift_date === today).length;

      const newStats = {
        total_received: receivedCountResult.count ?? received.length,
        total_sent: sentCountResult.count ?? sent.length,
        received_today: receivedToday,
        sent_today: sentToday,
      };
      setStats(newStats);
      lastFetchedAt.current = Date.now();
      // Update module-level cache for instant remounts
      heartsCache.stats = newStats;
      heartsCache.lastFetchedAt = lastFetchedAt.current;
      heartsCache.userId = userId;
    } catch {
      // Silent fail - stats will show 0
    } finally {
      setIsInitialLoad(false);
    }
  };

  // Track previous userId to detect actual user changes vs remounts
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isUserChange = prevUserIdRef.current !== userId;
    prevUserIdRef.current = userId;

    // Force refetch only on actual userId change (login/logout)
    // On remount with same user, respect stale-time to preserve optimistic updates
    if (isUserChange) {
      loadHearts({ force: true });
    } else {
      loadHearts(); // Respects stale-time check
    }
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

  // Optimistically update sent_today count (also update cache for consistency)
  const incrementSentToday = () => {
    setStats((prev) => {
      const newStats = { ...prev, sent_today: prev.sent_today + 1 };
      heartsCache.stats = newStats;
      return newStats;
    });
  };

  const decrementSentToday = () => {
    setStats((prev) => {
      const newStats = { ...prev, sent_today: Math.max(0, prev.sent_today - 1) };
      heartsCache.stats = newStats;
      return newStats;
    });
  };

  // Send heart to friend - uses optimistic UI pattern internally
  const sendHeart = async (
    recipientId: string,
    message: string = 'wishes you a white call!'
  ): Promise<SendHeartResult> => {
    // Optimistic update: increment sent count immediately
    incrementSentToday();

    // Call the single source of truth: send_heart DB function
    // Pass user's local date to avoid server timezone issues
    const shiftDate = getTodayDate();
    const { data, error } = await supabase.rpc('send_heart', {
      p_recipient_id: recipientId,
      p_message: message,
      p_shift_date: shiftDate,
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

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string; heart_id?: string }>(data);
    const code = result.code as SendHeartCode;
    const errorMessage = SEND_HEART_MESSAGES[code] || SEND_HEART_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
      // Success - optimistic update was correct, no refetch needed
      return { success: true, code, heart_id: result.heart_id };
    }

    // Failure - rollback optimistic update
    decrementSentToday();
    return { success: false, code, error: errorMessage };
  };

  /**
   * Send heart with full optimistic UI support.
   * Handles both internal stats update AND external UI state updates.
   *
   * Use this instead of manually calling beginMutation/sendHeart/endMutation
   * in page components.
   *
   * @param recipientId - ID of friend to send heart to
   * @param options.onOptimisticUpdate - Called immediately to update UI optimistically
   * @param options.onRollback - Called if send fails to revert UI state
   * @param options.message - Optional custom message
   */
  const sendHeartWithOptimism = async (
    recipientId: string,
    options?: {
      onOptimisticUpdate?: () => void;
      onRollback?: () => void;
      message?: string;
    }
  ): Promise<SendHeartResult> => {
    // Call optimistic update callback immediately
    options?.onOptimisticUpdate?.();

    // Optimistic update: increment sent count
    incrementSentToday();

    // Call the single source of truth: send_heart DB function
    const shiftDate = getTodayDate();
    const { data, error } = await supabase.rpc('send_heart', {
      p_recipient_id: recipientId,
      p_message: options?.message || 'wishes you a white call!',
      p_shift_date: shiftDate,
    });

    // Network or RPC error - rollback
    if (error) {
      decrementSentToday();
      options?.onRollback?.();
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: SEND_HEART_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string; heart_id?: string }>(data);
    const code = result.code as SendHeartCode;
    const errorMessage = SEND_HEART_MESSAGES[code] || SEND_HEART_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
      // Success - optimistic update was correct
      return { success: true, code, heart_id: result.heart_id };
    }

    // Failure - rollback both internal stats and external UI
    decrementSentToday();
    options?.onRollback?.();
    return { success: false, code, error: errorMessage };
  };

  return {
    heartsReceived,
    heartsSent,
    stats,
    loading: isInitialLoad, // Only true until first successful load
    sendHeart,
    sendHeartWithOptimism,
    refreshHearts: loadHearts,
  };
}

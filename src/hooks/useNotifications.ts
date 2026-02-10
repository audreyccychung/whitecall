// Notifications hook - fetch and manage notifications
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Notification,
  GetNotificationsCode,
  MarkNotificationsReadCode,
} from '../types/database';

// Exhaustive mapping: every code maps to exactly one message
const GET_NOTIFICATIONS_MESSAGES: Record<GetNotificationsCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Could not load notifications.',
};

const MARK_READ_MESSAGES: Record<MarkNotificationsReadCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Could not mark notifications as read.',
};


// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache
const notificationsCache = {
  notifications: [] as Notification[],
  unreadCount: 0,
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout
export function clearNotificationsCache() {
  notificationsCache.notifications = [];
  notificationsCache.unreadCount = 0;
  notificationsCache.lastFetchedAt = 0;
  notificationsCache.userId = null;
}

export function useNotifications(userId: string | undefined) {
  const hasCachedData =
    userId &&
    notificationsCache.userId === userId &&
    notificationsCache.lastFetchedAt > 0;

  const [notifications, setNotifications] = useState<Notification[]>(
    hasCachedData ? notificationsCache.notifications : []
  );
  const [unreadCount, setUnreadCount] = useState<number>(
    hasCachedData ? notificationsCache.unreadCount : 0
  );
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(hasCachedData ? notificationsCache.lastFetchedAt : 0);

  // Load notifications
  const loadNotifications = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_notifications', {
        p_limit: 50,
        p_offset: 0,
      });

      if (rpcError) throw rpcError;

      const result = data as {
        code: GetNotificationsCode;
        notifications?: Notification[];
        unread_count?: number;
        message?: string;
      };

      if (result.code !== 'SUCCESS') {
        setError(GET_NOTIFICATIONS_MESSAGES[result.code] || GET_NOTIFICATIONS_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      const notifs = result.notifications || [];
      const count = result.unread_count ?? 0;

      setNotifications(notifs);
      setUnreadCount(count);
      lastFetchedAt.current = Date.now();

      // Update cache
      notificationsCache.notifications = notifs;
      notificationsCache.unreadCount = count;
      notificationsCache.lastFetchedAt = Date.now();
      notificationsCache.userId = userId;
    } catch (err) {
      console.warn('[Notifications] Failed to load:', err);
      setError(GET_NOTIFICATIONS_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch just the unread count (lighter weight)
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: rpcError } = await supabase.rpc('get_unread_notification_count');

      if (rpcError) throw rpcError;

      const result = data as { code: 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR'; count?: number; message?: string };

      if (result.code === 'SUCCESS') {
        setUnreadCount(result.count ?? 0);
        notificationsCache.unreadCount = result.count ?? 0;
      }
    } catch (err) {
      // Non-blocking: count refresh failure shouldn't show error UI
      console.warn('[Notifications] Failed to fetch unread count:', err);
    }
  }, [userId]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!userId) return { success: false };

    try {
      const { data, error: rpcError } = await supabase.rpc('mark_notifications_read', {
        p_notification_ids: notificationIds || null,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: MarkNotificationsReadCode; updated_count?: number; message?: string };

      if (result.code !== 'SUCCESS') {
        return { success: false, error: MARK_READ_MESSAGES[result.code] };
      }

      // Update local state
      if (!notificationIds) {
        // All marked as read
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        notificationsCache.notifications = notificationsCache.notifications.map((n) => ({ ...n, read: true }));
        notificationsCache.unreadCount = 0;
      } else {
        // Specific ones marked as read
        setNotifications((prev) =>
          prev.map((n) => (notificationIds.includes(n.id) ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - (result.updated_count ?? 0)));
        notificationsCache.notifications = notificationsCache.notifications.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        );
        notificationsCache.unreadCount = Math.max(0, notificationsCache.unreadCount - (result.updated_count ?? 0));
      }

      return { success: true };
    } catch (err) {
      console.warn('[Notifications] Failed to mark as read:', err);
      return { success: false, error: MARK_READ_MESSAGES.UNKNOWN_ERROR };
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Poll for unread count periodically (every 60 seconds when tab is visible)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  // Refetch on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: () => loadNotifications({ force: true }),
    markAsRead,
  };
}

// Activity feed hook - fetch friend activities and toggle likes
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Activity,
  ToggleLikeCode,
  GetFeedCode,
} from '../types/database';

// Result types
export interface ToggleLikeResult {
  success: boolean;
  code: ToggleLikeCode;
  message: string;
  liked?: boolean; // true if liked, false if unliked
}

// Exhaustive mapping: every code maps to exactly one message
const TOGGLE_LIKE_MESSAGES: Record<ToggleLikeCode, string> = {
  LIKED: 'Liked!',
  UNLIKED: 'Unliked',
  NOT_FOUND: 'Activity not found.',
  UNAUTHORIZED: 'You must be logged in.',
  CANNOT_LIKE_OWN: 'You cannot like your own activity.',
  NOT_FRIENDS: 'You can only like activities from friends.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const GET_FEED_MESSAGES: Record<GetFeedCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Could not load activity feed.',
};

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache
const feedCache = {
  activities: [] as Activity[],
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout (called from AuthContext)
export function clearActivityFeedCache() {
  feedCache.activities = [];
  feedCache.lastFetchedAt = 0;
  feedCache.userId = null;
}

export function useActivityFeed(userId: string | undefined) {
  const hasCachedData =
    userId &&
    feedCache.userId === userId &&
    feedCache.lastFetchedAt > 0;

  const [activities, setActivities] = useState<Activity[]>(
    hasCachedData ? feedCache.activities : []
  );
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(hasCachedData ? feedCache.lastFetchedAt : 0);

  // Load activity feed
  const loadFeed = useCallback(async (options?: { force?: boolean }) => {
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
      const { data, error: rpcError } = await supabase.rpc('get_activity_feed', {
        p_limit: 50,
        p_offset: 0,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: GetFeedCode; activities?: Activity[]; message?: string };

      if (result.code !== 'SUCCESS') {
        setError(GET_FEED_MESSAGES[result.code] || GET_FEED_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      const activitiesData = result.activities || [];
      setActivities(activitiesData);
      lastFetchedAt.current = Date.now();

      // Update cache
      feedCache.activities = activitiesData;
      feedCache.lastFetchedAt = Date.now();
      feedCache.userId = userId;
    } catch {
      setError(GET_FEED_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Toggle like on an activity
  const toggleLike = useCallback(async (activityId: string): Promise<ToggleLikeResult> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('toggle_activity_like', {
        p_activity_id: activityId,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: ToggleLikeCode; message?: string };
      const code = result.code || 'UNKNOWN_ERROR';
      const success = code === 'LIKED' || code === 'UNLIKED';

      if (success) {
        // Update local state optimistically then refetch for truth
        setActivities((prev) =>
          prev.map((a) => {
            if (a.id === activityId) {
              const liked = code === 'LIKED';
              return {
                ...a,
                user_has_liked: liked,
                like_count: liked ? a.like_count + 1 : a.like_count - 1,
              };
            }
            return a;
          })
        );

        // Update cache too
        feedCache.activities = feedCache.activities.map((a) => {
          if (a.id === activityId) {
            const liked = code === 'LIKED';
            return {
              ...a,
              user_has_liked: liked,
              like_count: liked ? a.like_count + 1 : a.like_count - 1,
            };
          }
          return a;
        });
      }

      return {
        success,
        code,
        message: TOGGLE_LIKE_MESSAGES[code] || TOGGLE_LIKE_MESSAGES.UNKNOWN_ERROR,
        liked: code === 'LIKED',
      };
    } catch {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: TOGGLE_LIKE_MESSAGES.UNKNOWN_ERROR,
      };
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Refetch on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadFeed]);

  return {
    activities,
    isLoading,
    error,
    toggleLike,
    refetch: () => loadFeed({ force: true }),
  };
}

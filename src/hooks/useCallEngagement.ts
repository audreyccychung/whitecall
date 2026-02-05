// Call engagement hook - fetch engagement data for user's calls
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CallEngagement, GetEngagementCode } from '../types/database';

// Exhaustive mapping: every code maps to exactly one message
const GET_ENGAGEMENT_MESSAGES: Record<GetEngagementCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Could not load engagement data.',
};

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Engagement data for a single call
export interface EngagementData {
  activity_id: string;
  like_count: number;
  comment_count: number;
}

// Module-level cache
const engagementCache = {
  engagementMap: new Map<string, EngagementData>(), // call_date -> engagement data
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout (called from AuthContext)
export function clearEngagementCache() {
  engagementCache.engagementMap.clear();
  engagementCache.lastFetchedAt = 0;
  engagementCache.userId = null;
}

export function useCallEngagement(userId: string | undefined) {
  const hasCachedData =
    userId &&
    engagementCache.userId === userId &&
    engagementCache.lastFetchedAt > 0;

  const [engagementMap, setEngagementMap] = useState<Map<string, EngagementData>>(
    hasCachedData ? engagementCache.engagementMap : new Map()
  );
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(hasCachedData ? engagementCache.lastFetchedAt : 0);

  // Load engagement data
  const loadEngagement = useCallback(async (options?: { force?: boolean }) => {
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
      const { data, error: rpcError } = await supabase.rpc('get_call_engagement', {
        p_user_id: userId,
      });

      if (rpcError) throw rpcError;

      const result = data as { code: GetEngagementCode; engagement?: CallEngagement[]; message?: string };

      if (result.code !== 'SUCCESS') {
        setError(GET_ENGAGEMENT_MESSAGES[result.code] || GET_ENGAGEMENT_MESSAGES.UNKNOWN_ERROR);
        return;
      }

      const engagementData = result.engagement || [];
      const newMap = new Map<string, EngagementData>();
      engagementData.forEach((e) => {
        // Include entries with any engagement (likes or comments)
        if (e.like_count > 0 || e.comment_count > 0) {
          newMap.set(e.call_date, {
            activity_id: e.activity_id,
            like_count: e.like_count,
            comment_count: e.comment_count,
          });
        }
      });

      setEngagementMap(newMap);
      lastFetchedAt.current = Date.now();

      // Update cache
      engagementCache.engagementMap = newMap;
      engagementCache.lastFetchedAt = Date.now();
      engagementCache.userId = userId;
    } catch {
      setError(GET_ENGAGEMENT_MESSAGES.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadEngagement();
  }, [loadEngagement]);

  // Refetch on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadEngagement();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadEngagement]);

  return {
    engagementMap,
    isLoading,
    error,
    refetch: () => loadEngagement({ force: true }),
  };
}

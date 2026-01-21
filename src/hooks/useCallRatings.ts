// Call ratings hook - fetch and save call ratings
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CallRating, CallRatingValue } from '../types/database';

// Result codes from save_call_rating RPC
export type SaveRatingCode =
  | 'SUCCESS'
  | 'UNAUTHORIZED'
  | 'INVALID_RATING'
  | 'INVALID_HOURS_SLEPT'
  | 'NO_CALL_ON_DATE'
  | 'UNKNOWN_ERROR';

export interface SaveRatingResult {
  success: boolean;
  code: SaveRatingCode;
  message: string;
}

// Exhaustive mapping: every code maps to exactly one message
const SAVE_RATING_MESSAGES: Record<SaveRatingCode, string> = {
  SUCCESS: 'Rating saved!',
  UNAUTHORIZED: 'You must be logged in to rate calls.',
  INVALID_RATING: 'Invalid rating value.',
  INVALID_HOURS_SLEPT: 'Hours slept must be between 0 and 12.',
  NO_CALL_ON_DATE: 'You did not have a call on this date.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache
const ratingsCache = {
  ratings: [] as CallRating[],
  ratingsMap: new Map<string, CallRating>(), // call_date -> rating for quick lookup
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout (called from AuthContext)
export function clearRatingsCache() {
  ratingsCache.ratings = [];
  ratingsCache.ratingsMap.clear();
  ratingsCache.lastFetchedAt = 0;
  ratingsCache.userId = null;
}

export function useCallRatings(userId: string | undefined) {
  const hasCachedData =
    userId &&
    ratingsCache.userId === userId &&
    ratingsCache.lastFetchedAt > 0;

  const [ratings, setRatings] = useState<CallRating[]>(
    hasCachedData ? ratingsCache.ratings : []
  );
  const [ratingsMap, setRatingsMap] = useState<Map<string, CallRating>>(
    hasCachedData ? ratingsCache.ratingsMap : new Map()
  );
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [isSaving, setIsSaving] = useState(false);
  const lastFetchedAt = useRef<number>(hasCachedData ? ratingsCache.lastFetchedAt : 0);

  // Load all ratings for user
  const loadRatings = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('call_ratings')
        .select('*')
        .eq('user_id', userId)
        .order('call_date', { ascending: false });

      if (error) throw error;

      const ratingsData = (data || []) as CallRating[];
      const newMap = new Map<string, CallRating>();
      ratingsData.forEach((r) => newMap.set(r.call_date, r));

      setRatings(ratingsData);
      setRatingsMap(newMap);
      lastFetchedAt.current = Date.now();

      // Update cache
      ratingsCache.ratings = ratingsData;
      ratingsCache.ratingsMap = newMap;
      ratingsCache.lastFetchedAt = Date.now();
      ratingsCache.userId = userId;
    } catch {
      // Silent fail - cache will remain stale
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save a rating (upsert)
  const saveRating = useCallback(async (
    callDate: string,
    rating: CallRatingValue,
    notes?: string | null,
    hoursSlept?: number | null
  ): Promise<SaveRatingResult> => {
    setIsSaving(true);

    try {
      const { data, error } = await supabase.rpc('save_call_rating', {
        p_call_date: callDate,
        p_rating: rating,
        p_notes: notes || null,
        p_hours_slept: hoursSlept ?? null,
      });

      if (error) throw error;

      const result = data as { success: boolean; code: SaveRatingCode };
      const code = result.code || 'UNKNOWN_ERROR';

      if (result.success) {
        // Refetch to get the updated rating from DB (no state guessing)
        await loadRatings({ force: true });
      }

      return {
        success: result.success,
        code,
        message: SAVE_RATING_MESSAGES[code] || SAVE_RATING_MESSAGES.UNKNOWN_ERROR,
      };
    } catch {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: SAVE_RATING_MESSAGES.UNKNOWN_ERROR,
      };
    } finally {
      setIsSaving(false);
    }
  }, [loadRatings]);

  // Get rating for a specific date
  const getRatingForDate = useCallback((callDate: string): CallRating | undefined => {
    return ratingsMap.get(callDate);
  }, [ratingsMap]);

  // Initial load
  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  // Refetch on visibility change (like useHearts)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRatings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadRatings]);

  return {
    ratings,
    ratingsMap,
    isLoading,
    isSaving,
    saveRating,
    getRatingForDate,
    refetch: () => loadRatings({ force: true }),
  };
}

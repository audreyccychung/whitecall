// Call/shift management hook - syncs with global Zustand store
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import type { Call, ShiftType } from '../types/database';

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache to persist across component remounts
const callsCache = {
  calls: [] as Call[],
  lastFetchedAt: 0,
  userId: null as string | null,
};

// Clear cache on logout (called from cacheManager)
export function clearCallsCache() {
  callsCache.calls = [];
  callsCache.lastFetchedAt = 0;
  callsCache.userId = null;
}

interface UseCallsReturn {
  calls: Call[];
  loading: boolean;
  error: string | null;
  setShift: (date: string, shiftType: ShiftType) => Promise<{ success: boolean; error?: string }>;
  clearShift: (date: string) => Promise<{ success: boolean; error?: string }>;
  deleteCall: (callId: string) => Promise<{ success: boolean; error?: string }>;
  refreshCalls: () => Promise<void>;
}

export function useCalls(userId: string | undefined): UseCallsReturn {
  const hasCachedData =
    userId &&
    callsCache.userId === userId &&
    callsCache.lastFetchedAt > 0;

  const [calls, setCalls] = useState<Call[]>(hasCachedData ? callsCache.calls : []);
  const [loading, setLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(hasCachedData ? callsCache.lastFetchedAt : 0);

  // Global store action - syncs shift data for cross-component access
  const setShiftMap = useStore((state) => state.setShiftMap);

  const loadCalls = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      if (!hasCachedData) setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('call_date', { ascending: true });

      if (fetchError) throw fetchError;

      const callsData = data || [];
      setCalls(callsData);
      // Sync to global store
      setShiftMap(callsData.map((c) => ({ date: c.call_date, shiftType: c.shift_type })));
      // Update cache
      lastFetchedAt.current = Date.now();
      callsCache.calls = callsData;
      callsCache.lastFetchedAt = lastFetchedAt.current;
      callsCache.userId = userId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls({ force: true });
  }, [userId]);

  // Refetch on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCalls();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Upsert a shift for a given date (create or update)
  const setShift = async (
    date: string,
    shiftType: ShiftType
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { error: upsertError } = await supabase
        .from('calls')
        .upsert(
          { user_id: userId, call_date: date, shift_type: shiftType },
          { onConflict: 'user_id,call_date' }
        );

      if (upsertError) throw upsertError;

      // Refetch from DB to confirm success (no state guessing)
      await loadCalls({ force: true });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to set shift',
      };
    }
  };

  // Clear a shift from a given date
  const clearShift = async (date: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    const existingCall = calls.find((c) => c.call_date === date);
    if (!existingCall) {
      return { success: true }; // Already clear
    }

    return deleteCall(existingCall.id);
  };

  const deleteCall = async (callId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('calls')
        .delete()
        .eq('id', callId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Refetch from DB to confirm success (no state guessing)
      await loadCalls({ force: true });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete call',
      };
    }
  };

  return {
    calls,
    loading,
    error,
    setShift,
    clearShift,
    deleteCall,
    refreshCalls: () => loadCalls({ force: true }),
  };
}

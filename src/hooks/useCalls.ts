// Call/shift management hook - syncs with global Zustand store
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import type { Call, ShiftType } from '../types/database';

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
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global store action - syncs shift data for cross-component access
  const setShiftMap = useStore((state) => state.setShiftMap);

  const loadCalls = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('call_date', { ascending: true });

      if (fetchError) throw fetchError;

      setCalls(data || []);
      // Sync to global store
      setShiftMap((data || []).map((c) => ({ date: c.call_date, shiftType: c.shift_type })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
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
      await loadCalls();

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
      await loadCalls();

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
    refreshCalls: loadCalls,
  };
}

// Call management hook - syncs with global Zustand store
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import type { Call } from '../types/database';

interface UseCallsReturn {
  calls: Call[];
  loading: boolean;
  error: string | null;
  createCall: (date: string) => Promise<{ success: boolean; error?: string }>;
  deleteCall: (callId: string) => Promise<{ success: boolean; error?: string }>;
  toggleCall: (date: string) => Promise<{ success: boolean; error?: string }>;
  hasCallOnDate: (date: string) => boolean;
  refreshCalls: () => Promise<void>;
}

export function useCalls(userId: string | undefined): UseCallsReturn {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global store actions
  const setCallDates = useStore((state) => state.setCallDates);
  const addCallDate = useStore((state) => state.addCallDate);
  const removeCallDate = useStore((state) => state.removeCallDate);

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
      setCallDates((data || []).map((c) => c.call_date));
    } catch (err) {
      console.error('Error loading calls:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [userId]);

  const createCall = async (date: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('calls')
        .insert({ user_id: userId, call_date: date })
        .select()
        .single();

      if (insertError) throw insertError;

      setCalls((prev) => [...prev, data].sort((a, b) => a.call_date.localeCompare(b.call_date)));
      // Sync to global store immediately
      addCallDate(date);

      return { success: true };
    } catch (err) {
      console.error('Error creating call:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create call',
      };
    }
  };

  const deleteCall = async (callId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      // Get the date before deleting so we can update global store
      const callToDelete = calls.find((c) => c.id === callId);

      const { error: deleteError } = await supabase
        .from('calls')
        .delete()
        .eq('id', callId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setCalls((prev) => prev.filter((c) => c.id !== callId));
      // Sync to global store immediately
      if (callToDelete) {
        removeCallDate(callToDelete.call_date);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting call:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete call',
      };
    }
  };

  const hasCallOnDate = (date: string): boolean => {
    return calls.some((c) => c.call_date === date);
  };

  const toggleCall = async (date: string): Promise<{ success: boolean; error?: string }> => {
    const existingCall = calls.find((c) => c.call_date === date);

    if (existingCall) {
      return deleteCall(existingCall.id);
    } else {
      return createCall(date);
    }
  };

  return {
    calls,
    loading,
    error,
    createCall,
    deleteCall,
    toggleCall,
    hasCallOnDate,
    refreshCalls: loadCalls,
  };
}

// Hook to fetch a friend's calls (with shift type for overlap calendar)
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { ShiftType } from '../types/database';

interface FriendCall {
  id: string;
  call_date: string;
  shift_type: ShiftType;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useFriendCalls(friendId: string | null) {
  const [calls, setCalls] = useState<FriendCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!friendId) {
      setCalls([]);
      return;
    }

    const loadCalls = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch 3 months: 1 month back + 2 months forward (for calendar navigation)
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        const end = new Date();
        end.setMonth(end.getMonth() + 3);
        end.setDate(0); // last day of month+2

        // RLS policy "Friends can view shifts" allows this
        const { data, error: fetchError } = await supabase
          .from('calls')
          .select('id, call_date, shift_type')
          .eq('user_id', friendId)
          .gte('call_date', formatDate(start))
          .lte('call_date', formatDate(end))
          .order('call_date', { ascending: true });

        if (fetchError) throw fetchError;

        setCalls((data || []) as FriendCall[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calls');
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
  }, [friendId]);

  // Build a Map<string, ShiftType> for calendar lookup
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftType>();
    calls.forEach((c) => map.set(c.call_date, c.shift_type));
    return map;
  }, [calls]);

  return { calls, shiftMap, loading, error };
}

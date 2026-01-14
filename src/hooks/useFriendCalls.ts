// Hook to fetch a friend's upcoming calls
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayDate } from '../utils/date';

interface FriendCall {
  id: string;
  call_date: string;
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
        const today = getTodayDate();

        // Calculate date 30 days from now
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const endDate = `${thirtyDaysLater.getFullYear()}-${String(thirtyDaysLater.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysLater.getDate()).padStart(2, '0')}`;

        // Fetch friend's calls for next 30 days
        // RLS policy "Friends can view shifts" allows this
        const { data, error: fetchError } = await supabase
          .from('calls')
          .select('id, call_date')
          .eq('user_id', friendId)
          .gte('call_date', today)
          .lte('call_date', endDate)
          .order('call_date', { ascending: true });

        if (fetchError) throw fetchError;

        setCalls(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calls');
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
  }, [friendId]);

  return { calls, loading, error };
}

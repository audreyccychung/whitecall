// Group leaderboard hook - fetches hearts sent by group members
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
import type { LeaderboardEntry, GetLeaderboardCode } from '../types/group';

// Exhaustive mapping: every code maps to exactly one message
const LEADERBOARD_MESSAGES: Record<GetLeaderboardCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'Please log in to view the leaderboard.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_A_MEMBER: 'You are not a member of this group.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function useGroupLeaderboard(groupId: string | undefined, days: number = 7) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('get_group_heart_leaderboard', {
          p_group_id: groupId,
          p_days: days,
        });

        if (rpcError) throw rpcError;

        const result = handleRpcResponse<{ code: string; leaderboard?: LeaderboardEntry[]; detail?: string }>(data);
        const code = result.code as GetLeaderboardCode;

        if (code !== 'SUCCESS') {
          setError(LEADERBOARD_MESSAGES[code] || LEADERBOARD_MESSAGES.UNKNOWN_ERROR);
          setLeaderboard([]);
          return;
        }

        setLeaderboard(result.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [groupId, days]);

  return { leaderboard, loading, error };
}

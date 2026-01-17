// Friend management hook
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Friend,
  AddFriendResult,
  AddFriendCode,
  RemoveFriendResult,
  RemoveFriendCode,
} from '../types/friend';

// Exhaustive mapping: every code maps to exactly one message
const ADD_FRIEND_MESSAGES: Record<AddFriendCode, string> = {
  SUCCESS: 'Friend added!',
  USER_NOT_FOUND: 'User not found. Check the username and try again.',
  ALREADY_FRIENDS: 'You are already friends with this user.',
  CANNOT_ADD_SELF: 'You cannot add yourself as a friend.',
  UNAUTHORIZED: 'You must be logged in to add friends.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const REMOVE_FRIEND_MESSAGES: Record<RemoveFriendCode, string> = {
  SUCCESS: 'Friend removed.',
  NOT_FRIENDS: 'You are not friends with this user.',
  CANNOT_REMOVE_SELF: 'You cannot remove yourself.',
  UNAUTHORIZED: 'You must be logged in to remove friends.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};
import { getTodayDate } from '../utils/date';

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Module-level cache to persist across component remounts
// This allows instant navigation when data is fresh
const friendsCache = {
  data: [] as Friend[],
  lastFetchedAt: 0,
  userId: null as string | null,
};

export function useFriends(userId: string | undefined) {
  // Initialize from cache if same user (regardless of staleness for initial render)
  // This prevents loading spinner on remounts - we show cached data immediately
  // and refresh in background if stale
  const hasCachedData =
    userId &&
    friendsCache.userId === userId &&
    friendsCache.data.length > 0;

  const [friends, setFriends] = useState<Friend[]>(hasCachedData ? friendsCache.data : []);
  // Only show loading spinner if we have NO cached data at all
  const [isInitialLoad, setIsInitialLoad] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<number>(hasCachedData ? friendsCache.lastFetchedAt : 0);
  // Mutation lock: prevents background refetch from overwriting optimistic updates
  const pendingMutations = useRef<number>(0);

  // Load friends with their active call status
  const loadFriends = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    // Skip if mutations are pending (prevents overwriting optimistic updates)
    if (pendingMutations.current > 0 && !force) {
      return;
    }

    // Skip if data is fresh (unless forced) - don't touch loading state
    if (!force && Date.now() - lastFetchedAt.current < STALE_TIME_MS) {
      return;
    }

    if (!userId) {
      setIsInitialLoad(false);
      return;
    }

    try {
      setError(null);

      // Get friendships and join with profiles
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('id, friend_id')
        .eq('user_id', userId);

      if (friendshipsError) throw friendshipsError;

      if (!friendshipsData || friendshipsData.length === 0) {
        setFriends([]);
        lastFetchedAt.current = Date.now();
        friendsCache.data = [];
        friendsCache.lastFetchedAt = lastFetchedAt.current;
        friendsCache.userId = userId;
        return;
      }

      const friendIds = friendshipsData.map((f) => f.friend_id);
      const today = getTodayDate();

      // Fetch all supplementary data in parallel (profiles, calls, hearts)
      const [profilesResult, activeCallsResult, upcomingCallsResult, heartsResult] =
        await Promise.all([
          // Get friend profiles
          supabase
            .from('profiles')
            .select('id, username, display_name, avatar_type, avatar_color')
            .in('id', friendIds),
          // Get friends who have a call today
          supabase
            .from('calls')
            .select('user_id')
            .in('user_id', friendIds)
            .eq('call_date', today),
          // Get each friend's next call date (today or future)
          supabase
            .from('calls')
            .select('user_id, call_date')
            .in('user_id', friendIds)
            .gte('call_date', today)
            .order('call_date', { ascending: true }),
          // Get hearts sent today to each friend
          supabase
            .from('hearts')
            .select('recipient_id')
            .eq('sender_id', userId)
            .eq('shift_date', today),
        ]);

      // Check for errors (only profiles is critical)
      if (profilesResult.error) throw profilesResult.error;

      const profilesData = profilesResult.data;
      const friendsOnCall = new Set(activeCallsResult.data?.map((c) => c.user_id) || []);

      // Map friend ID to their next call date (first occurrence)
      const nextCallByFriend = new Map<string, string>();
      for (const call of upcomingCallsResult.data || []) {
        if (!nextCallByFriend.has(call.user_id)) {
          nextCallByFriend.set(call.user_id, call.call_date);
        }
      }

      const heartsSentTo = new Set(heartsResult.data?.map((h) => h.recipient_id) || []);

      // Combine data
      const friendsList: Friend[] =
        profilesData?.map((profile) => {
          const friendship = friendshipsData.find((f) => f.friend_id === profile.id);
          return {
            ...profile,
            friendship_id: friendship?.id || '',
            is_on_call: friendsOnCall.has(profile.id),
            next_call_date: nextCallByFriend.get(profile.id),
            can_send_heart: !heartsSentTo.has(profile.id),
          };
        }) || [];

      setFriends(friendsList);
      lastFetchedAt.current = Date.now();
      // Update module-level cache for instant remounts
      friendsCache.data = friendsList;
      friendsCache.lastFetchedAt = lastFetchedAt.current;
      friendsCache.userId = userId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setIsInitialLoad(false);
    }
  };

  // Track previous userId to detect actual user changes vs remounts
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const isUserChange = prevUserIdRef.current !== userId;
    prevUserIdRef.current = userId;

    // Force refetch only on actual userId change (login/logout)
    // On remount with same user, respect stale-time to preserve optimistic updates
    if (isUserChange) {
      loadFriends({ force: true });
    } else {
      loadFriends(); // Respects stale-time check
    }
  }, [userId]);

  // Refetch on visibility change (more reliable than focus for mobile/PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFriends(); // Stale-time check happens inside
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Add friend by username - calls DB function, no app-level validation
  const addFriend = async (username: string): Promise<AddFriendResult> => {
    // Call the single source of truth: add_friend DB function
    const { data, error } = await supabase.rpc('add_friend', {
      friend_username: username.trim(),
    });

    // Network or RPC error
    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: ADD_FRIEND_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Normalize response: handle string, object, or unexpected shapes
    let result: { code?: string };
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch {
        result = {};
      }
    } else if (data && typeof data === 'object') {
      result = data;
    } else {
      result = {};
    }

    const code = (result.code as AddFriendCode) || 'UNKNOWN_ERROR';
    const message = ADD_FRIEND_MESSAGES[code];

    if (code === 'SUCCESS') {
      // Refetch friends list to get real data (is_on_call, can_send_heart)
      await loadFriends({ force: true });
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  // Remove friend by friend_id - calls DB function, no app-level validation
  const removeFriend = async (friendId: string): Promise<RemoveFriendResult> => {
    // Call the single source of truth: remove_friend DB function
    const { data, error } = await supabase.rpc('remove_friend', {
      p_friend_id: friendId,
    });

    // Network or RPC error
    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: REMOVE_FRIEND_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Normalize response: handle string, object, or unexpected shapes
    let result: { code?: string };
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch {
        result = {};
      }
    } else if (data && typeof data === 'object') {
      result = data;
    } else {
      result = {};
    }

    const code = (result.code as RemoveFriendCode) || 'UNKNOWN_ERROR';
    const message = REMOVE_FRIEND_MESSAGES[code];

    if (code === 'SUCCESS') {
      // Refetch friends list to confirm deletion (no state guessing)
      await loadFriends({ force: true });
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  // Update a single friend's can_send_heart status locally (for optimistic UI)
  // Also updates cache to keep remounts consistent
  const updateFriendHeartStatus = (friendId: string, canSendHeart: boolean) => {
    setFriends((prev) => {
      const updated = prev.map((f) =>
        f.id === friendId ? { ...f, can_send_heart: canSendHeart } : f
      );
      friendsCache.data = updated;
      return updated;
    });
  };

  // Mutation lock helpers - prevents background refetch from overwriting optimistic updates
  const beginMutation = () => {
    pendingMutations.current += 1;
  };

  const endMutation = () => {
    pendingMutations.current = Math.max(0, pendingMutations.current - 1);
  };

  return {
    friends,
    loading: isInitialLoad, // Only true until first successful load
    error,
    addFriend,
    removeFriend,
    refreshFriends: loadFriends,
    updateFriendHeartStatus,
    beginMutation,
    endMutation,
  };
}

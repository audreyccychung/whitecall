// Friend management hook
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
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
// NOTE: No date imports - all date logic is handled by backend (timezone-aware)

export interface UseFriendsResult {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  addFriend: (username: string) => Promise<AddFriendResult>;
  removeFriend: (friendId: string) => Promise<RemoveFriendResult>;
  refreshFriends: (options?: { force?: boolean }) => Promise<void>;
  updateFriendHeartStatus: (friendId: string, canSendHeart: boolean) => void;
  beginMutation: () => () => void;
}

// Stale time: don't refetch if data is less than 30 seconds old
const STALE_TIME_MS = 30_000;

// Mutation lock timeout: auto-release if mutation hangs
const MUTATION_TIMEOUT_MS = 30_000;

// Module-level cache to persist across component remounts
// This allows instant navigation when data is fresh
const friendsCache = {
  data: [] as Friend[],
  lastFetchedAt: 0,
  userId: null as string | null,
  // Mutation lock: token-based to prevent double-decrement bugs
  // Each mutation gets a unique token, auto-cleaned after timeout
  pendingMutations: new Set<string>(),
  // Request deduplication: prevents duplicate fetches when multiple components mount
  loadingPromise: null as Promise<void> | null,
};

// Clear cache on logout (called from AuthContext)
export function clearFriendsCache() {
  friendsCache.data = [];
  friendsCache.lastFetchedAt = 0;
  friendsCache.userId = null;
  friendsCache.pendingMutations.clear();
  friendsCache.loadingPromise = null;
}

export function useFriends(userId: string | undefined): UseFriendsResult {
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

  // Load friends with their active call status
  // Uses request deduplication to prevent duplicate fetches when multiple components mount
  const loadFriends = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    // Skip if mutations are pending (prevents overwriting optimistic updates)
    // Uses module-level Set so all hook instances respect the lock
    if (friendsCache.pendingMutations.size > 0 && !force) {
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

    // Request deduplication: if a fetch is already in progress, wait for it
    if (friendsCache.loadingPromise) {
      return friendsCache.loadingPromise;
    }

    // Wrap the fetch in a promise and store it for deduplication
    friendsCache.loadingPromise = (async () => {
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

        // Fetch profiles and timezone-aware status in parallel
        // Status (is_on_call, can_send_heart, next_call_date) comes from DB function
        // This ensures backend is single source of truth for all date calculations
        const [profilesResult, statusResult] = await Promise.all([
          // Get friend profiles
          supabase
            .from('profiles')
            .select('id, username, display_name, avatar_type, avatar_color')
            .in('id', friendIds),
          // Get all friend status data from timezone-aware DB function
          supabase.rpc('get_friends_with_status'),
        ]);

        // Check for errors (only profiles is critical)
        if (profilesResult.error) throw profilesResult.error;

        const profilesData = profilesResult.data;

        // Build lookup map from status results
        type FriendStatus = {
          friend_id: string;
          is_on_call: boolean;
          can_send_heart: boolean;
          next_call_date: string | null;
        };
        const statusByFriend = new Map<string, FriendStatus>();
        for (const status of (statusResult.data || []) as FriendStatus[]) {
          statusByFriend.set(status.friend_id, status);
        }

        // Combine data - all date-dependent fields come from backend
        const friendsList: Friend[] =
          profilesData?.map((profile) => {
            const friendship = friendshipsData.find((f) => f.friend_id === profile.id);
            const status = statusByFriend.get(profile.id);
            return {
              ...profile,
              friendship_id: friendship?.id || '',
              is_on_call: status?.is_on_call ?? false,
              next_call_date: status?.next_call_date ?? undefined,
              can_send_heart: status?.can_send_heart ?? true,
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
    })();

    // Wait for the fetch, then clear the promise
    await friendsCache.loadingPromise;
    friendsCache.loadingPromise = null;
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

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as AddFriendCode;
    const message = ADD_FRIEND_MESSAGES[code] || ADD_FRIEND_MESSAGES.UNKNOWN_ERROR;

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

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as RemoveFriendCode;
    const message = REMOVE_FRIEND_MESSAGES[code] || REMOVE_FRIEND_MESSAGES.UNKNOWN_ERROR;

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

  /**
   * Token-based mutation lock.
   * Returns a release function that safely cleans up the lock.
   * Auto-releases after timeout to prevent UI freezing if mutation hangs.
   *
   * Usage:
   *   const release = beginMutation();
   *   try { await mutation(); }
   *   finally { release(); }
   */
  const beginMutation = (): (() => void) => {
    const token = crypto.randomUUID();
    friendsCache.pendingMutations.add(token);

    // Auto-release after timeout (safety net for hung mutations)
    const timeoutId = setTimeout(() => {
      friendsCache.pendingMutations.delete(token);
    }, MUTATION_TIMEOUT_MS);

    // Return release function
    return () => {
      clearTimeout(timeoutId);
      friendsCache.pendingMutations.delete(token);
    };
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
  };
}

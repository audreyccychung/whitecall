// Friend management hook
import { useState, useEffect } from 'react';
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

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load friends with their active call status
  const loadFriends = async () => {
    if (!userId) {
      setInitialLoading(false);
      return;
    }

    // Only show loading spinner on initial load (no data yet)
    const isInitialLoad = friends.length === 0;

    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      }
      setError(null);

      // Get friendships and join with profiles
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('id, friend_id')
        .eq('user_id', userId);

      if (friendshipsError) throw friendshipsError;

      if (!friendshipsData || friendshipsData.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendshipsData.map((f) => f.friend_id);

      // Get friend profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_type, avatar_color')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Get friends who have a call today (date-based, no time)
      const today = getTodayDate();
      const { data: activeCalls } = await supabase
        .from('calls')
        .select('user_id')
        .in('user_id', friendIds)
        .eq('call_date', today);

      const friendsOnCall = new Set(activeCalls?.map((c) => c.user_id) || []);

      // Get each friend's next call date (today or future, within 7 days)
      const { data: upcomingCalls } = await supabase
        .from('calls')
        .select('user_id, call_date')
        .in('user_id', friendIds)
        .gte('call_date', today)
        .order('call_date', { ascending: true });

      // Map friend ID to their next call date (first occurrence)
      const nextCallByFriend = new Map<string, string>();
      for (const call of upcomingCalls || []) {
        if (!nextCallByFriend.has(call.user_id)) {
          nextCallByFriend.set(call.user_id, call.call_date);
        }
      }

      // Get hearts sent today to each friend
      const { data: heartsData } = await supabase
        .from('hearts')
        .select('recipient_id')
        .eq('sender_id', userId)
        .eq('shift_date', today);

      const heartsSentTo = new Set(heartsData?.map((h) => h.recipient_id) || []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [userId]);

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => {
      loadFriends();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
      await loadFriends();
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
      await loadFriends();
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  return {
    friends,
    loading: initialLoading,
    error,
    addFriend,
    removeFriend,
    refreshFriends: loadFriends,
  };
}

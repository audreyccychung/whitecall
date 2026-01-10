// Friend management hook
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Friend, AddFriendResult } from '../types/friend';
import { getTodayDate } from '../utils/date';

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load friends
  const loadFriends = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
        .select('id, username, display_name, avatar_type, avatar_color, is_on_call, call_date')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Get hearts sent today to each friend
      const today = getTodayDate();
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
            can_send_heart: !heartsSentTo.has(profile.id),
          };
        }) || [];

      setFriends(friendsList);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [userId]);

  // Add friend by username
  const addFriend = async (username: string): Promise<AddFriendResult> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      // Find user by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_type, avatar_color, is_on_call, call_date')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        return { success: false, error: 'User not found' };
      }

      if (profileData.id === userId) {
        return { success: false, error: 'Cannot add yourself as a friend' };
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_id', profileData.id)
        .single();

      if (existingFriendship) {
        return { success: false, error: 'Already friends with this user' };
      }

      // Create bidirectional friendship
      const { data: friendship1, error: error1 } = await supabase
        .from('friendships')
        .insert({ user_id: userId, friend_id: profileData.id })
        .select()
        .single();

      const { error: error2 } = await supabase
        .from('friendships')
        .insert({ user_id: profileData.id, friend_id: userId });

      if (error1 || error2) {
        throw error1 || error2;
      }

      const newFriend: Friend = {
        ...profileData,
        friendship_id: friendship1.id,
        can_send_heart: true,
      };

      setFriends((prev) => [...prev, newFriend]);

      return { success: true, friend: newFriend };
    } catch (err) {
      console.error('Error adding friend:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add friend',
      };
    }
  };

  // Remove friend
  const removeFriend = async (friendshipId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Delete both directions of friendship
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId));
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      return false;
    }
  };

  return {
    friends,
    loading,
    error,
    addFriend,
    removeFriend,
    refreshFriends: loadFriends,
  };
}

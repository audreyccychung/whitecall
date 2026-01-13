// Group members management hook
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
  GroupMember,
  AddMemberResult,
  AddMemberCode,
  RemoveMemberResult,
  RemoveMemberCode,
} from '../types/group';

// Exhaustive mapping: every code maps to exactly one message
const ADD_MEMBER_MESSAGES: Record<AddMemberCode, string> = {
  SUCCESS: 'Member added!',
  UNAUTHORIZED: 'You must be logged in.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_OWNER: 'Only the group creator can add members.',
  USER_NOT_FOUND: 'User not found. Check the username.',
  ALREADY_MEMBER: 'This user is already in the group.',
  GROUP_FULL: 'Group is full (max 20 members).',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const REMOVE_MEMBER_MESSAGES: Record<RemoveMemberCode, string> = {
  SUCCESS: 'Member removed.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_OWNER: 'Only the group creator can remove members.',
  CANNOT_REMOVE_SELF: 'You cannot remove yourself. Delete the group instead.',
  MEMBER_NOT_FOUND: 'Member not found in this group.',
  UNAUTHORIZED: 'You must be logged in.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function useGroupMembers(groupId: string | undefined) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load group members with profile data
  const loadMembers = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }

      // Get profiles for all members
      const userIds = membersData.map((m) => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_type, avatar_color')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      // Combine data
      const membersList: GroupMember[] = membersData
        .map((member) => {
          const profile = profileMap.get(member.user_id);
          if (!profile) return null;
          return {
            ...member,
            username: profile.username,
            display_name: profile.display_name,
            avatar_type: profile.avatar_type,
            avatar_color: profile.avatar_color,
          };
        })
        .filter((m): m is GroupMember => m !== null);

      setMembers(membersList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  // Add member - calls DB function
  const addMember = async (username: string): Promise<AddMemberResult> => {
    if (!groupId) {
      return {
        success: false,
        code: 'GROUP_NOT_FOUND',
        error: ADD_MEMBER_MESSAGES.GROUP_NOT_FOUND,
      };
    }

    const { data, error } = await supabase.rpc('add_group_member', {
      p_group_id: groupId,
      member_username: username.trim(),
    });

    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: ADD_MEMBER_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Normalize response
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

    const code = (result.code as AddMemberCode) || 'UNKNOWN_ERROR';
    const message = ADD_MEMBER_MESSAGES[code];

    if (code === 'SUCCESS') {
      await loadMembers();
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  // Remove member - calls DB function
  const removeMember = async (memberId: string): Promise<RemoveMemberResult> => {
    if (!groupId) {
      return {
        success: false,
        code: 'GROUP_NOT_FOUND',
        error: REMOVE_MEMBER_MESSAGES.GROUP_NOT_FOUND,
      };
    }

    const { data, error } = await supabase.rpc('remove_group_member', {
      p_group_id: groupId,
      p_member_id: memberId,
    });

    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: REMOVE_MEMBER_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Normalize response
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

    const code = (result.code as RemoveMemberCode) || 'UNKNOWN_ERROR';
    const message = REMOVE_MEMBER_MESSAGES[code];

    if (code === 'SUCCESS') {
      await loadMembers();
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    refreshMembers: loadMembers,
  };
}

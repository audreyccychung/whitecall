// Group members management hook
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
import type {
  GroupMember,
  AddMemberResult,
  AddMemberCode,
  RemoveMemberResult,
  RemoveMemberCode,
  LeaveGroupResult,
  LeaveGroupCode,
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

const LEAVE_GROUP_MESSAGES: Record<LeaveGroupCode, string> = {
  SUCCESS: 'You left the group.',
  UNAUTHORIZED: 'You must be logged in.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_A_MEMBER: 'You are not a member of this group.',
  OWNER_CANNOT_LEAVE: 'Group owners cannot leave. Delete the group instead.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function useGroupMembers(groupId: string | undefined) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load group members via RPC (allows all members to see each other)
  const loadMembers = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use get_group_members RPC - returns all members for any group member
      const { data, error: rpcError } = await supabase.rpc('get_group_members', {
        p_group_id: groupId,
      });

      if (rpcError) throw rpcError;

      // Use centralized RPC response handling
      const result = handleRpcResponse<{ code: string; members?: GroupMember[]; detail?: string }>(data);

      if (result.code === 'UNAUTHORIZED') {
        setError('Please log in to view members.');
        setMembers([]);
        return;
      }

      if (result.code === 'GROUP_NOT_FOUND') {
        setError('Group not found.');
        setMembers([]);
        return;
      }

      if (result.code === 'NOT_A_MEMBER') {
        setError('You are not a member of this group.');
        setMembers([]);
        return;
      }

      if (result.code === 'UNKNOWN_ERROR') {
        throw new Error(result.detail || 'Failed to load members');
      }

      // SUCCESS - set members from RPC response
      const membersList: GroupMember[] = (result.members || []).map((m: GroupMember) => ({
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        username: m.username,
        display_name: m.display_name,
        avatar_type: m.avatar_type,
        avatar_color: m.avatar_color,
        is_on_call: m.is_on_call ?? false,
        next_call_date: m.next_call_date ?? null,
      }));

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

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as AddMemberCode;
    const message = ADD_MEMBER_MESSAGES[code] || ADD_MEMBER_MESSAGES.UNKNOWN_ERROR;

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

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as RemoveMemberCode;
    const message = REMOVE_MEMBER_MESSAGES[code] || REMOVE_MEMBER_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
      await loadMembers();
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  // Leave group - user removes themselves
  const leaveGroup = async (): Promise<LeaveGroupResult> => {
    if (!groupId) {
      return {
        success: false,
        code: 'GROUP_NOT_FOUND',
        error: LEAVE_GROUP_MESSAGES.GROUP_NOT_FOUND,
      };
    }

    const { data, error } = await supabase.rpc('leave_group', {
      p_group_id: groupId,
    });

    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: LEAVE_GROUP_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as LeaveGroupCode;
    const message = LEAVE_GROUP_MESSAGES[code] || LEAVE_GROUP_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
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
    leaveGroup,
    refreshMembers: loadMembers,
  };
}

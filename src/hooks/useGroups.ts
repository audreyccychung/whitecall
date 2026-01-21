// Group management hook
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
import type {
  Group,
  CreateGroupResult,
  CreateGroupCode,
  DeleteGroupResult,
  DeleteGroupCode,
} from '../types/group';

// Exhaustive mapping: every code maps to exactly one message
const CREATE_GROUP_MESSAGES: Record<CreateGroupCode, string> = {
  SUCCESS: 'Group created!',
  INVALID_NAME: 'Group name must be 3-30 characters.',
  UNAUTHORIZED: 'You must be logged in to create groups.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const DELETE_GROUP_MESSAGES: Record<DeleteGroupCode, string> = {
  SUCCESS: 'Group deleted.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_OWNER: 'Only the group creator can delete this group.',
  UNAUTHORIZED: 'You must be logged in to delete groups.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's groups via RPC (allows non-owners to see groups they belong to)
  const loadGroups = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use get_my_groups RPC - returns all groups user is a member of
      const { data, error: rpcError } = await supabase.rpc('get_my_groups');

      if (rpcError) throw rpcError;

      // Use centralized RPC response handling
      const result = handleRpcResponse<{ code: string; groups?: Group[]; detail?: string }>(data);

      if (result.code === 'UNAUTHORIZED') {
        setError('Please log in to view groups.');
        setGroups([]);
        return;
      }

      if (result.code === 'UNKNOWN_ERROR') {
        throw new Error(result.detail || 'Failed to load groups');
      }

      // SUCCESS - set groups from RPC response
      const groupsList: Group[] = (result.groups || []).map((g: Group) => ({
        id: g.id,
        name: g.name,
        created_by: g.created_by,
        created_at: g.created_at,
        member_count: g.member_count || 0,
        is_owner: g.is_owner || false,
      }));

      setGroups(groupsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [userId]);

  // Create group - calls DB function, no app-level validation
  const createGroup = async (name: string): Promise<CreateGroupResult> => {
    const { data, error } = await supabase.rpc('create_group', {
      group_name: name.trim(),
    });

    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: CREATE_GROUP_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string; group_id?: string }>(data);
    const code = result.code as CreateGroupCode;
    const message = CREATE_GROUP_MESSAGES[code] || CREATE_GROUP_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
      await loadGroups();
      return { success: true, code, group_id: result.group_id };
    }

    return { success: false, code, error: message };
  };

  // Delete group - calls DB function
  const deleteGroup = async (groupId: string): Promise<DeleteGroupResult> => {
    const { data, error } = await supabase.rpc('delete_group', {
      p_group_id: groupId,
    });

    if (error) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        error: DELETE_GROUP_MESSAGES.UNKNOWN_ERROR,
      };
    }

    // Use centralized RPC response handling
    const result = handleRpcResponse<{ code: string }>(data);
    const code = result.code as DeleteGroupCode;
    const message = DELETE_GROUP_MESSAGES[code] || DELETE_GROUP_MESSAGES.UNKNOWN_ERROR;

    if (code === 'SUCCESS') {
      await loadGroups();
      return { success: true, code };
    }

    return { success: false, code, error: message };
  };

  return {
    groups,
    loading,
    error,
    createGroup,
    deleteGroup,
    refreshGroups: loadGroups,
  };
}

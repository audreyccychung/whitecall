// Group management hook
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

  // Load user's groups with member counts
  const loadGroups = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get groups the user has access to (via RLS)
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, created_by, created_at')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      if (!groupsData || groupsData.length === 0) {
        setGroups([]);
        return;
      }

      // Get member counts for each group
      const groupIds = groupsData.map((g) => g.id);
      const { data: memberCounts } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      // Count members per group
      const countByGroup = new Map<string, number>();
      for (const member of memberCounts || []) {
        countByGroup.set(member.group_id, (countByGroup.get(member.group_id) || 0) + 1);
      }

      // Combine data
      const groupsList: Group[] = groupsData.map((group) => ({
        ...group,
        member_count: countByGroup.get(group.id) || 0,
        is_owner: group.created_by === userId,
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

    // Normalize response
    let result: { code?: string; group_id?: string };
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

    const code = (result.code as CreateGroupCode) || 'UNKNOWN_ERROR';
    const message = CREATE_GROUP_MESSAGES[code];

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

    const code = (result.code as DeleteGroupCode) || 'UNKNOWN_ERROR';
    const message = DELETE_GROUP_MESSAGES[code];

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

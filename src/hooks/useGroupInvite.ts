// Hook for group invite code operations
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  GenerateInviteCodeResult,
  GenerateInviteCodeCode,
  JoinGroupByCodeResult,
  JoinGroupByCodeCode,
  InviteCodeInfo,
} from '../types/group';

// Exhaustive message mappings
const GENERATE_CODE_MESSAGES: Record<GenerateInviteCodeCode, string> = {
  SUCCESS: 'Invite link created!',
  UNAUTHORIZED: 'You must be logged in.',
  GROUP_NOT_FOUND: 'Group not found.',
  NOT_OWNER: 'Only the group owner can create invite links.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

const JOIN_CODE_MESSAGES: Record<JoinGroupByCodeCode, string> = {
  SUCCESS: 'You joined the group!',
  UNAUTHORIZED: 'You must be logged in to join.',
  INVALID_CODE: 'This invite link is invalid.',
  CODE_EXPIRED: 'This invite link has expired.',
  ALREADY_MEMBER: 'You are already a member of this group.',
  GROUP_FULL: 'This group is full (max 20 members).',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function useGroupInvite() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // Generate an invite code for a group (owner only)
  const generateInviteCode = useCallback(async (groupId: string): Promise<{
    success: boolean;
    inviteCode?: string;
    expiresAt?: string;
    message: string;
  }> => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.rpc('generate_invite_code', {
        p_group_id: groupId,
      });

      if (error) throw error;

      const result = data as GenerateInviteCodeResult;
      const message = GENERATE_CODE_MESSAGES[result.code] || GENERATE_CODE_MESSAGES.UNKNOWN_ERROR;

      if (result.success) {
        return {
          success: true,
          inviteCode: result.invite_code,
          expiresAt: result.expires_at,
          message,
        };
      }

      return { success: false, message };
    } catch (err) {
      console.error('[useGroupInvite] generateInviteCode error:', err);
      return { success: false, message: GENERATE_CODE_MESSAGES.UNKNOWN_ERROR };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Join a group using an invite code
  const joinGroupByCode = useCallback(async (code: string): Promise<{
    success: boolean;
    groupId?: string;
    groupName?: string;
    message: string;
    code: JoinGroupByCodeCode;
  }> => {
    setIsJoining(true);

    try {
      const { data, error } = await supabase.rpc('join_group_by_code', {
        p_code: code,
      });

      if (error) throw error;

      const result = data as JoinGroupByCodeResult;
      const message = JOIN_CODE_MESSAGES[result.code] || JOIN_CODE_MESSAGES.UNKNOWN_ERROR;

      return {
        success: result.success,
        groupId: result.group_id,
        groupName: result.group_name,
        message,
        code: result.code,
      };
    } catch (err) {
      console.error('[useGroupInvite] joinGroupByCode error:', err);
      return {
        success: false,
        message: JOIN_CODE_MESSAGES.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
      };
    } finally {
      setIsJoining(false);
    }
  }, []);

  // Get info about an invite code (can be called without auth)
  const getInviteCodeInfo = useCallback(async (code: string): Promise<InviteCodeInfo> => {
    setIsLoadingInfo(true);

    try {
      const { data, error } = await supabase.rpc('get_invite_code_info', {
        p_code: code,
      });

      if (error) throw error;

      return data as InviteCodeInfo;
    } catch (err) {
      console.error('[useGroupInvite] getInviteCodeInfo error:', err);
      return { valid: false, reason: 'UNKNOWN_ERROR' };
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  // Build the full invite URL
  const buildInviteUrl = useCallback((inviteCode: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${inviteCode}`;
  }, []);

  return {
    generateInviteCode,
    joinGroupByCode,
    getInviteCodeInfo,
    buildInviteUrl,
    isGenerating,
    isJoining,
    isLoadingInfo,
  };
}

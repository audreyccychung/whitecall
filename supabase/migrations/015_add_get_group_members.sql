-- Migration: Add get_group_members RPC for non-owner member visibility
-- Date: 2026-01-17
-- Description: Allow all group members to see other members (pulled from V1.0 to V0.9)
--
-- PROBLEM: RLS policy on group_members only lets non-owners see their own row
--          Non-owner members cannot see other members or the creator
--
-- SOLUTION: SECURITY DEFINER RPC that:
--   1. Verifies user is a member of the group
--   2. Returns all members with profile data
--   Bypasses RLS safely, no changes to existing policies
--
-- RESULT CODES:
--   SUCCESS - Returns members array
--   UNAUTHORIZED - User not logged in
--   GROUP_NOT_FOUND - Invalid group ID
--   NOT_A_MEMBER - User is not a member of this group
--   UNKNOWN_ERROR - Unexpected failure (detail in response)

CREATE OR REPLACE FUNCTION get_group_members(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_members JSON;
BEGIN
  v_user_id := auth.uid();

  -- Check authentication
  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Check group exists
  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  -- Check user is a member of this group
  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;

  -- Get all group members with profile data
  SELECT json_agg(member_data) INTO v_members
  FROM (
    SELECT
      gm.id,
      gm.group_id,
      gm.user_id,
      gm.joined_at,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color
    FROM group_members gm
    INNER JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at
  ) member_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'members', COALESCE(v_members, '[]'::json)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_group_members(UUID) TO authenticated;

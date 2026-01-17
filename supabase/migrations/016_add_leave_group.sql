-- Migration: Add leave_group RPC
-- Date: 2026-01-18
-- Description: Allow non-owner members to leave a group
--
-- Result codes:
--   SUCCESS - User left the group
--   UNAUTHORIZED - User not logged in
--   GROUP_NOT_FOUND - Invalid group ID
--   NOT_A_MEMBER - User is not in this group
--   OWNER_CANNOT_LEAVE - Owners must delete the group instead
--   UNKNOWN_ERROR - Unexpected failure

CREATE OR REPLACE FUNCTION leave_group(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Check group exists
  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  -- Check user is a member
  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;

  -- Check if user is owner
  SELECT (created_by = v_user_id) INTO v_is_owner FROM groups WHERE id = p_group_id;
  IF v_is_owner THEN
    RETURN '{"code": "OWNER_CANNOT_LEAVE"}'::JSON;
  END IF;

  -- Remove membership
  DELETE FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id;

  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

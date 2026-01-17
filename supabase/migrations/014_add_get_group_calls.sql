-- Migration: Add get_group_calls RPC for group calendar
-- Date: 2026-01-17
-- Description: Fetch calls for all group members in a date range (V0.9 Group Calendar)
--
-- PROBLEM: calls table RLS only allows viewing friend's calls via friendships table
--          Group membership alone doesn't grant call visibility
--
-- SOLUTION: SECURITY DEFINER RPC that:
--   1. Verifies user is a member of the group
--   2. Fetches all members with profile data
--   3. Fetches all calls for those members in date range
--   Bypasses RLS safely, no changes to existing policies
--
-- RESULT CODES:
--   SUCCESS - Returns members and calls arrays
--   UNAUTHORIZED - User not logged in
--   GROUP_NOT_FOUND - Invalid group ID
--   NOT_A_MEMBER - User is not a member of this group
--   INVALID_DATE_RANGE - Start > end, or range > 30 days
--   UNKNOWN_ERROR - Unexpected failure (detail in response)

CREATE OR REPLACE FUNCTION get_group_calls(
  p_group_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_members JSON;
  v_calls JSON;
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

  -- Validate date range (max 30 days to prevent abuse)
  IF p_start_date > p_end_date OR (p_end_date - p_start_date) > 30 THEN
    RETURN '{"code": "INVALID_DATE_RANGE"}'::JSON;
  END IF;

  -- Get all group members with profile data
  SELECT json_agg(member_data) INTO v_members
  FROM (
    SELECT
      p.id as user_id,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color
    FROM group_members gm
    INNER JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at
  ) member_data;

  -- Get all calls for group members in date range
  SELECT json_agg(call_data) INTO v_calls
  FROM (
    SELECT
      c.user_id,
      c.call_date
    FROM calls c
    WHERE c.user_id IN (
      SELECT user_id FROM group_members WHERE group_id = p_group_id
    )
    AND c.call_date >= p_start_date
    AND c.call_date <= p_end_date
    ORDER BY c.call_date, c.user_id
  ) call_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'members', COALESCE(v_members, '[]'::json),
    'calls', COALESCE(v_calls, '[]'::json)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_group_calls(UUID, DATE, DATE) TO authenticated;

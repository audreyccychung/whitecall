-- Migration: Add get_my_groups RPC for non-owner group visibility
-- Date: 2026-01-17
-- Description: Allow group members to see groups they belong to (pulled from V1.0 to V0.9)
--
-- PROBLEM: V0.6 RLS only shows groups where created_by = auth.uid()
--          Non-owner members cannot see groups they belong to
--
-- SOLUTION: SECURITY DEFINER RPC that queries group_members directly
--           Bypasses RLS safely, returns enriched group data
--
-- RESULT CODES:
--   SUCCESS - Returns groups array (may be empty)
--   UNAUTHORIZED - User not logged in
--   UNKNOWN_ERROR - Unexpected failure (detail in response)

CREATE OR REPLACE FUNCTION get_my_groups()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_groups JSON;
BEGIN
  v_user_id := auth.uid();

  -- Check authentication
  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Fetch all groups where user is a member
  -- Includes groups user created AND groups they were added to
  SELECT json_agg(group_data) INTO v_groups
  FROM (
    SELECT
      g.id,
      g.name,
      g.created_by,
      g.created_at,
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
      (g.created_by = v_user_id) as is_owner
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = v_user_id
    ORDER BY g.created_at DESC
  ) group_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'groups', COALESCE(v_groups, '[]'::json)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_groups() TO authenticated;

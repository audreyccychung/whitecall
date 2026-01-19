-- Migration: Update get_group_members to include call status
-- Date: 2026-01-19
-- Description: Add is_on_call and next_call_date to group members response
--              Uses member's timezone for date calculations (single source of truth)
--
-- CHANGES:
--   - is_on_call: true if member has a call today (in their timezone)
--   - next_call_date: member's next scheduled call date (null if none)

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

  -- Get all group members with profile data and call status
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
      p.avatar_color,
      -- is_on_call: check if member has a call today (in their timezone)
      EXISTS(
        SELECT 1 FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date = (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
      ) AS is_on_call,
      -- next_call_date: member's next scheduled call (from today onwards in their timezone)
      (
        SELECT MIN(c.call_date)::text
        FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date >= (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
      ) AS next_call_date
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

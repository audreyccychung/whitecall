-- Fix: add avatar_url to get_group_calls member response
-- Without this, photo avatars don't render in group overlap calendar

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

  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;

  IF p_start_date > p_end_date OR (p_end_date - p_start_date) > 90 THEN
    RETURN '{"code": "INVALID_DATE_RANGE"}'::JSON;
  END IF;

  SELECT json_agg(member_data) INTO v_members
  FROM (
    SELECT
      p.id as user_id,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color,
      p.avatar_url
    FROM group_members gm
    INNER JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at
  ) member_data;

  SELECT json_agg(call_data) INTO v_calls
  FROM (
    SELECT
      c.user_id,
      c.call_date,
      c.shift_type
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

GRANT EXECUTE ON FUNCTION get_group_calls(UUID, DATE, DATE) TO authenticated;

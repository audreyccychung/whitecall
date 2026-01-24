-- Migration: Add group heart leaderboard
-- Feature: Show which group members send the most hearts
-- Date: 2026-01-24

-- ============================================================================
-- RPC: get_group_heart_leaderboard
-- ============================================================================
-- Returns hearts sent by each group member in the last N days
-- Hearts sent to anyone count (not just group members)
-- Result codes: SUCCESS, UNAUTHORIZED, GROUP_NOT_FOUND, NOT_A_MEMBER, UNKNOWN_ERROR

CREATE OR REPLACE FUNCTION get_group_heart_leaderboard(
  p_group_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_exists BOOLEAN;
  v_is_member BOOLEAN;
  v_result JSON;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Check if group exists
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) INTO v_group_exists;

  IF NOT v_group_exists THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  -- Check if user is a member
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_current_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;

  -- Build leaderboard
  SELECT json_build_object(
    'code', 'SUCCESS',
    'leaderboard', COALESCE(json_agg(row_to_json(t) ORDER BY t.hearts_sent DESC, t.username ASC), '[]'::JSON)
  )
  INTO v_result
  FROM (
    SELECT
      gm.user_id,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color,
      COUNT(h.id)::INTEGER as hearts_sent
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN hearts h ON h.sender_id = gm.user_id
      AND h.created_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.username, p.display_name, p.avatar_type, p.avatar_color
  ) t;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_group_heart_leaderboard(UUID, INTEGER) TO authenticated;

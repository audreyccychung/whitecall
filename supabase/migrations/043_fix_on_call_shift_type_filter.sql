-- Migration: Filter "on call" status by actual on-duty shift types
-- Date: 2026-02-08
-- Description: Fix bug where day_off/off/work/half_day entries count as "on call"
--              in group calendar, friend status, and heart sending.
--
-- PROBLEM: Since V1.7 added shift types, ALL entries in the calls table
--          (including day_off, off, work, half_day) were treated as "on call."
--          A user marking "off" today would show as on call in groups.
--
-- FIX: Add shift_type filter to 4 RPCs. Only these types count as "on call":
--   call, am, pm, night
--
-- These types do NOT count as on call:
--   day_off, off (explicitly off)
--   work, half_day (working but not on call — no support needed)

-- ============================================================================
-- 1. Fix get_group_calls: only return on-duty shifts in calendar
-- ============================================================================
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

  IF p_start_date > p_end_date OR (p_end_date - p_start_date) > 30 THEN
    RETURN '{"code": "INVALID_DATE_RANGE"}'::JSON;
  END IF;

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

  -- Only include on-duty shift types (not day_off, off, work, half_day)
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
    AND c.shift_type IN ('call', 'am', 'pm', 'night')
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

-- ============================================================================
-- 2. Fix get_group_members: is_on_call and next_call_date filter by shift type
-- ============================================================================
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

  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;

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
      -- is_on_call: only on-duty shift types count
      EXISTS(
        SELECT 1 FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date = (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
      ) AS is_on_call,
      -- next_call_date: only on-duty shift types count
      (
        SELECT MIN(c.call_date)::text
        FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date >= (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
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

-- ============================================================================
-- 3. Fix get_friends_with_status: is_on_call, can_send_heart, next_call_date
-- ============================================================================
CREATE OR REPLACE FUNCTION get_friends_with_status()
RETURNS TABLE (
  friend_id UUID,
  is_on_call BOOLEAN,
  can_send_heart BOOLEAN,
  next_call_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_sender_tz TEXT;
  v_sender_today DATE;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT timezone INTO v_sender_tz FROM profiles WHERE id = v_current_user_id;
  v_sender_today := (now() AT TIME ZONE COALESCE(v_sender_tz, 'UTC'))::date;

  RETURN QUERY
  SELECT
    f.friend_id,
    -- is_on_call: only on-duty shift types count
    EXISTS (
      SELECT 1 FROM calls c
      JOIN profiles p ON p.id = f.friend_id
      WHERE c.user_id = f.friend_id
        AND c.call_date = (now() AT TIME ZONE p.timezone)::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
    ) AS is_on_call,
    -- can_send_heart: check against heart already sent today
    NOT EXISTS (
      SELECT 1 FROM hearts h
      JOIN profiles p ON p.id = f.friend_id
      WHERE h.sender_id = v_current_user_id
        AND h.recipient_id = f.friend_id
        AND h.shift_date = (now() AT TIME ZONE p.timezone)::date
    ) AS can_send_heart,
    -- next_call_date: only on-duty shift types count
    (
      SELECT MIN(c.call_date)
      FROM calls c
      JOIN profiles p ON p.id = f.friend_id
      WHERE c.user_id = f.friend_id
        AND c.call_date >= (now() AT TIME ZONE p.timezone)::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
    ) AS next_call_date
  FROM friendships f
  WHERE f.user_id = v_current_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_with_status() TO authenticated;

-- ============================================================================
-- 4. Fix send_heart: only allow hearts when recipient has on-duty shift
-- ============================================================================
DROP FUNCTION IF EXISTS send_heart(UUID, TEXT, DATE);

CREATE OR REPLACE FUNCTION send_heart(
  p_recipient_id UUID,
  p_message TEXT DEFAULT 'wishes you a white call!',
  p_shift_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_today DATE;
  v_heart_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  IF p_recipient_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_SEND_TO_SELF"}'::JSON;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_recipient_id) THEN
    RETURN '{"code": "RECIPIENT_NOT_FOUND"}'::JSON;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = p_recipient_id
  ) THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  v_today := COALESCE(p_shift_date, CURRENT_DATE);

  -- Check if recipient has an on-duty shift today (not day_off, off, work, half_day)
  IF NOT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = p_recipient_id
      AND call_date = v_today
      AND shift_type IN ('call', 'am', 'pm', 'night')
  ) THEN
    RETURN '{"code": "RECIPIENT_NOT_ON_CALL"}'::JSON;
  END IF;

  BEGIN
    INSERT INTO hearts (sender_id, recipient_id, message, shift_date)
    VALUES (v_current_user_id, p_recipient_id, p_message, v_today)
    RETURNING id INTO v_heart_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN '{"code": "ALREADY_SENT_TODAY"}'::JSON;
  END;

  RETURN json_build_object('code', 'SUCCESS', 'heart_id', v_heart_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION send_heart(UUID, TEXT, DATE) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

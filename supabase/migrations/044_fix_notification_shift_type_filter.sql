-- Migration: Fix notification RPCs to filter by on-duty shift types
-- Date: 2026-02-08
-- Description: Same fix as 043 but for cron notification functions.
--              "Friends on call" should only count actual on-duty shifts.

-- ============================================================================
-- 1. Fix get_users_for_daily_notification
-- ============================================================================
CREATE OR REPLACE FUNCTION get_users_for_daily_notification()
RETURNS TABLE (
  user_id UUID,
  friends_on_call INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    COUNT(DISTINCT c.user_id)::INTEGER as friends_on_call
  FROM profiles p
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  JOIN push_subscriptions ps ON ps.user_id = p.id
  JOIN friendships f ON (f.user_id = p.id OR f.friend_id = p.id)
  JOIN calls c ON c.call_date = v_today
    AND c.user_id = CASE
      WHEN f.user_id = p.id THEN f.friend_id
      ELSE f.user_id
    END
    AND c.shift_type IN ('call', 'am', 'pm', 'night')
  WHERE NOT EXISTS (
    SELECT 1 FROM hearts h
    WHERE h.sender_id = p.id
    AND h.shift_date = v_today::TEXT
  )
  GROUP BY p.id
  HAVING COUNT(DISTINCT c.user_id) > 0;
END;
$$;

-- ============================================================================
-- 2. Fix get_users_for_streak_reminder
-- ============================================================================
CREATE OR REPLACE FUNCTION get_users_for_streak_reminder()
RETURNS TABLE (
  user_id UUID,
  current_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.current_streak::INTEGER as current_streak
  FROM profiles p
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  JOIN push_subscriptions ps ON ps.user_id = p.id
  WHERE p.current_streak >= 1
  AND NOT EXISTS (
    SELECT 1 FROM hearts h
    WHERE h.sender_id = p.id
    AND h.shift_date = v_today::TEXT
  )
  AND EXISTS (
    SELECT 1
    FROM friendships f
    JOIN calls c ON c.call_date = v_today
      AND c.user_id = CASE
        WHEN f.user_id = p.id THEN f.friend_id
        ELSE f.user_id
      END
      AND c.shift_type IN ('call', 'am', 'pm', 'night')
    WHERE f.user_id = p.id OR f.friend_id = p.id
  )
  GROUP BY p.id, p.current_streak;
END;
$$;

-- ============================================================================
-- GRANTS (service_role for cron jobs)
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_users_for_daily_notification() TO service_role;
GRANT EXECUTE ON FUNCTION get_users_for_streak_reminder() TO service_role;

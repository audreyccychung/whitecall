-- Migration: Add RPC functions for push notification cron jobs
-- Feature: Daily reminders and streak alerts
-- Date: 2026-01-24

-- ============================================================================
-- RPC: get_users_for_daily_notification
-- ============================================================================
-- Returns users who should receive "friends on call" notification
-- Criteria:
-- 1. Has notifications_enabled = TRUE
-- 2. Has at least one friend on call today
-- 3. Hasn't sent any hearts today yet

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
  -- Must have notifications enabled
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  -- Must have at least one push subscription
  JOIN push_subscriptions ps ON ps.user_id = p.id
  -- Find friends who are on call today
  JOIN friendships f ON (f.user_id = p.id OR f.friend_id = p.id)
  JOIN calls c ON c.call_date = v_today
    AND c.user_id = CASE
      WHEN f.user_id = p.id THEN f.friend_id
      ELSE f.user_id
    END
  -- Exclude users who already sent hearts today
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
-- RPC: get_users_for_streak_reminder
-- ============================================================================
-- Returns users at risk of losing their streak
-- Criteria:
-- 1. Has notifications_enabled = TRUE
-- 2. Has current_streak >= 1
-- 3. Hasn't sent any hearts today
-- 4. Has at least one friend on call today (can still send)

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
  -- Must have notifications enabled
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  -- Must have at least one push subscription
  JOIN push_subscriptions ps ON ps.user_id = p.id
  -- Must have an active streak
  WHERE p.current_streak >= 1
  -- Must not have sent hearts today
  AND NOT EXISTS (
    SELECT 1 FROM hearts h
    WHERE h.sender_id = p.id
    AND h.shift_date = v_today::TEXT
  )
  -- Must have at least one friend on call (can still send)
  AND EXISTS (
    SELECT 1
    FROM friendships f
    JOIN calls c ON c.call_date = v_today
      AND c.user_id = CASE
        WHEN f.user_id = p.id THEN f.friend_id
        ELSE f.user_id
      END
    WHERE f.user_id = p.id OR f.friend_id = p.id
  )
  GROUP BY p.id, p.current_streak;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- These functions are called by Vercel cron with service role key
-- No need for authenticated grants

GRANT EXECUTE ON FUNCTION get_users_for_daily_notification() TO service_role;
GRANT EXECUTE ON FUNCTION get_users_for_streak_reminder() TO service_role;

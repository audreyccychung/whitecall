-- Migration: Add get_weekly_recap_data RPC for Sunday weekly recap push notification
-- Schedule: 3:00 AM UTC Sunday (11:00 AM HK Sunday)
-- Returns one row per user with notification stats for the past 7 days

CREATE OR REPLACE FUNCTION get_weekly_recap_data()
RETURNS TABLE (
  user_id             UUID,
  calls_this_week     INTEGER,
  hearts_received_this_week INTEGER,
  avg_sleep_this_week DECIMAL(3,1)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := now() - INTERVAL '7 days';
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    COUNT(DISTINCT c.call_date)::INTEGER AS calls_this_week,
    COUNT(DISTINCT h.id)::INTEGER AS hearts_received_this_week,
    ROUND(AVG(cr.hours_slept)::DECIMAL, 1) AS avg_sleep_this_week
  FROM profiles p
  -- Must have notifications enabled
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  -- Must have at least one push subscription
  JOIN push_subscriptions ps ON ps.user_id = p.id
  -- On-duty calls in the last 7 days
  LEFT JOIN calls c
    ON c.user_id = p.id
    AND c.call_date >= v_window_start::DATE
    AND c.shift_type IN ('call', 'am', 'pm', 'night')
  -- Hearts received in the last 7 days
  LEFT JOIN hearts h
    ON h.recipient_id = p.id
    AND h.created_at >= v_window_start
  -- Call ratings (for avg sleep) in the last 7 days
  LEFT JOIN call_ratings cr
    ON cr.user_id = p.id
    AND cr.call_date >= v_window_start::DATE
    AND cr.hours_slept IS NOT NULL
  GROUP BY p.id
  -- Only notify users who actually had at least one call this week
  HAVING COUNT(DISTINCT c.call_date) > 0;
END;
$$;

-- Grant to service_role so the Vercel cron job can call it
GRANT EXECUTE ON FUNCTION get_weekly_recap_data() TO service_role;

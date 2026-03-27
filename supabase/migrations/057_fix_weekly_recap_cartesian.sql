-- Fix cartesian product in get_weekly_recap_data
-- Use subqueries instead of LEFT JOINs to avoid O(calls * hearts * ratings) blowup

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
  v_window_start DATE := (now() - INTERVAL '7 days')::DATE;
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    (
      SELECT COUNT(*)::INTEGER
      FROM calls c
      WHERE c.user_id = p.id
        AND c.call_date >= v_window_start
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
    ) AS calls_this_week,
    (
      SELECT COUNT(*)::INTEGER
      FROM hearts h
      WHERE h.recipient_id = p.id
        AND h.created_at >= v_window_start
    ) AS hearts_received_this_week,
    (
      SELECT ROUND(AVG(cr.hours_slept)::DECIMAL, 1)
      FROM call_ratings cr
      WHERE cr.user_id = p.id
        AND cr.call_date >= v_window_start
        AND cr.hours_slept IS NOT NULL
    ) AS avg_sleep_this_week
  FROM profiles p
  -- Must have notifications enabled
  JOIN user_settings us ON us.user_id = p.id AND us.notifications_enabled = TRUE
  -- Must have at least one push subscription
  WHERE EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = p.id)
  -- Only notify users who had at least one call this week
  AND EXISTS (
    SELECT 1 FROM calls c
    WHERE c.user_id = p.id
      AND c.call_date >= v_window_start
      AND c.shift_type IN ('call', 'am', 'pm', 'night')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_weekly_recap_data() TO service_role;

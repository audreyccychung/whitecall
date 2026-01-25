-- Migration: Fix streak date comparison bug
-- Date: 2026-01-25
-- Description: The streak trigger was comparing DATE to TIMESTAMP due to INTERVAL arithmetic.
--              DATE - INTERVAL '1 day' returns TIMESTAMP, not DATE.
--              This could cause the comparison to fail.
--              Fix: Cast the result back to DATE explicitly.
--
--              Also adding debug logging to help diagnose issues.

CREATE OR REPLACE FUNCTION update_streak_on_heart()
RETURNS TRIGGER AS $$
DECLARE
  v_yesterday DATE;
  v_old_streak INTEGER;
  v_new_streak INTEGER;
  v_old_last_date DATE;
BEGIN
  -- Calculate yesterday as DATE (not TIMESTAMP)
  v_yesterday := (NEW.shift_date - INTERVAL '1 day')::DATE;

  -- Get current values for debugging
  SELECT current_streak, last_heart_sent_date
  INTO v_old_streak, v_old_last_date
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Calculate new streak
  v_new_streak := CASE
    -- If last heart was yesterday, increment streak
    WHEN v_old_last_date = v_yesterday THEN v_old_streak + 1
    -- If last heart was today, keep current streak
    WHEN v_old_last_date = NEW.shift_date THEN v_old_streak
    -- Otherwise (gap in sending or first time), reset to 1
    ELSE 1
  END;

  -- Log for debugging (can be viewed in Supabase logs)
  RAISE LOG 'STREAK DEBUG: sender=%, shift_date=%, yesterday=%, old_last_date=%, old_streak=%, new_streak=%',
    NEW.sender_id, NEW.shift_date, v_yesterday, v_old_last_date, v_old_streak, v_new_streak;

  UPDATE profiles
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_heart_sent_date = NEW.shift_date
  WHERE id = NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger already exists and references this function.
-- The function update takes effect immediately.

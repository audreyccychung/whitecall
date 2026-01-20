-- Migration: Add function to create past call with rating atomically
-- Feature: Manual entry of past calls (like Strava)

-- RPC function to add a past call with rating in one atomic operation
CREATE OR REPLACE FUNCTION add_past_call_with_rating(
  p_call_date DATE,
  p_rating TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_call_exists BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  -- Get today's date
  v_today := CURRENT_DATE;

  -- Validate: date must be in the past (not today or future)
  IF p_call_date >= v_today THEN
    RETURN json_build_object('success', false, 'code', 'FUTURE_DATE_NOT_ALLOWED');
  END IF;

  -- Validate rating value
  IF p_rating NOT IN ('rough', 'okay', 'good', 'great') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_RATING');
  END IF;

  -- Check if call already exists on this date
  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'CALL_ALREADY_EXISTS');
  END IF;

  -- Atomic: Insert call and rating together
  INSERT INTO calls (user_id, call_date)
  VALUES (v_user_id, p_call_date);

  INSERT INTO call_ratings (user_id, call_date, rating, notes)
  VALUES (v_user_id, p_call_date, p_rating, p_notes);

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_past_call_with_rating(DATE, TEXT, TEXT) TO authenticated;

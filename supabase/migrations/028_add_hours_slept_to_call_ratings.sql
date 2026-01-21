-- Migration: Add hours_slept column to call_ratings table
-- V1.2 Feature: Track sleep hours alongside call ratings

-- Add hours_slept column (nullable, 0-12 in 0.5 increments)
ALTER TABLE call_ratings
ADD COLUMN hours_slept DECIMAL(3,1) CHECK (hours_slept IS NULL OR (hours_slept >= 0 AND hours_slept <= 12));

-- Update save_call_rating function to accept hours_slept parameter
CREATE OR REPLACE FUNCTION save_call_rating(
  p_call_date DATE,
  p_rating TEXT,
  p_notes TEXT DEFAULT NULL,
  p_hours_slept DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_call_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  -- Validate rating value
  IF p_rating NOT IN ('rough', 'okay', 'good', 'great') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_RATING');
  END IF;

  -- Validate hours_slept if provided
  IF p_hours_slept IS NOT NULL AND (p_hours_slept < 0 OR p_hours_slept > 12) THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_HOURS_SLEPT');
  END IF;

  -- Check if user had a call on this date
  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF NOT v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'NO_CALL_ON_DATE');
  END IF;

  -- Upsert the rating (insert or update on conflict)
  INSERT INTO call_ratings (user_id, call_date, rating, notes, hours_slept)
  VALUES (v_user_id, p_call_date, p_rating, p_notes, p_hours_slept)
  ON CONFLICT (user_id, call_date)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    notes = EXCLUDED.notes,
    hours_slept = EXCLUDED.hours_slept,
    updated_at = now();

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant execute permission (already granted, but ensure it's set)
GRANT EXECUTE ON FUNCTION save_call_rating(DATE, TEXT, TEXT, DECIMAL) TO authenticated;

-- Also update add_past_call_with_rating to support hours_slept
CREATE OR REPLACE FUNCTION add_past_call_with_rating(
  p_call_date DATE,
  p_rating TEXT,
  p_notes TEXT DEFAULT NULL,
  p_hours_slept DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_call_exists BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  -- Validate rating value
  IF p_rating NOT IN ('rough', 'okay', 'good', 'great') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_RATING');
  END IF;

  -- Validate hours_slept if provided
  IF p_hours_slept IS NOT NULL AND (p_hours_slept < 0 OR p_hours_slept > 12) THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_HOURS_SLEPT');
  END IF;

  -- Validate date is in the past
  IF p_call_date >= CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'code', 'DATE_NOT_IN_PAST');
  END IF;

  -- Check if call already exists
  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'CALL_ALREADY_EXISTS');
  END IF;

  -- Insert the call
  INSERT INTO calls (user_id, call_date)
  VALUES (v_user_id, p_call_date);

  -- Insert the rating
  INSERT INTO call_ratings (user_id, call_date, rating, notes, hours_slept)
  VALUES (v_user_id, p_call_date, p_rating, p_notes, p_hours_slept);

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_past_call_with_rating(DATE, TEXT, TEXT, DECIMAL) TO authenticated;

-- ============================================================================
-- Migration 047: Guard save_call_rating to reject non-duty shift types
-- ============================================================================
-- Only on-duty shifts (call, am, pm, night) can be rated.
-- Non-duty entries (day_off, work, half_day, off) are informational only.
-- Adds a NOT_ON_DUTY_SHIFT result code for attempts to rate non-duty entries.
-- ============================================================================

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
  v_shift_type TEXT;
  v_activity_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  IF p_rating NOT IN ('rough', 'okay', 'good', 'great') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_RATING');
  END IF;

  IF p_hours_slept IS NOT NULL AND (p_hours_slept < 0 OR p_hours_slept > 12) THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_HOURS_SLEPT');
  END IF;

  -- Check call exists AND get its shift type
  SELECT shift_type INTO v_shift_type
  FROM calls
  WHERE user_id = v_user_id AND call_date = p_call_date;

  IF v_shift_type IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'NO_CALL_ON_DATE');
  END IF;

  -- Only on-duty shifts can be rated
  IF v_shift_type NOT IN ('call', 'am', 'pm', 'night') THEN
    RETURN json_build_object('success', false, 'code', 'NOT_ON_DUTY_SHIFT');
  END IF;

  -- Upsert the rating
  INSERT INTO call_ratings (user_id, call_date, rating, notes, hours_slept)
  VALUES (v_user_id, p_call_date, p_rating, p_notes, p_hours_slept)
  ON CONFLICT (user_id, call_date)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    notes = EXCLUDED.notes,
    hours_slept = EXCLUDED.hours_slept,
    updated_at = now();

  -- Find existing activity
  SELECT id INTO v_activity_id
  FROM activities
  WHERE user_id = v_user_id
    AND activity_type = 'call_rated'
    AND metadata->>'call_date' = p_call_date::TEXT;

  IF v_activity_id IS NOT NULL THEN
    -- Update existing activity WITH notes in metadata
    UPDATE activities
    SET metadata = jsonb_build_object(
      'call_date', p_call_date::TEXT,
      'rating', p_rating,
      'hours_slept', p_hours_slept,
      'notes', p_notes
    )
    WHERE id = v_activity_id;
  ELSE
    -- Create new activity WITH notes in metadata
    INSERT INTO activities (user_id, activity_type, metadata)
    VALUES (
      v_user_id,
      'call_rated',
      jsonb_build_object(
        'call_date', p_call_date::TEXT,
        'rating', p_rating,
        'hours_slept', p_hours_slept,
        'notes', p_notes
      )
    );
  END IF;

  RETURN json_build_object('success', true, 'code', 'SUCCESS');
END;
$$;

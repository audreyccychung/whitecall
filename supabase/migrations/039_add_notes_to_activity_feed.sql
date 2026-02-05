-- Migration: Add notes to activity feed with privacy control
-- Date: 2026-02-05
-- Description: Phase 1 social features - public notes + get_activity_likers RPC

-- ============================================================================
-- COLUMN: profiles.notes_private
-- ============================================================================
-- When true, user's notes are hidden from activity feed (notes still saved locally)
-- Default false = notes are public (as per requirement "public by default")
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notes_private BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.notes_private IS
  'When true, hides ALL notes from activity feed and friend views. Default false (public).';

-- ============================================================================
-- RPC: update_notes_privacy_setting
-- ============================================================================
-- Updates the user's notes_private setting
-- Returns: { code: 'SUCCESS' | 'UNAUTHORIZED' | 'UNKNOWN_ERROR' }
CREATE OR REPLACE FUNCTION update_notes_privacy_setting(p_private BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  UPDATE profiles
  SET notes_private = p_private
  WHERE id = v_user_id;

  RETURN json_build_object('code', 'SUCCESS', 'private', p_private);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION update_notes_privacy_setting(BOOLEAN) TO authenticated;

-- ============================================================================
-- UPDATE: save_call_rating to include notes in activity metadata
-- ============================================================================
-- Recreate to store notes in activity metadata (respects privacy at read time)
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

  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF NOT v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'NO_CALL_ON_DATE');
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

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- ============================================================================
-- UPDATE: add_past_call_with_rating to include notes in activity metadata
-- ============================================================================
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

  IF p_call_date >= CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'code', 'DATE_NOT_IN_PAST');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'CALL_ALREADY_EXISTS');
  END IF;

  INSERT INTO calls (user_id, call_date)
  VALUES (v_user_id, p_call_date);

  INSERT INTO call_ratings (user_id, call_date, rating, notes, hours_slept)
  VALUES (v_user_id, p_call_date, p_rating, p_notes, p_hours_slept);

  -- Create activity WITH notes in metadata
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

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- ============================================================================
-- UPDATE: get_activity_feed to conditionally include notes
-- ============================================================================
-- Notes are only returned if the activity owner has notes_private = FALSE
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activities JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  SELECT json_agg(activity_data ORDER BY created_at DESC)
  INTO v_activities
  FROM (
    SELECT
      a.id,
      a.user_id,
      a.activity_type,
      -- Conditionally include notes based on owner's privacy setting
      CASE
        WHEN p.notes_private = TRUE THEN
          jsonb_build_object(
            'call_date', a.metadata->>'call_date',
            'rating', a.metadata->>'rating',
            'hours_slept', (a.metadata->>'hours_slept')::DECIMAL
          )
        ELSE
          a.metadata
      END as metadata,
      a.like_count,
      a.created_at,
      p.display_name,
      p.username,
      p.avatar_type,
      p.avatar_color,
      EXISTS (
        SELECT 1 FROM activity_likes al
        WHERE al.activity_id = a.id AND al.user_id = v_user_id
      ) as user_has_liked
    FROM activities a
    JOIN profiles p ON p.id = a.user_id
    WHERE
      a.user_id != v_user_id
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id = v_user_id AND f.friend_id = a.user_id)
           OR (f.friend_id = v_user_id AND f.user_id = a.user_id)
      )
      AND p.share_activity_feed = TRUE
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) AS activity_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'activities', COALESCE(v_activities, '[]'::JSON)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- ============================================================================
-- NEW RPC: get_activity_likers
-- ============================================================================
-- Returns list of users who liked a specific activity
-- Only works for activities the caller can see (own or friends)
CREATE OR REPLACE FUNCTION get_activity_likers(p_activity_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_owner UUID;
  v_likers JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Get activity owner
  SELECT user_id INTO v_activity_owner
  FROM activities
  WHERE id = p_activity_id;

  IF v_activity_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;

  -- Check authorization: must be own activity or friend's activity
  IF v_activity_owner != v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
         OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
    ) THEN
      RETURN json_build_object('code', 'NOT_FRIENDS');
    END IF;
  END IF;

  -- Get likers with profile info
  SELECT json_agg(liker_data ORDER BY created_at DESC)
  INTO v_likers
  FROM (
    SELECT
      al.user_id as id,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color,
      al.created_at
    FROM activity_likes al
    JOIN profiles p ON p.id = al.user_id
    WHERE al.activity_id = p_activity_id
    ORDER BY al.created_at DESC
  ) AS liker_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'likers', COALESCE(v_likers, '[]'::JSON)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_activity_likers(UUID) TO authenticated;

-- ============================================================================
-- NEW RPC: get_call_engagement
-- ============================================================================
-- Returns engagement stats (like_count) for a user's calls by date
-- Used by CallHistoryList to show engagement on profile page
CREATE OR REPLACE FUNCTION get_call_engagement(p_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_target_user UUID;
  v_engagement JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Default to self if no user specified
  v_target_user := COALESCE(p_user_id, v_user_id);

  -- Only allow viewing own engagement (for now)
  IF v_target_user != v_user_id THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Get engagement by call_date
  SELECT json_agg(engagement_data)
  INTO v_engagement
  FROM (
    SELECT
      a.metadata->>'call_date' as call_date,
      a.id as activity_id,
      a.like_count
    FROM activities a
    WHERE a.user_id = v_target_user
      AND a.activity_type = 'call_rated'
    ORDER BY a.metadata->>'call_date' DESC
  ) AS engagement_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'engagement', COALESCE(v_engagement, '[]'::JSON)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_call_engagement(UUID) TO authenticated;

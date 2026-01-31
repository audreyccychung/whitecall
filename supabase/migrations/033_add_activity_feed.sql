-- Migration: Add Activity Feed (Support Feed)
-- Date: 2026-01-31
-- Description: Implements Strava-inspired activity feed showing friends' call ratings
--              V1 Scope: call_rated activities with likes, privacy toggle

-- ============================================================================
-- TABLE: activities
-- ============================================================================
-- Stores activity events (call ratings) for the feed
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call_rated')),

  -- Denormalized data for fast feed queries (no JOINs needed)
  metadata JSONB NOT NULL DEFAULT '{}',
  -- For call_rated: { call_date: "2026-01-31", rating: "great", hours_slept: 7.5 }

  -- Like counter (denormalized for performance)
  like_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Index for feed queries
  CONSTRAINT valid_metadata CHECK (
    (activity_type = 'call_rated' AND metadata ? 'call_date' AND metadata ? 'rating')
  )
);

-- Indexes for feed queries
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);

-- ============================================================================
-- TABLE: activity_likes
-- ============================================================================
-- Tracks who liked which activities (one like per user per activity)
CREATE TABLE activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One like per user per activity
  UNIQUE(activity_id, user_id)
);

-- Index for checking if user liked an activity
CREATE INDEX idx_activity_likes_activity_id ON activity_likes(activity_id);
CREATE INDEX idx_activity_likes_user_id ON activity_likes(user_id);

-- ============================================================================
-- COLUMN: profiles.share_activity_feed
-- ============================================================================
-- Privacy toggle for activity feed visibility
ALTER TABLE profiles
ADD COLUMN share_activity_feed BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================================
-- RLS POLICIES: activities
-- ============================================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities from friends who have sharing enabled
CREATE POLICY "activities_select_friends"
ON activities FOR SELECT
USING (
  -- Own activities always visible
  user_id = auth.uid()
  OR
  -- Friends' activities if they have sharing enabled
  (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = activities.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = activities.user_id)
    )
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = activities.user_id
      AND p.share_activity_feed = TRUE
    )
  )
);

-- Users can only insert their own activities (via RPC)
CREATE POLICY "activities_insert_own"
ON activities FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own activities (for like_count via trigger)
CREATE POLICY "activities_update_own"
ON activities FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own activities
CREATE POLICY "activities_delete_own"
ON activities FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: activity_likes
-- ============================================================================
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

-- Users can see likes on activities they can see
CREATE POLICY "activity_likes_select"
ON activity_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = activity_likes.activity_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id = auth.uid() AND f.friend_id = a.user_id)
           OR (f.friend_id = auth.uid() AND f.user_id = a.user_id)
      )
    )
  )
);

-- Users can insert their own likes (via RPC)
CREATE POLICY "activity_likes_insert_own"
ON activity_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "activity_likes_delete_own"
ON activity_likes FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGER: Update like_count on activities
-- ============================================================================
CREATE OR REPLACE FUNCTION update_activity_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET like_count = like_count + 1 WHERE id = NEW.activity_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET like_count = like_count - 1 WHERE id = OLD.activity_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_activity_like_count
AFTER INSERT OR DELETE ON activity_likes
FOR EACH ROW EXECUTE FUNCTION update_activity_like_count();

-- ============================================================================
-- RPC: toggle_activity_like
-- ============================================================================
-- Toggles like on an activity (add if not liked, remove if liked)
-- Returns: { code: 'LIKED' | 'UNLIKED' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'CANNOT_LIKE_OWN' | 'UNKNOWN_ERROR' }
CREATE OR REPLACE FUNCTION toggle_activity_like(p_activity_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_owner UUID;
  v_existing_like UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Check if activity exists and get owner
  SELECT user_id INTO v_activity_owner
  FROM activities
  WHERE id = p_activity_id;

  IF v_activity_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;

  -- Cannot like own activity
  IF v_activity_owner = v_user_id THEN
    RETURN json_build_object('code', 'CANNOT_LIKE_OWN');
  END IF;

  -- Check if user is friends with activity owner
  IF NOT EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
       OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
  ) THEN
    RETURN json_build_object('code', 'NOT_FRIENDS');
  END IF;

  -- Check for existing like
  SELECT id INTO v_existing_like
  FROM activity_likes
  WHERE activity_id = p_activity_id AND user_id = v_user_id;

  IF v_existing_like IS NOT NULL THEN
    -- Unlike
    DELETE FROM activity_likes WHERE id = v_existing_like;
    RETURN json_build_object('code', 'UNLIKED');
  ELSE
    -- Like
    INSERT INTO activity_likes (activity_id, user_id)
    VALUES (p_activity_id, v_user_id);
    RETURN json_build_object('code', 'LIKED');
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_activity_like(UUID) TO authenticated;

-- ============================================================================
-- RPC: get_activity_feed
-- ============================================================================
-- Returns paginated activity feed for the current user
-- Shows activities from friends who have sharing enabled
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
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Get activities from friends with sharing enabled
  SELECT json_agg(activity_data ORDER BY created_at DESC)
  INTO v_activities
  FROM (
    SELECT
      a.id,
      a.user_id,
      a.activity_type,
      a.metadata,
      a.like_count,
      a.created_at,
      p.display_name,
      p.avatar_url,
      EXISTS (
        SELECT 1 FROM activity_likes al
        WHERE al.activity_id = a.id AND al.user_id = v_user_id
      ) as user_has_liked
    FROM activities a
    JOIN profiles p ON p.id = a.user_id
    WHERE
      -- Friends only (not own activities in feed)
      a.user_id != v_user_id
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id = v_user_id AND f.friend_id = a.user_id)
           OR (f.friend_id = v_user_id AND f.user_id = a.user_id)
      )
      -- Friend has sharing enabled
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

GRANT EXECUTE ON FUNCTION get_activity_feed(INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- RPC: update_share_activity_setting
-- ============================================================================
-- Updates the user's share_activity_feed setting
CREATE OR REPLACE FUNCTION update_share_activity_setting(p_enabled BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  UPDATE profiles
  SET share_activity_feed = p_enabled
  WHERE id = v_user_id;

  RETURN json_build_object('code', 'SUCCESS', 'enabled', p_enabled);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION update_share_activity_setting(BOOLEAN) TO authenticated;

-- ============================================================================
-- UPDATE: save_call_rating to create activity
-- ============================================================================
-- Recreate save_call_rating to also create/update an activity entry
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
  v_activity_id UUID;
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

  -- Create or update activity for this call rating
  -- Use upsert based on user_id + call_date in metadata
  SELECT id INTO v_activity_id
  FROM activities
  WHERE user_id = v_user_id
    AND activity_type = 'call_rated'
    AND metadata->>'call_date' = p_call_date::TEXT;

  IF v_activity_id IS NOT NULL THEN
    -- Update existing activity
    UPDATE activities
    SET metadata = jsonb_build_object(
      'call_date', p_call_date::TEXT,
      'rating', p_rating,
      'hours_slept', p_hours_slept
    )
    WHERE id = v_activity_id;
  ELSE
    -- Create new activity
    INSERT INTO activities (user_id, activity_type, metadata)
    VALUES (
      v_user_id,
      'call_rated',
      jsonb_build_object(
        'call_date', p_call_date::TEXT,
        'rating', p_rating,
        'hours_slept', p_hours_slept
      )
    );
  END IF;

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant already exists but ensure it's set
GRANT EXECUTE ON FUNCTION save_call_rating(DATE, TEXT, TEXT, DECIMAL) TO authenticated;

-- ============================================================================
-- UPDATE: add_past_call_with_rating to create activity
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

  -- Create activity for this call rating
  INSERT INTO activities (user_id, activity_type, metadata)
  VALUES (
    v_user_id,
    'call_rated',
    jsonb_build_object(
      'call_date', p_call_date::TEXT,
      'rating', p_rating,
      'hours_slept', p_hours_slept
    )
  );

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant already exists but ensure it's set
GRANT EXECUTE ON FUNCTION add_past_call_with_rating(DATE, TEXT, TEXT, DECIMAL) TO authenticated;

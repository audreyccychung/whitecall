-- Migration: Add activity comments
-- Date: 2026-02-05
-- Description: Phase 2 social features - comments on call ratings

-- ============================================================================
-- TABLE: activity_comments
-- ============================================================================
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX idx_activity_comments_user_id ON activity_comments(user_id);

-- ============================================================================
-- COLUMN: activities.comment_count
-- ============================================================================
ALTER TABLE activities
ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- TRIGGER: Update comment_count on activities
-- ============================================================================
CREATE OR REPLACE FUNCTION update_activity_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET comment_count = comment_count + 1 WHERE id = NEW.activity_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET comment_count = comment_count - 1 WHERE id = OLD.activity_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_activity_comment_count
AFTER INSERT OR DELETE ON activity_comments
FOR EACH ROW EXECUTE FUNCTION update_activity_comment_count();

-- ============================================================================
-- RLS POLICIES: activity_comments
-- ============================================================================
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- View comments on activities user can see (own or friends')
CREATE POLICY "activity_comments_select"
ON activity_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM activities a
    WHERE a.id = activity_comments.activity_id
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

-- Insert own comments (via RPC)
CREATE POLICY "activity_comments_insert_own"
ON activity_comments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Delete own comments
CREATE POLICY "activity_comments_delete_own"
ON activity_comments FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- RPC: add_activity_comment
-- ============================================================================
CREATE OR REPLACE FUNCTION add_activity_comment(
  p_activity_id UUID,
  p_content TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_owner UUID;
  v_comment_id UUID;
  v_content_trimmed TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Trim whitespace
  v_content_trimmed := TRIM(p_content);

  -- Validate content
  IF v_content_trimmed IS NULL OR char_length(v_content_trimmed) = 0 THEN
    RETURN json_build_object('code', 'CONTENT_EMPTY');
  END IF;

  IF char_length(v_content_trimmed) > 280 THEN
    RETURN json_build_object('code', 'CONTENT_TOO_LONG');
  END IF;

  -- Check activity exists
  SELECT user_id INTO v_activity_owner
  FROM activities
  WHERE id = p_activity_id;

  IF v_activity_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;

  -- Cannot comment on own activity
  IF v_activity_owner = v_user_id THEN
    RETURN json_build_object('code', 'CANNOT_COMMENT_OWN');
  END IF;

  -- Must be friends with activity owner
  IF NOT EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
       OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
  ) THEN
    RETURN json_build_object('code', 'NOT_FRIENDS');
  END IF;

  -- Insert comment
  INSERT INTO activity_comments (activity_id, user_id, content)
  VALUES (p_activity_id, v_user_id, v_content_trimmed)
  RETURNING id INTO v_comment_id;

  RETURN json_build_object('code', 'SUCCESS', 'comment_id', v_comment_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION add_activity_comment(UUID, TEXT) TO authenticated;

-- ============================================================================
-- RPC: get_activity_comments
-- ============================================================================
CREATE OR REPLACE FUNCTION get_activity_comments(p_activity_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_activity_owner UUID;
  v_comments JSON;
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

  -- Authorization: must be owner or friend
  IF v_activity_owner != v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
         OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
    ) THEN
      RETURN json_build_object('code', 'NOT_FRIENDS');
    END IF;
  END IF;

  -- Get comments with profile info
  SELECT json_agg(comment_data ORDER BY created_at ASC)
  INTO v_comments
  FROM (
    SELECT
      ac.id,
      ac.user_id,
      ac.content,
      ac.created_at,
      p.username,
      p.display_name,
      p.avatar_type,
      p.avatar_color
    FROM activity_comments ac
    JOIN profiles p ON p.id = ac.user_id
    WHERE ac.activity_id = p_activity_id
    ORDER BY ac.created_at ASC
  ) AS comment_data;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'comments', COALESCE(v_comments, '[]'::JSON)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_activity_comments(UUID) TO authenticated;

-- ============================================================================
-- RPC: delete_activity_comment
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_activity_comment(p_comment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_comment_owner UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Get comment owner
  SELECT user_id INTO v_comment_owner
  FROM activity_comments
  WHERE id = p_comment_id;

  IF v_comment_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;

  IF v_comment_owner != v_user_id THEN
    RETURN json_build_object('code', 'NOT_OWN_COMMENT');
  END IF;

  DELETE FROM activity_comments WHERE id = p_comment_id;

  RETURN json_build_object('code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_activity_comment(UUID) TO authenticated;

-- ============================================================================
-- UPDATE: get_activity_feed to include comment_count
-- ============================================================================
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
      a.comment_count,
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
-- UPDATE: get_call_engagement to include comment_count and activity_id
-- ============================================================================
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

  v_target_user := COALESCE(p_user_id, v_user_id);

  IF v_target_user != v_user_id THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  SELECT json_agg(engagement_data)
  INTO v_engagement
  FROM (
    SELECT
      a.metadata->>'call_date' as call_date,
      a.id as activity_id,
      a.like_count,
      a.comment_count
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

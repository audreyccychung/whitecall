-- Migration: Fix get_activity_feed to include username as fallback
-- Date: 2026-01-31
-- Description: Add username to feed response so UI can fall back when display_name is null

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

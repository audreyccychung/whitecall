-- Migration: Add profile photo support
-- Date: 2026-03-25
-- Description: Adds avatar_url column to profiles, creates avatars storage bucket
--              with RLS policies, and updates 9 RPCs to include avatar_url in output.

-- ============================================================================
-- SECTION 1: Add avatar_url column to profiles
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;


-- ============================================================================
-- SECTION 2: Create avatars storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  1048576, -- 1MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- SECTION 3: Storage RLS policies for avatars bucket
-- ============================================================================

-- Anyone can read avatar images (bucket is public, but belt-and-suspenders)
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
-- Path must be: <user_id>/<filename>
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Authenticated users can update their own avatar
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Authenticated users can delete their own avatar
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);


-- ============================================================================
-- SECTION 4: update_profile — add p_avatar_url parameter
-- DROP old 4-param version first since adding a 5th param creates a new overload
-- ============================================================================

DROP FUNCTION IF EXISTS update_profile(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_profile(
  p_avatar_type TEXT DEFAULT NULL,
  p_avatar_color TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_username TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('code', 'UNAUTHORIZED');
  END IF;
  IF p_username IS NOT NULL THEN
    IF NOT (p_username ~ '^[a-z0-9_]{3,20}$') THEN
      RETURN jsonb_build_object('code', 'INVALID_USERNAME');
    END IF;
    SELECT username INTO v_existing_username
    FROM profiles
    WHERE username = p_username AND id != v_user_id;
    IF v_existing_username IS NOT NULL THEN
      RETURN jsonb_build_object('code', 'USERNAME_TAKEN');
    END IF;
  END IF;
  IF p_display_name IS NOT NULL AND p_display_name != '' AND length(p_display_name) > 30 THEN
    RETURN jsonb_build_object('code', 'INVALID_DISPLAY_NAME');
  END IF;
  UPDATE profiles
  SET
    avatar_type = COALESCE(p_avatar_type, avatar_type),
    avatar_color = COALESCE(p_avatar_color, avatar_color),
    username = COALESCE(p_username, username),
    display_name = CASE
      WHEN p_display_name IS NULL THEN display_name
      WHEN p_display_name = '' THEN NULL
      ELSE p_display_name
    END,
    avatar_url = CASE
      WHEN p_avatar_url IS NULL THEN avatar_url
      WHEN p_avatar_url = '' THEN NULL
      ELSE p_avatar_url
    END,
    updated_at = NOW()
  WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('code', 'UNKNOWN_ERROR');
  END IF;
  RETURN jsonb_build_object('code', 'SUCCESS');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('code', 'UNKNOWN_ERROR');
END;
$$;

GRANT EXECUTE ON FUNCTION update_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION update_profile IS 'Update user profile. Pass null for fields you do not want to change. Pass empty string for display_name or avatar_url to clear them.';


-- ============================================================================
-- SECTION 5: get_activity_feed — add p.avatar_url to inner SELECT
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
      a.id, a.user_id, a.activity_type,
      CASE
        WHEN p.notes_private = TRUE THEN
          jsonb_build_object(
            'call_date', a.metadata->>'call_date',
            'rating', a.metadata->>'rating',
            'hours_slept', (a.metadata->>'hours_slept')::DECIMAL
          )
        ELSE a.metadata
      END as metadata,
      a.like_count, a.comment_count, a.created_at,
      p.display_name, p.username, p.avatar_type, p.avatar_color, p.avatar_url,
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

GRANT EXECUTE ON FUNCTION get_activity_feed(INTEGER, INTEGER) TO authenticated;


-- ============================================================================
-- SECTION 6: get_activity_likers — add p.avatar_url to inner SELECT
-- ============================================================================

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
  SELECT user_id INTO v_activity_owner FROM activities WHERE id = p_activity_id;
  IF v_activity_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;
  IF v_activity_owner != v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
         OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
    ) THEN
      RETURN json_build_object('code', 'NOT_FRIENDS');
    END IF;
  END IF;
  SELECT json_agg(liker_data ORDER BY created_at DESC)
  INTO v_likers
  FROM (
    SELECT
      al.user_id as id, p.username, p.display_name,
      p.avatar_type, p.avatar_color, p.avatar_url,
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
-- SECTION 7: get_activity_comments — add p.avatar_url to inner SELECT
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
  SELECT user_id INTO v_activity_owner FROM activities WHERE id = p_activity_id;
  IF v_activity_owner IS NULL THEN
    RETURN json_build_object('code', 'NOT_FOUND');
  END IF;
  IF v_activity_owner != v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = v_user_id AND f.friend_id = v_activity_owner)
         OR (f.friend_id = v_user_id AND f.user_id = v_activity_owner)
    ) THEN
      RETURN json_build_object('code', 'NOT_FRIENDS');
    END IF;
  END IF;
  SELECT json_agg(comment_data ORDER BY created_at ASC)
  INTO v_comments
  FROM (
    SELECT
      ac.id, ac.user_id, ac.content, ac.created_at,
      p.username, p.display_name, p.avatar_type, p.avatar_color, p.avatar_url
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
-- SECTION 8: get_notifications — add p.avatar_url as actor_avatar_url
-- ============================================================================

CREATE OR REPLACE FUNCTION get_notifications(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_notifications JSON;
  v_unread_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;
  SELECT COUNT(*) INTO v_unread_count
  FROM notifications WHERE user_id = v_user_id AND read = FALSE;
  SELECT json_agg(notif_data ORDER BY created_at DESC)
  INTO v_notifications
  FROM (
    SELECT
      n.id, n.type, n.activity_id, n.comment_id, n.read, n.created_at,
      p.id as actor_id,
      p.username as actor_username,
      p.display_name as actor_display_name,
      p.avatar_type as actor_avatar_type,
      p.avatar_color as actor_avatar_color,
      p.avatar_url as actor_avatar_url,
      a.metadata->>'call_date' as call_date,
      a.metadata->>'rating' as rating,
      CASE WHEN n.type = 'comment' THEN
        (SELECT LEFT(content, 50) FROM activity_comments WHERE id = n.comment_id)
      ELSE NULL END as comment_preview
    FROM notifications n
    JOIN profiles p ON p.id = n.actor_id
    LEFT JOIN activities a ON a.id = n.activity_id
    WHERE n.user_id = v_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) AS notif_data;
  RETURN json_build_object(
    'code', 'SUCCESS',
    'notifications', COALESCE(v_notifications, '[]'::JSON),
    'unread_count', v_unread_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_notifications(INTEGER, INTEGER) TO authenticated;


-- ============================================================================
-- SECTION 9: get_group_members — add p.avatar_url to inner SELECT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_members(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_members JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;
  SELECT json_agg(member_data) INTO v_members
  FROM (
    SELECT
      gm.id, gm.group_id, gm.user_id, gm.joined_at,
      p.username, p.display_name, p.avatar_type, p.avatar_color, p.avatar_url,
      EXISTS(
        SELECT 1 FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date = (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
      ) AS is_on_call,
      (
        SELECT MIN(c.call_date)::text
        FROM calls c
        WHERE c.user_id = gm.user_id
        AND c.call_date >= (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
        AND c.shift_type IN ('call', 'am', 'pm', 'night')
      ) AS next_call_date
    FROM group_members gm
    INNER JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at
  ) member_data;
  RETURN json_build_object(
    'code', 'SUCCESS',
    'members', COALESCE(v_members, '[]'::json)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_members(UUID) TO authenticated;


-- ============================================================================
-- SECTION 10: get_group_calls — add p.avatar_url to members inner SELECT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_calls(
  p_group_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_members JSON;
  v_calls JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;
  IF p_start_date > p_end_date OR (p_end_date - p_start_date) > 30 THEN
    RETURN '{"code": "INVALID_DATE_RANGE"}'::JSON;
  END IF;
  SELECT json_agg(member_data) INTO v_members
  FROM (
    SELECT
      p.id as user_id, p.username, p.display_name,
      p.avatar_type, p.avatar_color, p.avatar_url
    FROM group_members gm
    INNER JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at
  ) member_data;
  SELECT json_agg(call_data) INTO v_calls
  FROM (
    SELECT c.user_id, c.call_date
    FROM calls c
    WHERE c.user_id IN (
      SELECT user_id FROM group_members WHERE group_id = p_group_id
    )
    AND c.call_date >= p_start_date
    AND c.call_date <= p_end_date
    AND c.shift_type IN ('call', 'am', 'pm', 'night')
    ORDER BY c.call_date, c.user_id
  ) call_data;
  RETURN json_build_object(
    'code', 'SUCCESS',
    'members', COALESCE(v_members, '[]'::json),
    'calls', COALESCE(v_calls, '[]'::json)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_calls(UUID, DATE, DATE) TO authenticated;


-- ============================================================================
-- SECTION 11: get_group_heart_leaderboard — add p.avatar_url to SELECT and GROUP BY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_heart_leaderboard(
  p_group_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_exists BOOLEAN;
  v_is_member BOOLEAN;
  v_result JSON;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) INTO v_group_exists;
  IF NOT v_group_exists THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_current_user_id
  ) INTO v_is_member;
  IF NOT v_is_member THEN
    RETURN '{"code": "NOT_A_MEMBER"}'::JSON;
  END IF;
  SELECT json_build_object(
    'code', 'SUCCESS',
    'leaderboard', COALESCE(json_agg(row_to_json(t) ORDER BY t.hearts_sent DESC, t.username ASC), '[]'::JSON)
  )
  INTO v_result
  FROM (
    SELECT
      gm.user_id, p.username, p.display_name,
      p.avatar_type, p.avatar_color, p.avatar_url,
      COUNT(h.id)::INTEGER as hearts_sent
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN hearts h ON h.sender_id = gm.user_id
      AND h.created_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.username, p.display_name, p.avatar_type, p.avatar_color, p.avatar_url
  ) t;
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_heart_leaderboard(UUID, INTEGER) TO authenticated;


-- ============================================================================
-- SECTION 12: get_user_preview — add avatar_url to SELECT and return object
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_preview(p_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_result RECORD;
BEGIN
  v_normalized := lower(trim(p_username));
  IF v_normalized IS NULL OR v_normalized = '' THEN
    RETURN '{"valid": false, "reason": "USER_NOT_FOUND"}'::JSON;
  END IF;
  SELECT username, display_name, avatar_type, avatar_color, avatar_url
  INTO v_result
  FROM profiles
  WHERE lower(username) = v_normalized;
  IF NOT FOUND THEN
    RETURN '{"valid": false, "reason": "USER_NOT_FOUND"}'::JSON;
  END IF;
  RETURN json_build_object(
    'valid', true,
    'username', v_result.username,
    'display_name', v_result.display_name,
    'avatar_type', v_result.avatar_type,
    'avatar_color', v_result.avatar_color,
    'avatar_url', v_result.avatar_url
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{"valid": false, "reason": "UNKNOWN_ERROR"}'::JSON;
END;
$$;

-- Grant to both anon (landing page before login) and authenticated
GRANT EXECUTE ON FUNCTION get_user_preview(TEXT) TO anon, authenticated;

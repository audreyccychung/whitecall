-- Migration: Add notifications system
-- Date: 2026-02-05
-- Description: Phase 3 social features - notifications for likes and comments

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- RLS POLICIES: notifications
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can only update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Insert via trigger only (no direct inserts from client)
CREATE POLICY "notifications_insert_system"
ON notifications FOR INSERT
WITH CHECK (FALSE);

-- ============================================================================
-- TRIGGER: Create notification on like
-- ============================================================================
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_owner UUID;
BEGIN
  -- Get activity owner
  SELECT user_id INTO v_activity_owner
  FROM activities
  WHERE id = NEW.activity_id;

  -- Don't notify if user liked their own activity (shouldn't happen but safeguard)
  IF v_activity_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Insert notification
  INSERT INTO notifications (user_id, type, actor_id, activity_id)
  VALUES (v_activity_owner, 'like', NEW.user_id, NEW.activity_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_like_notification
AFTER INSERT ON activity_likes
FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- ============================================================================
-- TRIGGER: Create notification on comment
-- ============================================================================
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_owner UUID;
BEGIN
  -- Get activity owner
  SELECT user_id INTO v_activity_owner
  FROM activities
  WHERE id = NEW.activity_id;

  -- Don't notify if user commented on their own activity (shouldn't happen but safeguard)
  IF v_activity_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Insert notification
  INSERT INTO notifications (user_id, type, actor_id, activity_id, comment_id)
  VALUES (v_activity_owner, 'comment', NEW.user_id, NEW.activity_id, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_comment_notification
AFTER INSERT ON activity_comments
FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- ============================================================================
-- TRIGGER: Delete notification on unlike
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'like'
    AND actor_id = OLD.user_id
    AND activity_id = OLD.activity_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_delete_like_notification
AFTER DELETE ON activity_likes
FOR EACH ROW EXECUTE FUNCTION delete_like_notification();

-- ============================================================================
-- TRIGGER: Delete notification on comment delete
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE comment_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_delete_comment_notification
AFTER DELETE ON activity_comments
FOR EACH ROW EXECUTE FUNCTION delete_comment_notification();

-- ============================================================================
-- RPC: get_notifications
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

  -- Get unread count
  SELECT COUNT(*) INTO v_unread_count
  FROM notifications
  WHERE user_id = v_user_id AND read = FALSE;

  -- Get notifications with actor profile info
  SELECT json_agg(notif_data ORDER BY created_at DESC)
  INTO v_notifications
  FROM (
    SELECT
      n.id,
      n.type,
      n.activity_id,
      n.comment_id,
      n.read,
      n.created_at,
      p.id as actor_id,
      p.username as actor_username,
      p.display_name as actor_display_name,
      p.avatar_type as actor_avatar_type,
      p.avatar_color as actor_avatar_color,
      -- Get activity metadata for context
      a.metadata->>'call_date' as call_date,
      a.metadata->>'rating' as rating,
      -- Get comment preview if it's a comment notification
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
-- RPC: mark_notifications_read
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids UUID[] DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_updated_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- If no IDs provided, mark all as read
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    UPDATE notifications
    SET read = TRUE
    WHERE user_id = v_user_id AND read = FALSE;
  ELSE
    UPDATE notifications
    SET read = TRUE
    WHERE user_id = v_user_id
      AND id = ANY(p_notification_ids)
      AND read = FALSE;
  END IF;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'updated_count', v_updated_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID[]) TO authenticated;

-- ============================================================================
-- RPC: get_unread_notification_count
-- ============================================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('code', 'UNAUTHORIZED');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = v_user_id AND read = FALSE;

  RETURN json_build_object(
    'code', 'SUCCESS',
    'count', v_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

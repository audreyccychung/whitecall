-- Migration: Add atomic send_heart function
-- Date: 2026-01-13
-- Description: Single source of truth for sending hearts. Returns deterministic codes.
--              Mirrors add_friend/remove_friend pattern for consistency.

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS send_heart(UUID, TEXT);

-- Create the send_heart function
CREATE OR REPLACE FUNCTION send_heart(p_recipient_id UUID, p_message TEXT DEFAULT 'wishes you a white call!')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_today DATE;
  v_heart_id UUID;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();

  -- Check authorization
  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Cannot send heart to self
  IF p_recipient_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_SEND_TO_SELF"}'::JSON;
  END IF;

  -- Check if recipient exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_recipient_id) THEN
    RETURN '{"code": "RECIPIENT_NOT_FOUND"}'::JSON;
  END IF;

  -- Check if they are friends
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = p_recipient_id
  ) THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  -- Check if recipient has a call today
  v_today := CURRENT_DATE;
  IF NOT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = p_recipient_id AND call_date = v_today
  ) THEN
    RETURN '{"code": "RECIPIENT_NOT_ON_CALL"}'::JSON;
  END IF;

  -- Try to insert heart (unique constraint enforces one per sender/recipient/day)
  BEGIN
    INSERT INTO hearts (sender_id, recipient_id, message, shift_date)
    VALUES (v_current_user_id, p_recipient_id, p_message, v_today)
    RETURNING id INTO v_heart_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN '{"code": "ALREADY_SENT_TODAY"}'::JSON;
  END;

  -- Success - return heart ID for confirmation
  RETURN json_build_object('code', 'SUCCESS', 'heart_id', v_heart_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_heart(UUID, TEXT) TO authenticated;

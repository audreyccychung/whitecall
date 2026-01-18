-- Migration: Add timezone to profiles and update functions to use it
-- Date: 2026-01-19
-- Description: Store user timezone and use it for date calculations.
--              Fixes timezone mismatch between frontend/backend "today".

-- Step 1: Add timezone column to profiles with sensible default
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- Step 1b: Set all existing users to Asia/Hong_Kong (current user base is HK-based)
-- New users will have their timezone auto-detected on signup
UPDATE profiles SET timezone = 'Asia/Hong_Kong' WHERE timezone = 'UTC';

-- Step 2: Update send_heart function to use recipient's timezone
-- (The recipient's "today" determines if they're on call)
CREATE OR REPLACE FUNCTION send_heart(p_recipient_id UUID, p_message TEXT DEFAULT 'wishes you a white call!')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_recipient_tz TEXT;
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

  -- Check if recipient exists and get their timezone
  SELECT timezone INTO v_recipient_tz
  FROM profiles
  WHERE id = p_recipient_id;

  IF v_recipient_tz IS NULL THEN
    RETURN '{"code": "RECIPIENT_NOT_FOUND"}'::JSON;
  END IF;

  -- Check if they are friends
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = p_recipient_id
  ) THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  -- Calculate "today" in recipient's timezone
  v_today := (now() AT TIME ZONE v_recipient_tz)::date;

  -- Check if recipient has a call today (in their timezone)
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

-- Step 3: Create helper function to get friends with on-call status
-- This ensures timezone-aware "today" calculation for each friend
CREATE OR REPLACE FUNCTION get_friends_on_call_today()
RETURNS TABLE (
  friend_id UUID,
  is_on_call BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    f.friend_id,
    EXISTS (
      SELECT 1 FROM calls c
      JOIN profiles p ON p.id = f.friend_id
      WHERE c.user_id = f.friend_id
        AND c.call_date = (now() AT TIME ZONE p.timezone)::date
    ) AS is_on_call
  FROM friendships f
  WHERE f.user_id = v_current_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_on_call_today() TO authenticated;

-- Step 4: Create comprehensive function to get all friend data with timezone-aware status
-- This is the SINGLE SOURCE OF TRUTH for friend list data
-- Frontend should call this instead of doing date math
CREATE OR REPLACE FUNCTION get_friends_with_status()
RETURNS TABLE (
  friend_id UUID,
  is_on_call BOOLEAN,
  can_send_heart BOOLEAN,
  next_call_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_sender_tz TEXT;
  v_sender_today DATE;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get sender's timezone for "today" calculation (for hearts sent check)
  SELECT timezone INTO v_sender_tz FROM profiles WHERE id = v_current_user_id;
  v_sender_today := (now() AT TIME ZONE COALESCE(v_sender_tz, 'UTC'))::date;

  RETURN QUERY
  SELECT
    f.friend_id,
    -- is_on_call: uses FRIEND's timezone to determine their "today"
    EXISTS (
      SELECT 1 FROM calls c
      JOIN profiles p ON p.id = f.friend_id
      WHERE c.user_id = f.friend_id
        AND c.call_date = (now() AT TIME ZONE p.timezone)::date
    ) AS is_on_call,
    -- can_send_heart: true if no heart sent today (in recipient's timezone context)
    -- Hearts are stored with recipient's shift_date, so check against that
    NOT EXISTS (
      SELECT 1 FROM hearts h
      JOIN profiles p ON p.id = f.friend_id
      WHERE h.sender_id = v_current_user_id
        AND h.recipient_id = f.friend_id
        AND h.shift_date = (now() AT TIME ZONE p.timezone)::date
    ) AS can_send_heart,
    -- next_call_date: friend's next scheduled call (today or future in their timezone)
    (
      SELECT MIN(c.call_date)
      FROM calls c
      JOIN profiles p ON p.id = f.friend_id
      WHERE c.user_id = f.friend_id
        AND c.call_date >= (now() AT TIME ZONE p.timezone)::date
    ) AS next_call_date
  FROM friendships f
  WHERE f.user_id = v_current_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_with_status() TO authenticated;

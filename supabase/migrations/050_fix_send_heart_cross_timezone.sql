-- Migration: Fix cross-timezone heart sending
-- Date: 2026-03-25
-- Description: send_heart() was using the sender's local date (p_shift_date) to check
--              if the recipient is on call. But get_friends_with_status() uses the
--              recipient's timezone. When sender and recipient are in different timezones,
--              the dates differ, causing silent "RECIPIENT_NOT_ON_CALL" failures.
--
-- FIX: Compute recipient's date from their timezone server-side, matching how
--       get_friends_with_status() and get_group_members() already do it.
--       Remove dependence on p_shift_date for the on-call check.

DROP FUNCTION IF EXISTS send_heart(UUID, TEXT, DATE);

CREATE OR REPLACE FUNCTION send_heart(
  p_recipient_id UUID,
  p_message TEXT DEFAULT 'wishes you a white call!',
  p_shift_date DATE DEFAULT NULL  -- DEPRECATED: no longer used, kept for backward compat
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_recipient_today DATE;
  v_heart_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  IF p_recipient_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_SEND_TO_SELF"}'::JSON;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_recipient_id) THEN
    RETURN '{"code": "RECIPIENT_NOT_FOUND"}'::JSON;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = p_recipient_id
  ) THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  -- Compute recipient's current date from THEIR timezone
  -- This matches get_friends_with_status() and get_group_members()
  SELECT (now() AT TIME ZONE COALESCE(p.timezone, 'UTC'))::date
  INTO v_recipient_today
  FROM profiles p
  WHERE p.id = p_recipient_id;

  -- Check if recipient has an on-duty shift today in THEIR timezone
  IF NOT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = p_recipient_id
      AND call_date = v_recipient_today
      AND shift_type IN ('call', 'am', 'pm', 'night')
  ) THEN
    RETURN '{"code": "RECIPIENT_NOT_ON_CALL"}'::JSON;
  END IF;

  -- Insert heart with recipient's date (it's their shift)
  BEGIN
    INSERT INTO hearts (sender_id, recipient_id, message, shift_date)
    VALUES (v_current_user_id, p_recipient_id, p_message, v_recipient_today)
    RETURNING id INTO v_heart_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN '{"code": "ALREADY_SENT_TODAY"}'::JSON;
  END;

  RETURN json_build_object('code', 'SUCCESS', 'heart_id', v_heart_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION send_heart(UUID, TEXT, DATE) TO authenticated;

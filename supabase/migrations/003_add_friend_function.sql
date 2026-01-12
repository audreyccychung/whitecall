-- Migration: Add atomic add_friend function
-- Date: 2026-01-12
-- Description: Single source of truth for adding friends. Returns deterministic codes.

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS add_friend(TEXT);

-- Create the add_friend function
CREATE OR REPLACE FUNCTION add_friend(friend_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friend_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();

  -- Check authorization
  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Find friend by username (normalize to lowercase)
  SELECT id INTO v_friend_id
  FROM profiles
  WHERE username = lower(trim(friend_username));

  -- User not found
  IF v_friend_id IS NULL THEN
    RETURN '{"code": "USER_NOT_FOUND"}'::JSON;
  END IF;

  -- Cannot add self
  IF v_friend_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_ADD_SELF"}'::JSON;
  END IF;

  -- Check if already friends
  IF EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = v_friend_id
  ) THEN
    RETURN '{"code": "ALREADY_FRIENDS"}'::JSON;
  END IF;

  -- Insert both directions atomically (single statement = atomic)
  INSERT INTO friendships (user_id, friend_id)
  VALUES
    (v_current_user_id, v_friend_id),
    (v_friend_id, v_current_user_id);

  -- Success
  RETURN json_build_object('code', 'SUCCESS', 'friend_id', v_friend_id);

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another request added the friendship between our check and insert
    RETURN '{"code": "ALREADY_FRIENDS"}'::JSON;
  WHEN OTHERS THEN
    -- Any other error
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_friend(TEXT) TO authenticated;

-- ========================================
-- WhiteCall: Add Friend Function
-- Run this in your Supabase SQL Editor
-- ========================================
-- This function is the SINGLE SOURCE OF TRUTH for adding friends.
-- It handles all validation and creates bidirectional friendships atomically.
--
-- Returns exactly one of these codes:
--   SUCCESS        - Friend added successfully
--   USER_NOT_FOUND - Username doesn't exist
--   ALREADY_FRIENDS - Already friends with this user
--   CANNOT_ADD_SELF - Tried to add yourself
--   UNAUTHORIZED   - Not logged in
--   UNKNOWN_ERROR  - Database error (with detail)

-- Drop existing function if it exists
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

  -- Find friend by username (case-insensitive, handles mixed-case stored usernames)
  SELECT id INTO v_friend_id
  FROM profiles
  WHERE lower(username) = lower(trim(friend_username));

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

-- Done!
-- The add_friend function is now available.
-- Call it from the frontend with: supabase.rpc('add_friend', { friend_username: 'username' })

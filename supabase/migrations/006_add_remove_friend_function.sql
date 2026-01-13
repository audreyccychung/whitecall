-- Migration: Add atomic remove_friend function
-- Date: 2026-01-13
-- Description: Single source of truth for removing friends. Returns deterministic codes.
--              Mirrors add_friend pattern for consistency.

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS remove_friend(UUID);

-- Create the remove_friend function
CREATE OR REPLACE FUNCTION remove_friend(p_friend_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();

  -- Check authorization
  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Cannot remove self (shouldn't happen, but defensive)
  IF p_friend_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_REMOVE_SELF"}'::JSON;
  END IF;

  -- Check if friendship exists
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = v_current_user_id AND friend_id = p_friend_id
  ) THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  -- Delete both directions atomically
  DELETE FROM friendships
  WHERE (user_id = v_current_user_id AND friend_id = p_friend_id)
     OR (user_id = p_friend_id AND friend_id = v_current_user_id);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Verify deletion happened (defensive)
  IF v_deleted_count = 0 THEN
    RETURN '{"code": "NOT_FRIENDS"}'::JSON;
  END IF;

  -- Success
  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_friend(UUID) TO authenticated;

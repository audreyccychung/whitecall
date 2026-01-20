-- Migration: Add share_data_with_groups setting to profiles
-- V1.1 Feature: Users can opt out of sharing their call/sleep data with groups

-- Add column to profiles table
ALTER TABLE profiles
ADD COLUMN share_data_with_groups BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN profiles.share_data_with_groups IS
  'When true, user call ratings and sleep data are visible to group members. Default true.';

-- RPC function to update the setting
CREATE OR REPLACE FUNCTION update_share_data_setting(p_share BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  UPDATE profiles
  SET share_data_with_groups = p_share, updated_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_share_data_setting(BOOLEAN) TO authenticated;

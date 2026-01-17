-- Migration: Add update_profile RPC function
-- Allows users to update their own profile (avatar, username, display_name)
-- Single source of truth for profile updates with explicit result codes

-- Result codes:
-- SUCCESS: Profile updated successfully
-- UNAUTHORIZED: User not authenticated
-- USERNAME_TAKEN: Username already exists
-- INVALID_USERNAME: Username doesn't match validation rules
-- INVALID_DISPLAY_NAME: Display name too long
-- UNKNOWN_ERROR: Unexpected error

CREATE OR REPLACE FUNCTION update_profile(
  p_avatar_type TEXT DEFAULT NULL,
  p_avatar_color TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL
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
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Validate username if provided
  IF p_username IS NOT NULL THEN
    -- Check format: 3-20 chars, lowercase letters, numbers, underscores only
    IF NOT (p_username ~ '^[a-z0-9_]{3,20}$') THEN
      RETURN jsonb_build_object('code', 'INVALID_USERNAME');
    END IF;

    -- Check uniqueness (excluding current user)
    SELECT username INTO v_existing_username
    FROM profiles
    WHERE username = p_username AND id != v_user_id;

    IF v_existing_username IS NOT NULL THEN
      RETURN jsonb_build_object('code', 'USERNAME_TAKEN');
    END IF;
  END IF;

  -- Validate display_name if provided (not null means user wants to set it, empty string means clear it)
  -- We allow null (no change), empty string (clear), or 1-30 chars
  IF p_display_name IS NOT NULL AND p_display_name != '' AND length(p_display_name) > 30 THEN
    RETURN jsonb_build_object('code', 'INVALID_DISPLAY_NAME');
  END IF;

  -- Update profile - only update fields that are not null
  UPDATE profiles
  SET
    avatar_type = COALESCE(p_avatar_type, avatar_type),
    avatar_color = COALESCE(p_avatar_color, avatar_color),
    username = COALESCE(p_username, username),
    display_name = CASE
      WHEN p_display_name IS NULL THEN display_name  -- No change
      WHEN p_display_name = '' THEN NULL             -- Clear display name
      ELSE p_display_name                            -- Set new value
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION update_profile IS 'Update user profile. Pass null for fields you do not want to change.';

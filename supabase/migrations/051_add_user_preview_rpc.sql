-- Migration: Add get_user_preview RPC for friend invite links
-- Date: 2026-03-25
-- Description: Anon-accessible RPC that returns a user's public preview (avatar, display name)
--              for the /add/:username landing page. No sensitive data exposed.
--              Mirrors get_invite_code_info pattern (anon + authenticated grant).

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

  SELECT username, display_name, avatar_type, avatar_color
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
    'avatar_color', v_result.avatar_color
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN '{"valid": false, "reason": "UNKNOWN_ERROR"}'::JSON;
END;
$$;

-- Grant to both anon (landing page before login) and authenticated
GRANT EXECUTE ON FUNCTION get_user_preview(TEXT) TO anon, authenticated;

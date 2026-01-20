-- Migration: Add push subscription management functions
-- Single source of truth for saving and removing push subscriptions

-- Save or update a push subscription
-- Result codes: SUCCESS, UNAUTHORIZED, INVALID_SUBSCRIPTION, UNKNOWN_ERROR
CREATE OR REPLACE FUNCTION save_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Validate required fields
  IF p_endpoint IS NULL OR p_endpoint = '' OR
     p_p256dh IS NULL OR p_p256dh = '' OR
     p_auth IS NULL OR p_auth = '' THEN
    RETURN '{"code": "INVALID_SUBSCRIPTION"}'::JSON;
  END IF;

  -- Upsert subscription
  INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  VALUES (v_user_id, p_endpoint, p_p256dh, p_auth, p_user_agent)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent,
    updated_at = NOW();

  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION save_push_subscription(TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- Remove a push subscription
-- Result codes: SUCCESS, UNAUTHORIZED, UNKNOWN_ERROR
CREATE OR REPLACE FUNCTION remove_push_subscription(p_endpoint TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  DELETE FROM push_subscriptions
  WHERE user_id = v_user_id AND endpoint = p_endpoint;

  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION remove_push_subscription(TEXT) TO authenticated;

-- Single RPC to fetch all heart data (replaces 4 parallel queries)
-- Returns: hearts_received, hearts_sent, total_received, total_sent

CREATE OR REPLACE FUNCTION get_heart_stats(p_limit INT DEFAULT 200)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_received JSONB;
  v_sent JSONB;
  v_total_received BIGINT;
  v_total_sent BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('code', 'UNAUTHORIZED');
  END IF;

  -- Hearts received with sender profile info
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_received
  FROM (
    SELECT h.*,
           p.username AS sender_username,
           p.display_name AS sender_display_name,
           p.avatar_type AS sender_avatar_type,
           p.avatar_color AS sender_avatar_color,
           p.avatar_url AS sender_avatar_url
    FROM hearts h
    JOIN profiles p ON p.id = h.sender_id
    WHERE h.recipient_id = v_user_id
    ORDER BY h.created_at DESC
    LIMIT p_limit
  ) r;

  -- Hearts sent with recipient profile info (sender = current user)
  SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
  INTO v_sent
  FROM (
    SELECT h.*,
           p.username AS sender_username,
           p.display_name AS sender_display_name,
           p.avatar_type AS sender_avatar_type,
           p.avatar_color AS sender_avatar_color,
           p.avatar_url AS sender_avatar_url
    FROM hearts h
    JOIN profiles p ON p.id = h.sender_id
    WHERE h.sender_id = v_user_id
    ORDER BY h.created_at DESC
    LIMIT p_limit
  ) s;

  -- Exact counts (index-only scans)
  SELECT COUNT(*) INTO v_total_received FROM hearts WHERE recipient_id = v_user_id;
  SELECT COUNT(*) INTO v_total_sent FROM hearts WHERE sender_id = v_user_id;

  RETURN jsonb_build_object(
    'code', 'SUCCESS',
    'hearts_received', v_received,
    'hearts_sent', v_sent,
    'total_received', v_total_received,
    'total_sent', v_total_sent
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_heart_stats(INT) TO authenticated;

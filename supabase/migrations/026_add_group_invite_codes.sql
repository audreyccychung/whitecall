-- Migration: Add group invite codes
-- Feature: Shareable invite links for groups
-- Date: 2026-01-21

-- ============================================================================
-- TABLE: group_invite_codes
-- ============================================================================

CREATE TABLE group_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Code is 8 alphanumeric characters
  CONSTRAINT invite_code_format CHECK (code ~ '^[A-Z0-9]{8}$')
);

CREATE INDEX idx_invite_codes_group ON group_invite_codes(group_id);
CREATE INDEX idx_invite_codes_code ON group_invite_codes(code);
CREATE INDEX idx_invite_codes_expires ON group_invite_codes(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE group_invite_codes ENABLE ROW LEVEL SECURITY;

-- Group owners can view their own invite codes
CREATE POLICY "Owners can view own group invite codes"
  ON group_invite_codes FOR SELECT
  USING (
    group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

-- Insert/Delete handled by RPC functions
CREATE POLICY "Block direct invite code inserts"
  ON group_invite_codes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct invite code deletes"
  ON group_invite_codes FOR DELETE
  USING (false);

-- ============================================================================
-- FUNCTION: generate_random_code
-- ============================================================================
-- Helper function to generate random alphanumeric codes

CREATE OR REPLACE FUNCTION generate_random_code(length INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes I, O, 0, 1 to avoid confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ============================================================================
-- RPC: generate_invite_code
-- ============================================================================
-- Creates an invite code for a group (owner only)
-- Result codes: SUCCESS, UNAUTHORIZED, GROUP_NOT_FOUND, NOT_OWNER, UNKNOWN_ERROR

CREATE OR REPLACE FUNCTION generate_invite_code(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_owner_id UUID;
  v_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"success": false, "code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Get group owner
  SELECT created_by INTO v_group_owner_id FROM groups WHERE id = p_group_id;

  IF v_group_owner_id IS NULL THEN
    RETURN '{"success": false, "code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF v_group_owner_id != v_current_user_id THEN
    RETURN '{"success": false, "code": "NOT_OWNER"}'::JSON;
  END IF;

  -- Expires in 7 days
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Generate unique code (retry on collision)
  LOOP
    v_code := generate_random_code(8);
    v_attempts := v_attempts + 1;

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM group_invite_codes WHERE code = v_code) THEN
      EXIT;
    END IF;

    IF v_attempts >= v_max_attempts THEN
      RETURN '{"success": false, "code": "UNKNOWN_ERROR"}'::JSON;
    END IF;
  END LOOP;

  -- Insert invite code
  INSERT INTO group_invite_codes (code, group_id, created_by, expires_at)
  VALUES (v_code, p_group_id, v_current_user_id, v_expires_at);

  RETURN json_build_object(
    'success', true,
    'code', 'SUCCESS',
    'invite_code', v_code,
    'expires_at', v_expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- RPC: join_group_by_code
-- ============================================================================
-- Joins a group using an invite code
-- Result codes: SUCCESS, UNAUTHORIZED, INVALID_CODE, CODE_EXPIRED, ALREADY_MEMBER, GROUP_FULL, UNKNOWN_ERROR

CREATE OR REPLACE FUNCTION join_group_by_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_id UUID;
  v_group_name TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_member_count INTEGER;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"success": false, "code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Normalize code to uppercase
  p_code := upper(trim(p_code));

  -- Look up invite code
  SELECT ic.group_id, ic.expires_at, g.name
  INTO v_group_id, v_expires_at, v_group_name
  FROM group_invite_codes ic
  JOIN groups g ON g.id = ic.group_id
  WHERE ic.code = p_code;

  IF v_group_id IS NULL THEN
    RETURN '{"success": false, "code": "INVALID_CODE"}'::JSON;
  END IF;

  -- Check if expired
  IF v_expires_at < NOW() THEN
    RETURN '{"success": false, "code": "CODE_EXPIRED"}'::JSON;
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = v_group_id AND user_id = v_current_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'code', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name
    );
  END IF;

  -- Check member count (max 20)
  SELECT COUNT(*) INTO v_member_count FROM group_members WHERE group_id = v_group_id;
  IF v_member_count >= 20 THEN
    RETURN '{"success": false, "code": "GROUP_FULL"}'::JSON;
  END IF;

  -- Add member
  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group_id, v_current_user_id);

  RETURN json_build_object(
    'success', true,
    'code', 'SUCCESS',
    'group_id', v_group_id,
    'group_name', v_group_name
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'code', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name
    );
  WHEN SQLSTATE 'GF001' THEN
    -- Trigger exception: GROUP_FULL (race condition fallback)
    RETURN '{"success": false, "code": "GROUP_FULL"}'::JSON;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- RPC: get_invite_code_info (public, for join page preview)
-- ============================================================================
-- Returns basic info about an invite code without requiring auth
-- Used to show group name on the join page before user logs in

CREATE OR REPLACE FUNCTION get_invite_code_info(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_group_name TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_member_count INTEGER;
BEGIN
  -- Normalize code to uppercase
  p_code := upper(trim(p_code));

  -- Look up invite code
  SELECT ic.group_id, ic.expires_at, g.name
  INTO v_group_id, v_expires_at, v_group_name
  FROM group_invite_codes ic
  JOIN groups g ON g.id = ic.group_id
  WHERE ic.code = p_code;

  IF v_group_id IS NULL THEN
    RETURN '{"valid": false, "reason": "INVALID_CODE"}'::JSON;
  END IF;

  -- Check if expired
  IF v_expires_at < NOW() THEN
    RETURN '{"valid": false, "reason": "CODE_EXPIRED"}'::JSON;
  END IF;

  -- Get member count
  SELECT COUNT(*) INTO v_member_count FROM group_members WHERE group_id = v_group_id;

  -- Check if full
  IF v_member_count >= 20 THEN
    RETURN json_build_object(
      'valid', false,
      'reason', 'GROUP_FULL',
      'group_name', v_group_name
    );
  END IF;

  RETURN json_build_object(
    'valid', true,
    'group_name', v_group_name,
    'member_count', v_member_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN '{"valid": false, "reason": "UNKNOWN_ERROR"}'::JSON;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_invite_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION join_group_by_code(TEXT) TO authenticated;
-- Allow anon to preview invite code info (for join page before login)
GRANT EXECUTE ON FUNCTION get_invite_code_info(TEXT) TO anon, authenticated;

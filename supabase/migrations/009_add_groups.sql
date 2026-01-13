-- Migration: Add groups feature
-- Date: 2026-01-14
-- Description: Tables and functions for group management (V0.6)

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT group_name_length CHECK (char_length(trim(name)) BETWEEN 3 AND 30)
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups: Users can view groups they created or are members of
CREATE POLICY "Users can view own groups"
  ON groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Groups: Users can create groups (created_by must be self)
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Groups: Only creators can delete their groups
CREATE POLICY "Creators can delete groups"
  ON groups FOR DELETE
  USING (created_by = auth.uid());

-- Group Members: Users can view members of groups they have access to
-- Note: Owner path is a SAFETY NET for data bugs (I11 violation), not normal access.
-- Normal access: user is in group_members. Owner check prevents lockout if membership row missing.
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      -- Safety net: owner can always access (prevents lockout on I11 violation)
      SELECT id FROM groups WHERE created_by = auth.uid()
      UNION
      -- Normal path: user is a member
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Group Members: Insert/Delete handled by RPC functions (SECURITY DEFINER)
-- Direct insert/delete blocked for safety
CREATE POLICY "Block direct member inserts"
  ON group_members FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct member deletes"
  ON group_members FOR DELETE
  USING (false);

-- ============================================================================
-- TRIGGER: Enforce 20-member limit at DB level (prevents race conditions)
-- ============================================================================
-- Uses custom SQLSTATE 'GF001' for deterministic exception handling in RPCs.
-- SECURITY DEFINER ensures trigger runs with definer permissions.

CREATE OR REPLACE FUNCTION enforce_group_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM group_members WHERE group_id = NEW.group_id) >= 20 THEN
    RAISE EXCEPTION 'GROUP_FULL' USING ERRCODE = 'GF001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_group_member_limit
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_group_member_limit();

-- ============================================================================
-- RPC: create_group
-- ============================================================================
-- Single source of truth for group creation with error codes

CREATE OR REPLACE FUNCTION create_group(group_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_trimmed_name TEXT;
  v_group_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  v_trimmed_name := trim(group_name);

  -- Validate name length
  IF char_length(v_trimmed_name) < 3 OR char_length(v_trimmed_name) > 30 THEN
    RETURN '{"code": "INVALID_NAME"}'::JSON;
  END IF;

  -- Create group
  INSERT INTO groups (name, created_by)
  VALUES (v_trimmed_name, v_current_user_id)
  RETURNING id INTO v_group_id;

  -- Auto-add creator as first member (bypasses RLS via SECURITY DEFINER)
  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group_id, v_current_user_id);

  RETURN json_build_object('code', 'SUCCESS', 'group_id', v_group_id);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- RPC: add_group_member
-- ============================================================================
-- Single source of truth for adding members with error codes

CREATE OR REPLACE FUNCTION add_group_member(p_group_id UUID, member_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
  v_current_user_id UUID;
  v_group_owner_id UUID;
  v_member_count INTEGER;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Get group owner
  SELECT created_by INTO v_group_owner_id FROM groups WHERE id = p_group_id;

  IF v_group_owner_id IS NULL THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF v_group_owner_id != v_current_user_id THEN
    RETURN '{"code": "NOT_OWNER"}'::JSON;
  END IF;

  -- Self-heal: Ensure owner is in group_members (I11 invariant)
  -- This fixes data integrity bugs silently on next interaction
  INSERT INTO group_members (group_id, user_id)
  VALUES (p_group_id, v_current_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Find member by username (case-insensitive)
  SELECT id INTO v_member_id
  FROM profiles
  WHERE lower(username) = lower(trim(member_username));

  IF v_member_id IS NULL THEN
    RETURN '{"code": "USER_NOT_FOUND"}'::JSON;
  END IF;

  -- Check if already member
  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_member_id) THEN
    RETURN '{"code": "ALREADY_MEMBER"}'::JSON;
  END IF;

  -- Check member count (max 20)
  SELECT COUNT(*) INTO v_member_count FROM group_members WHERE group_id = p_group_id;
  IF v_member_count >= 20 THEN
    RETURN '{"code": "GROUP_FULL"}'::JSON;
  END IF;

  -- Insert member
  INSERT INTO group_members (group_id, user_id) VALUES (p_group_id, v_member_id);

  RETURN json_build_object('code', 'SUCCESS', 'member_id', v_member_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN '{"code": "ALREADY_MEMBER"}'::JSON;
  WHEN SQLSTATE 'GF001' THEN
    -- Trigger exception: GROUP_FULL (race condition fallback)
    RETURN '{"code": "GROUP_FULL"}'::JSON;
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- RPC: remove_group_member
-- ============================================================================
-- Single source of truth for removing members with error codes

CREATE OR REPLACE FUNCTION remove_group_member(p_group_id UUID, p_member_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_owner_id UUID;
  v_deleted_count INTEGER;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Get group owner
  SELECT created_by INTO v_group_owner_id FROM groups WHERE id = p_group_id;

  IF v_group_owner_id IS NULL THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF v_group_owner_id != v_current_user_id THEN
    RETURN '{"code": "NOT_OWNER"}'::JSON;
  END IF;

  -- Self-heal: Ensure owner is in group_members (I11 invariant)
  -- This fixes data integrity bugs silently on next interaction
  INSERT INTO group_members (group_id, user_id)
  VALUES (p_group_id, v_current_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Cannot remove self (owner)
  IF p_member_id = v_current_user_id THEN
    RETURN '{"code": "CANNOT_REMOVE_SELF"}'::JSON;
  END IF;

  -- Delete member
  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_member_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RETURN '{"code": "MEMBER_NOT_FOUND"}'::JSON;
  END IF;

  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- RPC: delete_group
-- ============================================================================
-- Single source of truth for deleting groups with error codes

CREATE OR REPLACE FUNCTION delete_group(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_group_owner_id UUID;
  v_deleted_count INTEGER;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '{"code": "UNAUTHORIZED"}'::JSON;
  END IF;

  -- Get group owner
  SELECT created_by INTO v_group_owner_id FROM groups WHERE id = p_group_id;

  IF v_group_owner_id IS NULL THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  IF v_group_owner_id != v_current_user_id THEN
    RETURN '{"code": "NOT_OWNER"}'::JSON;
  END IF;

  -- Delete group (CASCADE will remove group_members)
  DELETE FROM groups WHERE id = p_group_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RETURN '{"code": "GROUP_NOT_FOUND"}'::JSON;
  END IF;

  RETURN '{"code": "SUCCESS"}'::JSON;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('code', 'UNKNOWN_ERROR', 'detail', SQLERRM);
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_group(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_group_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_group(UUID) TO authenticated;

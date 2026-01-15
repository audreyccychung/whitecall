-- Migration: Fix RLS circular dependency between groups and group_members
-- Date: 2026-01-15
-- Description: Fix bug where newly created groups don't appear in list
--
-- ROOT CAUSE: Cross-table circular dependency
--   groups policy → subquery on group_members
--   group_members policy → subquery on groups
--
-- FIX: Make dependency one-directional (DAG)
--   groups → group_members (allowed)
--   group_members → groups (allowed, but group_members uses direct check first)
--
-- The key insight: group_members uses `user_id = auth.uid()` as a direct check
-- BEFORE any subquery, which breaks the cycle.

-- ============================================================================
-- FIX groups SELECT policy
-- ============================================================================
-- Uses EXISTS for better performance than IN with subquery

DROP POLICY IF EXISTS "Users can view own groups" ON groups;

CREATE POLICY "Users can view own groups"
  ON groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX group_members SELECT policy
-- ============================================================================
-- CRITICAL: Direct check `user_id = auth.uid()` comes FIRST
-- This breaks the circular dependency by not requiring a subquery for own rows

DROP POLICY IF EXISTS "Members can view group members" ON group_members;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

-- ============================================================================
-- (Optional) Add INSERT policy for group_members
-- ============================================================================
-- Prevents confusion about who can add members (only group owners via RPC)
-- Note: RPC functions use SECURITY DEFINER so they bypass this, but this
-- documents intent and blocks direct inserts from unauthorized users.

DROP POLICY IF EXISTS "Block direct member inserts" ON group_members;

CREATE POLICY "Group owners can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

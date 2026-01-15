-- Migration: Fix infinite recursion in groups/group_members RLS
-- Date: 2026-01-15
-- Description: Simplify RLS to break circular dependency
--
-- ROOT CAUSE: groups policy → EXISTS on group_members → group_members policy → subquery on groups → infinite loop
--
-- V0.6 FIX: Remove all cross-table dependencies
--   - groups: owner only (created_by = auth.uid())
--   - group_members: own rows only (user_id = auth.uid())
--
-- TRADE-OFF: Non-owner members cannot see groups they belong to (V1 will add RPC for this)
--
-- V1 PLAN: Use SECURITY DEFINER RPCs for member visibility (documented in ROADMAP.md)

-- ============================================================================
-- FIX groups SELECT policy - OWNER ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own groups" ON groups;

CREATE POLICY "Users can view own groups"
  ON groups FOR SELECT
  USING (created_by = auth.uid());

-- ============================================================================
-- FIX group_members SELECT policy - OWN ROWS ONLY
-- ============================================================================

DROP POLICY IF EXISTS "Members can view group members" ON group_members;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (user_id = auth.uid());

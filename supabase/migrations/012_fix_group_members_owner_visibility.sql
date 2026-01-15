-- Migration: Allow group owners to see all members
-- Date: 2026-01-15
-- Description: Fix RLS so owners can see members they added
--
-- PROBLEM: Migration 011 was too restrictive - owners could only see their own row
--
-- FIX: Add owner check to group_members policy
--   - user_id = auth.uid() (see own row)
--   - OR group_id IN (SELECT id FROM groups WHERE created_by = auth.uid()) (owner sees all)
--
-- WHY THIS IS SAFE (no circular dependency):
--   groups policy: created_by = auth.uid() (no subquery)
--   group_members policy: ... OR subquery on groups
--   Dependency: group_members → groups (one direction only)

DROP POLICY IF EXISTS "Members can view group members" ON group_members;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM groups WHERE created_by = auth.uid())
  );

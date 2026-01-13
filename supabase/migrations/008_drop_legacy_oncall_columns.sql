-- Migration: Drop legacy on-call columns from profiles
-- Date: 2026-01-13
-- Description: Removes DEPRECATED columns that were replaced by the `calls` table.
--              See 005_deprecate_legacy_oncall.sql for context.
--
-- PRE-REQUISITES:
-- 1. [DONE] calls table created and in production (004_add_calls_table.sql)
-- 2. [DONE] All code updated to use calls table
-- 3. [DONE] Columns documented as deprecated (005_deprecate_legacy_oncall.sql)
-- 4. [DONE] One release cycle completed (V0.5 -> V0.6)

-- Drop the deprecated columns
ALTER TABLE profiles DROP COLUMN IF EXISTS is_on_call;
ALTER TABLE profiles DROP COLUMN IF EXISTS call_date;

-- Verify: These columns should no longer exist
-- If you need to rollback, recreate with:
-- ALTER TABLE profiles ADD COLUMN is_on_call BOOLEAN DEFAULT false;
-- ALTER TABLE profiles ADD COLUMN call_date DATE;

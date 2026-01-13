-- Migration: Document legacy on-call columns as DEPRECATED
-- Date: 2026-01-13
-- Description: The profiles.is_on_call and profiles.call_date columns are DEPRECATED.
--              The `calls` table is now the single source of truth for on-call status.
--
-- WHY THIS EXISTS:
-- The original design stored on-call status directly in the profiles table.
-- This was replaced by the `calls` table which allows:
--   - Multiple future call dates per user
--   - Proper calendar UI integration
--   - Clean separation of concerns
--
-- MIGRATION ORDER (per CLAUDE.md rules):
-- 1. [DONE] calls table created (004_add_calls_table.sql)
-- 2. [DONE] Code updated to use calls table (useCalls.ts, useFriends.ts)
-- 3. [DONE] Deployed and verified in production
-- 4. [NOW] Document deprecation
-- 5. [FUTURE V0.6+] Delete legacy columns after one release cycle
--
-- DO NOT USE THESE COLUMNS:
--   - profiles.is_on_call (BOOLEAN) - Always false, not maintained
--   - profiles.call_date (DATE) - Always null, not maintained
--
-- USE INSTEAD:
--   - Query: SELECT * FROM calls WHERE user_id = ? AND call_date = ?
--   - To check if user is on call today:
--     SELECT EXISTS(SELECT 1 FROM calls WHERE user_id = ? AND call_date = CURRENT_DATE)

-- Add comments to columns (PostgreSQL feature)
COMMENT ON COLUMN profiles.is_on_call IS 'DEPRECATED: Use calls table instead. Do not read or write this column.';
COMMENT ON COLUMN profiles.call_date IS 'DEPRECATED: Use calls table instead. Do not read or write this column.';

-- Drop the legacy view that uses these columns
DROP VIEW IF EXISTS users_on_call;

-- ============================================================================
-- CLEANUP MIGRATION (for V0.6+)
-- ============================================================================
-- When ready to fully remove (after one release cycle), run:
--
-- ALTER TABLE profiles DROP COLUMN is_on_call;
-- ALTER TABLE profiles DROP COLUMN call_date;
--
-- DO NOT run this now. Wait until V0.6 to ensure no code depends on these.

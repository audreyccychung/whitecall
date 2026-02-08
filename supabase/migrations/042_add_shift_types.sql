-- Migration: Add shift types and work patterns
-- Date: 2026-02-08
-- Description: Expand calendar from single "on call" to multiple shift types.
--              Users choose a work pattern (call-based or shift-based) in settings.
--              Each pattern shows different shift type options in the picker.
--
-- Call-based: call, day_off, work, half_day
-- Shift-based: am, pm, night, off

-- ============================================================================
-- 1. Add work_pattern to profiles
-- ============================================================================
-- Determines which shift types the user sees in the picker.
-- Default 'call' preserves existing behavior for all current users.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS work_pattern TEXT NOT NULL DEFAULT 'call';

-- Add CHECK constraint separately (IF NOT EXISTS not supported on constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_work_pattern_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_work_pattern_check
    CHECK (work_pattern IN ('call', 'shift'));
  END IF;
END $$;

-- ============================================================================
-- 2. Add shift_type to calls
-- ============================================================================
-- Stores which type of shift this date represents.
-- Default 'call' preserves all existing data (every existing row becomes a Call).

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS shift_type TEXT NOT NULL DEFAULT 'call';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calls_shift_type_check'
  ) THEN
    ALTER TABLE calls
    ADD CONSTRAINT calls_shift_type_check
    CHECK (shift_type IN ('call', 'day_off', 'work', 'half_day', 'am', 'pm', 'night', 'off'));
  END IF;
END $$;

-- Index for queries that may filter by shift_type (e.g., friend views)
CREATE INDEX IF NOT EXISTS idx_calls_user_shift_type
ON calls(user_id, shift_type);

-- ============================================================================
-- 3. RPC to update work pattern
-- ============================================================================
-- Simple RPC following the same pattern as update_share_data_setting.

CREATE OR REPLACE FUNCTION update_work_pattern(p_pattern TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  IF p_pattern NOT IN ('call', 'shift') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_PATTERN');
  END IF;

  UPDATE profiles
  SET work_pattern = p_pattern, updated_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION update_work_pattern(TEXT) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

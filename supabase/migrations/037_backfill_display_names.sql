-- Migration: Backfill display_name for existing users
-- Date: 2026-01-31
-- Description: Set display_name = username for users who don't have a display name

UPDATE profiles
SET display_name = username
WHERE display_name IS NULL;

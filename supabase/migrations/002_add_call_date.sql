-- Migration: Add call_date column for auto-expiring on-call status
-- Date: 2026-01-10
-- Description: Adds call_date column to enable automatic expiration of on-call status at midnight

-- Add call_date column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS call_date DATE;

-- Update existing on-call users to have today's date
UPDATE profiles
SET call_date = CURRENT_DATE
WHERE is_on_call = TRUE AND call_date IS NULL;

-- Update the users_on_call view to filter by date
CREATE OR REPLACE VIEW users_on_call AS
SELECT id, username, display_name, avatar_type, avatar_color
FROM profiles
WHERE is_on_call = TRUE AND call_date = CURRENT_DATE;

-- Migration complete!

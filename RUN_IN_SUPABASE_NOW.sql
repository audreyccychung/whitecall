-- ========================================
-- WhiteCall: Add Auto-Expiring Call Status
-- Run this in your Supabase SQL Editor
-- ========================================

-- Step 1: Add call_date column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS call_date DATE;

-- Step 2: Update existing on-call users to have today's date
UPDATE profiles
SET call_date = CURRENT_DATE
WHERE is_on_call = TRUE AND call_date IS NULL;

-- Step 3: Update the users_on_call view
DROP VIEW IF EXISTS users_on_call;
CREATE VIEW users_on_call AS
SELECT id, username, display_name, avatar_type, avatar_color
FROM profiles
WHERE is_on_call = TRUE AND call_date = CURRENT_DATE;

-- Done! ✅
-- Your on-call status will now automatically expire at midnight.

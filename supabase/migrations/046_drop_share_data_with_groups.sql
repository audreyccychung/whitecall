-- Remove dead share_data_with_groups setting
-- This setting was never enforced in any RPC or RLS policy.
-- Data is automatically shared with groups — no toggle needed.

-- Drop the dead RPC that toggled this setting
DROP FUNCTION IF EXISTS update_share_data_setting(BOOLEAN);

-- Drop the column from profiles (no backend code references it)
ALTER TABLE profiles DROP COLUMN IF EXISTS share_data_with_groups;

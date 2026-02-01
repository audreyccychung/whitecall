-- Add onboarding_version column for versioned onboarding
-- This allows re-triggering onboarding when new features are added

-- Add the column with default 0 (never onboarded)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_version INTEGER DEFAULT 0;

-- Migrate existing users: if onboarding_completed = true, set version to 1
UPDATE profiles
SET onboarding_version = 1
WHERE onboarding_completed = true AND onboarding_version = 0;

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_version IS 'Tracks which version of onboarding the user has completed. 0 = never onboarded, 1+ = completed that version.';

-- Migration: Document calls table (already exists in production)
-- Date: 2026-01-13
-- Description: This table was created directly in Supabase. This migration documents
--              the schema for version control and future database recreations.
--
-- NOTE: If running against a fresh database, this will create the table.
--       If running against production (where table exists), use IF NOT EXISTS.

-- ============================================================================
-- CALLS TABLE
-- ============================================================================
-- Tracks which days a user is on call. One row per call day.
-- Replaces the legacy profiles.is_on_call + profiles.call_date system.

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One call entry per user per day
  UNIQUE(user_id, call_date)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);

-- Index for fast lookups by date (for "who's on call today" queries)
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(call_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Users can view their own call dates
CREATE POLICY "Users can view own shifts" ON calls
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own call dates
CREATE POLICY "Users can create own shifts" ON calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own call dates
CREATE POLICY "Users can delete own shifts" ON calls
  FOR DELETE USING (auth.uid() = user_id);

-- Friends can see when their friends are on call
CREATE POLICY "Friends can view shifts" ON calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE friendships.user_id = auth.uid()
      AND friendships.friend_id = calls.user_id
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

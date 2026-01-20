-- Migration: Add call_ratings table for tracking call quality
-- V1.1 Feature: Users can rate their past calls

-- Create call_ratings table
CREATE TABLE call_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('rough', 'okay', 'good', 'great')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One rating per user per call date
  UNIQUE(user_id, call_date)
);

-- Index for efficient queries by user
CREATE INDEX idx_call_ratings_user_id ON call_ratings(user_id);
CREATE INDEX idx_call_ratings_call_date ON call_ratings(call_date DESC);

-- Enable RLS
ALTER TABLE call_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own ratings
-- Simple direct ownership check, no circular dependencies
CREATE POLICY "Users can view own ratings"
  ON call_ratings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ratings"
  ON call_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings"
  ON call_ratings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ratings"
  ON call_ratings FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_call_ratings_updated_at
  BEFORE UPDATE ON call_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC function to save a rating (upsert with validation)
CREATE OR REPLACE FUNCTION save_call_rating(
  p_call_date DATE,
  p_rating TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_call_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHORIZED');
  END IF;

  -- Validate rating value
  IF p_rating NOT IN ('rough', 'okay', 'good', 'great') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_RATING');
  END IF;

  -- Check if user had a call on this date
  SELECT EXISTS (
    SELECT 1 FROM calls
    WHERE user_id = v_user_id AND call_date = p_call_date
  ) INTO v_call_exists;

  IF NOT v_call_exists THEN
    RETURN json_build_object('success', false, 'code', 'NO_CALL_ON_DATE');
  END IF;

  -- Upsert the rating (insert or update on conflict)
  INSERT INTO call_ratings (user_id, call_date, rating, notes)
  VALUES (v_user_id, p_call_date, p_rating, p_notes)
  ON CONFLICT (user_id, call_date)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    notes = EXCLUDED.notes,
    updated_at = now();

  RETURN json_build_object('success', true, 'code', 'SUCCESS');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'code', 'UNKNOWN_ERROR', 'message', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_call_rating(DATE, TEXT, TEXT) TO authenticated;

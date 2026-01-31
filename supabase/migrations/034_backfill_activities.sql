-- Migration: Backfill activities from existing call_ratings
-- Date: 2026-01-31
-- Description: One-time backfill to populate activities table with historical call ratings

-- Insert activity for each existing call rating
INSERT INTO activities (user_id, activity_type, metadata, created_at)
SELECT
  cr.user_id,
  'call_rated',
  jsonb_build_object(
    'call_date', cr.call_date::TEXT,
    'rating', cr.rating,
    'hours_slept', cr.hours_slept
  ),
  COALESCE(cr.updated_at, cr.created_at) -- Use the rating timestamp as activity time
FROM call_ratings cr
-- Avoid duplicates if any activities already exist
WHERE NOT EXISTS (
  SELECT 1 FROM activities a
  WHERE a.user_id = cr.user_id
    AND a.activity_type = 'call_rated'
    AND a.metadata->>'call_date' = cr.call_date::TEXT
);

-- Migration: Fix streak calculation to use heart's shift_date instead of server CURRENT_DATE
-- Date: 2026-01-23
-- Description: The streak trigger was using CURRENT_DATE (server UTC) instead of NEW.shift_date
--              (user's local date). This caused streaks to break for users in non-UTC timezones.
--              Now the streak logic uses the heart's shift_date which is already in the user's timezone.

-- Drop and recreate the streak trigger function
CREATE OR REPLACE FUNCTION update_streak_on_heart()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    current_streak = CASE
      -- If last heart was yesterday (in user's timezone), increment streak
      WHEN last_heart_sent_date = NEW.shift_date - INTERVAL '1 day'
        THEN current_streak + 1
      -- If last heart was today (in user's timezone), keep current streak
      WHEN last_heart_sent_date = NEW.shift_date
        THEN current_streak
      -- Otherwise (gap in sending), reset to 1
      ELSE 1
    END,
    longest_streak = CASE
      -- Update longest if new streak is higher
      WHEN (
        CASE
          WHEN last_heart_sent_date = NEW.shift_date - INTERVAL '1 day'
            THEN current_streak + 1
          WHEN last_heart_sent_date = NEW.shift_date
            THEN current_streak
          ELSE 1
        END
      ) > longest_streak
        THEN (
          CASE
            WHEN last_heart_sent_date = NEW.shift_date - INTERVAL '1 day'
              THEN current_streak + 1
            WHEN last_heart_sent_date = NEW.shift_date
              THEN current_streak
            ELSE 1
          END
        )
      ELSE longest_streak
    END,
    -- Store user's local date, not server date
    last_heart_sent_date = NEW.shift_date
  WHERE id = NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger itself doesn't need to be recreated since it already references this function
-- The function update will take effect immediately

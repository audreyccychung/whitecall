-- WhiteCall V0 Database Schema
-- Last Updated: 2026-01-10
-- Includes all retention features for V0

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends Supabase auth.users with WhiteCall-specific data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_type TEXT NOT NULL, -- 'penguin', 'bear', 'cat', 'dog', 'rabbit', 'fox', 'owl', 'panda'
  avatar_color TEXT DEFAULT '#FFB6C1', -- hex color for customization
  is_on_call BOOLEAN DEFAULT FALSE,
  call_date DATE, -- Date when user marked themselves on call (for auto-expiry)

  -- RETENTION: Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_heart_sent_date DATE,

  -- RETENTION: Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================
-- Bidirectional friendship relationships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure unique friendships (no duplicates)
  UNIQUE(user_id, friend_id),

  -- Prevent self-friendship
  CHECK (user_id != friend_id)
);

-- Indexes for friendship queries
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);

-- ============================================================================
-- HEARTS TABLE
-- ============================================================================
-- Records of hearts sent between users
CREATE TABLE hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT 'wishes you a white call!',
  shift_date DATE NOT NULL, -- which day this heart is for
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- One heart per friend per day (encourages sending to all friends on call)
  UNIQUE(sender_id, recipient_id, shift_date)
);

-- Index for performance (get hearts for user on specific date)
CREATE INDEX idx_hearts_recipient_date ON hearts(recipient_id, shift_date);
CREATE INDEX idx_hearts_sender ON hearts(sender_id);

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
-- User preferences for sound, haptic feedback, notifications
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- USER BADGES TABLE (for V0.5+)
-- ============================================================================
-- Gamification: milestone badges for engagement
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'first_heart', 'caring_colleague', 'support_squad', etc.
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Each user can only earn each badge once
  UNIQUE(user_id, badge_type)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can view friends' profiles
CREATE POLICY "Users can view friends' profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid()
    )
  );

-- Users can search/view all profiles (for adding friends)
CREATE POLICY "Users can search profiles by username"
  ON profiles FOR SELECT
  USING (true); -- Allow viewing basic profile info for friend search

-- FRIENDSHIPS POLICIES
-- Users can view their own friendships
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can create friendships
CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- HEARTS POLICIES
-- Users can view hearts sent to them
CREATE POLICY "Users can view received hearts"
  ON hearts FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can view hearts they sent
CREATE POLICY "Users can view sent hearts"
  ON hearts FOR SELECT
  USING (sender_id = auth.uid());

-- Users can send hearts to friends only
CREATE POLICY "Users can send hearts to friends"
  ON hearts FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    recipient_id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid()
    )
  );

-- USER SETTINGS POLICIES
-- Users can view and modify own settings
CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- USER BADGES POLICIES
-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

-- Users can view friends' badges (for social proof)
CREATE POLICY "Users can view friends' badges"
  ON user_badges FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM friendships WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM friendships WHERE friend_id = auth.uid()
    )
  );

-- System can insert badges (typically done via server function)
CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_settings table
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user_settings when profile is created
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create settings
CREATE TRIGGER create_settings_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();

-- Function to update streak when heart is sent
CREATE OR REPLACE FUNCTION update_streak_on_heart()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    current_streak = CASE
      -- If last heart was yesterday, increment streak
      WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day'
        THEN current_streak + 1
      -- If last heart was today, keep current streak
      WHEN last_heart_sent_date = CURRENT_DATE
        THEN current_streak
      -- Otherwise (gap in sending), reset to 1
      ELSE 1
    END,
    longest_streak = CASE
      -- Update longest if new streak is higher
      WHEN (
        CASE
          WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day'
            THEN current_streak + 1
          WHEN last_heart_sent_date = CURRENT_DATE
            THEN current_streak
          ELSE 1
        END
      ) > longest_streak
        THEN (
          CASE
            WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day'
              THEN current_streak + 1
            WHEN last_heart_sent_date = CURRENT_DATE
              THEN current_streak
            ELSE 1
          END
        )
      ELSE longest_streak
    END,
    last_heart_sent_date = CURRENT_DATE
  WHERE id = NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak
CREATE TRIGGER update_streak_on_heart_sent
  AFTER INSERT ON hearts
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_heart();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View to get users currently on call (useful for queries)
-- Only shows users who are on call TODAY (auto-expires at midnight)
CREATE OR REPLACE VIEW users_on_call AS
SELECT id, username, display_name, avatar_type, avatar_color
FROM profiles
WHERE is_on_call = TRUE AND call_date = CURRENT_DATE;

-- ============================================================================
-- INITIAL DATA / SEED DATA (Optional)
-- ============================================================================

-- You can add seed data here if needed for testing
-- Example: INSERT INTO profiles (id, username, ...) VALUES (...);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Migration complete!
-- Run this in your Supabase SQL editor to set up the database.

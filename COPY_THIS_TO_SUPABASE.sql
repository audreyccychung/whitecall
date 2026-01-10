-- WhiteCall V0 Database Schema
-- Copy this ENTIRE file and paste into Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_type TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#FFB6C1',
  is_on_call BOOLEAN DEFAULT FALSE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_heart_sent_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);

-- ============================================================================
-- HEARTS TABLE
-- ============================================================================
CREATE TABLE hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT 'wishes you a white call!',
  shift_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(sender_id, recipient_id, shift_date)
);

CREATE INDEX idx_hearts_recipient_date ON hearts(recipient_id, shift_date);
CREATE INDEX idx_hearts_sender ON hearts(sender_id);

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- USER BADGES TABLE
-- ============================================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, badge_type)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view friends' profiles" ON profiles FOR SELECT USING (
  id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid()
  )
);
CREATE POLICY "Users can search profiles by username" ON profiles FOR SELECT USING (true);

-- FRIENDSHIPS POLICIES
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own friendships" ON friendships FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- HEARTS POLICIES
CREATE POLICY "Users can view received hearts" ON hearts FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can view sent hearts" ON hearts FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY "Users can send hearts to friends" ON hearts FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  recipient_id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid()
  )
);

-- USER SETTINGS POLICIES
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- USER BADGES POLICIES
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view friends' badges" ON user_badges FOR SELECT USING (
  user_id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid()
  )
);
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_settings_on_profile AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_user_settings();

CREATE OR REPLACE FUNCTION update_streak_on_heart()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    current_streak = CASE
      WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_heart_sent_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = CASE
      WHEN (CASE
          WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
          WHEN last_heart_sent_date = CURRENT_DATE THEN current_streak
          ELSE 1
        END) > longest_streak
        THEN (CASE
          WHEN last_heart_sent_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
          WHEN last_heart_sent_date = CURRENT_DATE THEN current_streak
          ELSE 1
        END)
      ELSE longest_streak
    END,
    last_heart_sent_date = CURRENT_DATE
  WHERE id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_on_heart_sent AFTER INSERT ON hearts FOR EACH ROW EXECUTE FUNCTION update_streak_on_heart();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW users_on_call AS
SELECT id, username, display_name, avatar_type, avatar_color
FROM profiles
WHERE is_on_call = TRUE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Migration: Add push subscriptions table
-- Stores Web Push API subscriptions for users to receive notifications

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Web Push subscription data (from PushSubscription.toJSON())
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Metadata
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One subscription per endpoint per user
  UNIQUE(user_id, endpoint)
);

-- Index for looking up subscriptions by user
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Service role needs full access for Edge Function cleanup of stale subscriptions
CREATE POLICY "Service role has full access"
  ON push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Update trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add trigger to send push notification on heart insert
-- Requires pg_net extension to be enabled in Supabase dashboard first
-- Uses async HTTP call so heart insert is not blocked by notification delivery

-- Note: pg_net must be enabled manually in Supabase Dashboard:
-- Database > Extensions > Search "pg_net" > Enable

-- Function to trigger push notification via Edge Function
CREATE OR REPLACE FUNCTION trigger_heart_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_edge_function_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Check if recipient has notifications enabled
  -- If no user_settings row exists, default to not sending (opt-in)
  IF NOT EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_id = NEW.recipient_id AND notifications_enabled = TRUE
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if recipient has any push subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM push_subscriptions
    WHERE user_id = NEW.recipient_id
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  -- Get Edge Function URL from app settings
  -- Set this in Supabase: Database > Settings > Configuration
  -- Or hardcode for now during development
  v_edge_function_url := coalesce(
    current_setting('app.settings.edge_function_url', true),
    'https://uerolgdehjywyjlfqymx.supabase.co/functions/v1'
  );

  -- Get service role key for auth (stored in vault or settings)
  v_service_role_key := current_setting('app.settings.service_role_key', true);

  -- Async HTTP call to Edge Function (fire and forget)
  -- This does NOT block the heart insert transaction
  PERFORM net.http_post(
    url := v_edge_function_url || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_service_role_key, '')
    ),
    body := jsonb_build_object(
      'heart_id', NEW.id,
      'sender_id', NEW.sender_id,
      'recipient_id', NEW.recipient_id,
      'message', NEW.message
    )
  );

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but NEVER fail the heart insert
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger (AFTER INSERT so heart is committed first)
-- Only fires on successful insert, not on conflict/update
CREATE TRIGGER heart_push_notification_trigger
  AFTER INSERT ON hearts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_heart_push_notification();

-- Add comment explaining the trigger
COMMENT ON TRIGGER heart_push_notification_trigger ON hearts IS
  'Sends push notification to recipient when a heart is inserted. Fire-and-forget via pg_net.';

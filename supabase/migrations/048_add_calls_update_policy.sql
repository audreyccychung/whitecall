-- Add UPDATE RLS policy for calls table
-- Without this, upsert (used by setShift) silently fails when updating an existing shift
-- because RLS blocks the UPDATE path. Users were forced to "Clear" first (DELETE) then re-select (INSERT).
-- With this policy, users can directly switch shift types in one tap.

CREATE POLICY "Users can update own shifts" ON calls
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

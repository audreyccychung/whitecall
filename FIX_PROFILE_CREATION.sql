-- FIX: Add missing INSERT policy for profiles table
-- This allows users to create their own profile after signup
-- Run this in your Supabase SQL Editor

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

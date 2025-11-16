-- Add preferred_platform column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_platform text;
-- Add tutorial_progress column to store completion status for each tutorial context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_progress JSONB DEFAULT '{}'::jsonb;
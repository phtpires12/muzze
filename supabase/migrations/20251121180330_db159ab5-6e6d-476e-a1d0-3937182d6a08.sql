-- Add XP and freeze fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS streak_freezes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_points integer DEFAULT 0;

-- Create table for freeze usage history
CREATE TABLE IF NOT EXISTS streak_freeze_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on freeze usage table
ALTER TABLE streak_freeze_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for streak_freeze_usage
CREATE POLICY "Users can view own freeze usage"
  ON streak_freeze_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freeze usage"
  ON streak_freeze_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable pg_cron and pg_net extensions for scheduled freeze checks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
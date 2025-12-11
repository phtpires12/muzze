-- Add highest_level column to profiles table (non-regressive level system)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS highest_level integer DEFAULT 1;

-- Initialize highest_level for existing users based on their current XP
UPDATE public.profiles 
SET highest_level = CASE 
  WHEN xp_points >= 60000 THEN 7
  WHEN xp_points >= 30000 THEN 6
  WHEN xp_points >= 15000 THEN 5
  WHEN xp_points >= 7000 THEN 4
  WHEN xp_points >= 3000 THEN 3
  WHEN xp_points >= 1000 THEN 2
  ELSE 1
END
WHERE highest_level IS NULL OR highest_level = 1;
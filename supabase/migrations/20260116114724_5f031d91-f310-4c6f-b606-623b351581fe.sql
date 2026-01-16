-- Add column to track desktop tutorial completion
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS desktop_tutorial_completed boolean DEFAULT false;
-- Add editing_times jsonb column to store time spent on each editing step
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS editing_times jsonb DEFAULT '{}';
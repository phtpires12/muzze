-- Add editing_progress column to scripts table
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS editing_progress text[] DEFAULT '{}';
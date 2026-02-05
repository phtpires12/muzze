-- Add new columns for Editing Workspace
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS video_references jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS music_reference jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS editing_notes text DEFAULT NULL;
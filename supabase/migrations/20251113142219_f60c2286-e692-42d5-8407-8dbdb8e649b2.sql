-- Add status and reference_url columns to scripts table
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft_idea',
ADD COLUMN IF NOT EXISTS reference_url text;

-- Add check constraint for valid status values
ALTER TABLE public.scripts 
ADD CONSTRAINT scripts_status_check 
CHECK (status IN ('draft_idea', 'scheduled_idea', 'script', 'completed'));

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_scripts_status ON public.scripts(status);

-- Update existing scripts to have 'script' status (they are already scripts)
UPDATE public.scripts 
SET status = 'script' 
WHERE status = 'draft_idea' AND content IS NOT NULL AND content != '';
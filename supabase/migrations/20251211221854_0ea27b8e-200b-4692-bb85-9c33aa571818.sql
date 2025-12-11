-- Add publish_status and published_at columns to scripts table
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'planejado',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scripts_publish_status ON public.scripts(publish_status);

-- Add comment for documentation
COMMENT ON COLUMN public.scripts.publish_status IS 'Publication status: planejado, pronto_para_postar, postado, perdido';
COMMENT ON COLUMN public.scripts.published_at IS 'Timestamp when content was marked as posted';
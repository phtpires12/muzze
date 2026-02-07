-- Add columns for main video when script has no shot list
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS main_video_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS main_video_type TEXT DEFAULT NULL;

COMMENT ON COLUMN public.scripts.main_video_url IS 'Main video URL for scripts without shot list (phrase-by-phrase workflow)';
COMMENT ON COLUMN public.scripts.main_video_type IS 'Type of video source: google_drive, dropbox, youtube, other';
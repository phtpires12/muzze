-- Add central_idea field to scripts table
ALTER TABLE public.scripts
ADD COLUMN central_idea TEXT;
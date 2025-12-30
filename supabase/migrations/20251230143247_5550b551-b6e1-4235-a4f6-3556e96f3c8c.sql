-- Add notes column to scripts table for storing free-form annotations
ALTER TABLE public.scripts ADD COLUMN notes text;
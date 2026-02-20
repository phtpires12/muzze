ALTER TABLE public.profiles 
ADD COLUMN upgrade_celebrated JSONB NOT NULL DEFAULT '{}';
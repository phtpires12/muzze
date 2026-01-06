-- Create user_trophies table to persist trophy unlocks
CREATE TABLE public.user_trophies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trophy_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shown BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trophy_id)
);

-- Enable RLS
ALTER TABLE public.user_trophies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trophies"
ON public.user_trophies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trophies"
ON public.user_trophies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trophies"
ON public.user_trophies
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_trophies_user_id ON public.user_trophies(user_id);
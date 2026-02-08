-- Create user_recaps table for storing progress recap data
CREATE TABLE public.user_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Período do recap
  period_type TEXT NOT NULL CHECK (period_type IN ('30d', '60d', '90d', '180d', '365d')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Dados calculados automaticamente
  total_minutes INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL DEFAULT 0,
  avg_daily_minutes NUMERIC(8,2) DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  
  -- Inputs manuais do usuário
  followers_count INTEGER,
  had_viral BOOLEAN,
  
  -- Dados computados (breakdown detalhado)
  computed_stats JSONB DEFAULT '{}',
  
  -- Status e timestamps
  is_eligible BOOLEAN DEFAULT TRUE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, period_type, period_end)
);

-- Enable RLS
ALTER TABLE public.user_recaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recaps"
  ON public.user_recaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recaps"
  ON public.user_recaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recaps"
  ON public.user_recaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_recaps_user_id ON public.user_recaps(user_id);
CREATE INDEX idx_user_recaps_user_viewed ON public.user_recaps(user_id, viewed_at);
CREATE INDEX idx_user_recaps_eligible ON public.user_recaps(user_id, is_eligible) WHERE is_eligible = true;
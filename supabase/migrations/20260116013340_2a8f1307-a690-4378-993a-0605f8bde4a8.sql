-- Tabela para histórico de assinaturas da Zouti
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Dados da Zouti
  zouti_transaction_id TEXT UNIQUE,
  zouti_subscription_id TEXT,
  zouti_customer_email TEXT NOT NULL,
  zouti_product_id TEXT,
  
  -- Status e plano
  plan_type TEXT NOT NULL DEFAULT 'pro',
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Datas
  started_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadados
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Usuários só veem próprias assinaturas
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_zouti_email ON public.subscriptions(zouti_customer_email);
CREATE INDEX idx_subscriptions_zouti_transaction ON public.subscriptions(zouti_transaction_id);

-- Função para buscar user_id por email (SECURITY DEFINER para acessar auth.users)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM auth.users WHERE email = _email LIMIT 1
$$;
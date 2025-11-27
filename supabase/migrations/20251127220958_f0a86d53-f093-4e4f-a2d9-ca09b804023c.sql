-- Criar tabela device_tokens para armazenar tokens de push notification
CREATE TABLE public.device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Enable RLS para device_tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies para device_tokens
CREATE POLICY "Users can view own tokens" ON public.device_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela notification_logs para registrar notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  notification_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT DEFAULT NULL
);

-- Índice para consultas rápidas
CREATE INDEX idx_notification_logs_user_date 
  ON public.notification_logs(user_id, notification_date);

-- Enable RLS para notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para notification_logs
CREATE POLICY "Users can view own logs" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.notification_logs
  FOR DELETE USING (auth.uid() = user_id);
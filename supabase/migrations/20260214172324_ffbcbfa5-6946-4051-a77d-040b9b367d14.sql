-- Fix 1: Corrigir o default da coluna current_workflow para um valor válido
ALTER TABLE public.profiles 
ALTER COLUMN current_workflow SET DEFAULT 'classic';

-- Fix 2: Permitir inserção de analytics_events sem autenticação (para logs de erro de signup)
DROP POLICY IF EXISTS "Users can insert own analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);
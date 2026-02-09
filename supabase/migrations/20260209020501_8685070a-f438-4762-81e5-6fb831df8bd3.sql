-- Adicionar coluna timer_start_mode à tabela profiles
-- 'auto' = timer inicia imediatamente (padrão)
-- 'on_input' = timer espera primeira ação do usuário
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timer_start_mode text DEFAULT 'auto';
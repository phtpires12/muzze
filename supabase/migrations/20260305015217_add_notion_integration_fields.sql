-- Adiciona campos para armazenar tokens de integração do Notion no perfil
ALTER TABLE public.profiles
ADD COLUMN notion_access_token TEXT,
ADD COLUMN notion_workspace_id TEXT;

-- Protege o token contra acessos indevidos via views / triggers (RLS na tabela profiles já deve lidar com o select de usuários)

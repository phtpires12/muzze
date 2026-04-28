-- Permite leitura pública de scripts via links compartilhados.
-- Qualquer pessoa (anon ou authenticated) pode fazer SELECT na tabela scripts.
-- Isso viabiliza que links de conteúdo compartilhados funcionem sem login.
CREATE POLICY "scripts_public_read"
ON public.scripts
FOR SELECT
TO anon, authenticated
USING (true);

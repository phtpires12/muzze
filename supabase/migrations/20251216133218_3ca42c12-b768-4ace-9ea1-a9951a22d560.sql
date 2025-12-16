-- Adicionar coluna thumbnail_url na tabela scripts
ALTER TABLE public.scripts ADD COLUMN thumbnail_url TEXT;

-- Criar bucket público para thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true);

-- Policy: Usuários podem fazer upload de suas próprias thumbnails
CREATE POLICY "Users can upload own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Thumbnails são públicas para visualização
CREATE POLICY "Thumbnails are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Policy: Usuários podem atualizar suas próprias thumbnails
CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Usuários podem deletar suas próprias thumbnails
CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Remover a constraint antiga
ALTER TABLE public.scripts DROP CONSTRAINT scripts_status_check;

-- Adicionar nova constraint com todos os status do workflow
ALTER TABLE public.scripts ADD CONSTRAINT scripts_status_check 
CHECK (status = ANY (ARRAY[
  'draft_idea'::text,     -- Ideação
  'scheduled_idea'::text, -- Ideia agendada (legado, manter compatibilidade)
  'draft'::text,          -- Roteiro
  'script'::text,         -- Roteiro (legado, manter compatibilidade)
  'review'::text,         -- Revisão
  'recording'::text,      -- Gravação
  'editing'::text,        -- Edição
  'completed'::text,      -- Completado/Publicado
  'published'::text       -- Publicado
]));
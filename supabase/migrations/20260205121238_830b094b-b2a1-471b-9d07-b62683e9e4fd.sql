-- Fase 1: Atualizar constraint de profiles.current_workflow
-- Primeiro: remover constraint antiga que só aceita 'A', 'B', 'C'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_current_workflow_check;

-- Segundo: migrar dados ANTES de adicionar nova constraint
UPDATE profiles 
SET current_workflow = 'classic' 
WHERE current_workflow IS NULL 
   OR current_workflow NOT IN ('classic', 'freestyle', 'minimalist');

-- Terceiro: adicionar nova constraint com os IDs corretos dos templates
ALTER TABLE profiles ADD CONSTRAINT profiles_current_workflow_check 
  CHECK (current_workflow = ANY (ARRAY['classic', 'freestyle', 'minimalist']));

-- Fase 2: Adicionar campo workflow_template na tabela scripts
-- NULL = usa workflow global do usuário
-- 'classic' | 'freestyle' | 'minimalist' = workflow específico daquele conteúdo
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS workflow_template text DEFAULT NULL;

-- Adicionar constraint para validar valores permitidos
ALTER TABLE scripts ADD CONSTRAINT scripts_workflow_template_check 
  CHECK (workflow_template IS NULL OR workflow_template = ANY (ARRAY['classic', 'freestyle', 'minimalist']));
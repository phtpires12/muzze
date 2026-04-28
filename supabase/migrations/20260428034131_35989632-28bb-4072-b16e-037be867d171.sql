-- 1. Adicionar 'client' ao enum workspace_role
ALTER TYPE public.workspace_role ADD VALUE IF NOT EXISTS 'client';

-- 2. Adicionar coluna client_approved_at em scripts
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS client_approved_at timestamp with time zone;

-- 3. Criar tabela de comentários do cliente nos scripts
CREATE TABLE IF NOT EXISTS public.script_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_script_comments_script_id ON public.script_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_workspace_id ON public.script_comments(workspace_id);

ALTER TABLE public.script_comments ENABLE ROW LEVEL SECURITY;

-- Membros do workspace podem ver comentários
CREATE POLICY "Workspace members can view comments"
  ON public.script_comments FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Usuários autenticados membros do workspace podem inserir comentários (próprios)
CREATE POLICY "Workspace members can insert own comments"
  ON public.script_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_workspace_member(auth.uid(), workspace_id)
  );

-- Owner / admins do workspace e o autor podem atualizar (ex: marcar como resolvido)
CREATE POLICY "Owners and authors can update comments"
  ON public.script_comments FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_workspace_owner_safe(auth.uid(), workspace_id)
  );

-- Owner do workspace e o autor podem deletar
CREATE POLICY "Owners and authors can delete comments"
  ON public.script_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_workspace_owner_safe(auth.uid(), workspace_id)
  );

-- Trigger de updated_at
CREATE TRIGGER update_script_comments_updated_at
  BEFORE UPDATE ON public.script_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scripts_updated_at();

-- 4. Trigger para garantir que role='client' só seja convidado em workspaces de plano Studio
CREATE OR REPLACE FUNCTION public.validate_client_invite_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_plan text;
BEGIN
  IF NEW.role = 'client' THEN
    SELECT p.plan_type INTO owner_plan
    FROM public.workspaces w
    JOIN public.profiles p ON p.user_id = w.owner_id
    WHERE w.id = NEW.workspace_id;

    IF owner_plan IS DISTINCT FROM 'studio' THEN
      RAISE EXCEPTION 'Convidar clientes é exclusivo do plano Studio';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_client_invite_plan_trigger ON public.workspace_invites;
CREATE TRIGGER validate_client_invite_plan_trigger
  BEFORE INSERT ON public.workspace_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_client_invite_plan();

DROP TRIGGER IF EXISTS validate_client_member_plan_trigger ON public.workspace_members;
CREATE TRIGGER validate_client_member_plan_trigger
  BEFORE INSERT ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_client_invite_plan();
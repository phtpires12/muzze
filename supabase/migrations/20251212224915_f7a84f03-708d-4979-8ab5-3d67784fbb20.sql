-- ============================================
-- FASE 1: Sistema de Convidados MVP - Database
-- ============================================

-- 1. Criar enum para papéis no workspace
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'collaborator');

-- 2. Criar tabela de workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Meu Workspace',
  max_guests INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela de membros do workspace
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'collaborator',
  allowed_timer_stages TEXT[] NOT NULL DEFAULT '{}',
  can_edit_stages TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, user_id)
);

-- 4. Criar tabela de convites pendentes
CREATE TABLE public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'collaborator',
  allowed_timer_stages TEXT[] NOT NULL DEFAULT '{}',
  can_edit_stages TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  UNIQUE (workspace_id, email)
);

-- 5. Adicionar workspace_id na tabela scripts
ALTER TABLE public.scripts 
  ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 6. Habilitar RLS em todas as novas tabelas
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÕES SQL (Security Definer)
-- ============================================

-- Função: Obter papel do usuário em um workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN w.owner_id = _user_id THEN 'owner'::workspace_role
      ELSE wm.role
    END
  FROM public.workspaces w
  LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = _user_id
  WHERE w.id = _workspace_id
$$;

-- Função: Verificar se usuário é membro do workspace (owner ou membro)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id AND accepted_at IS NOT NULL
  )
$$;

-- Função: Verificar se usuário pode usar timer em determinada etapa
CREATE OR REPLACE FUNCTION public.can_use_timer(_user_id UUID, _workspace_id UUID, _stage TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Owner pode usar timer em qualquer etapa
      WHEN EXISTS (SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id) THEN TRUE
      -- Admin pode usar timer em qualquer etapa
      WHEN EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id AND role = 'admin' AND accepted_at IS NOT NULL) THEN TRUE
      -- Colaborador pode usar timer apenas nas etapas permitidas
      WHEN EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = _workspace_id 
          AND user_id = _user_id 
          AND role = 'collaborator'
          AND accepted_at IS NOT NULL
          AND _stage = ANY(allowed_timer_stages)
      ) THEN TRUE
      ELSE FALSE
    END
$$;

-- Função: Verificar se usuário pode editar em determinada etapa
CREATE OR REPLACE FUNCTION public.can_edit_stage(_user_id UUID, _workspace_id UUID, _stage TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Owner pode editar qualquer etapa
      WHEN EXISTS (SELECT 1 FROM public.workspaces WHERE id = _workspace_id AND owner_id = _user_id) THEN TRUE
      -- Admin pode editar qualquer etapa
      WHEN EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _user_id AND role = 'admin' AND accepted_at IS NOT NULL) THEN TRUE
      -- Colaborador pode editar apenas nas etapas permitidas
      WHEN EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = _workspace_id 
          AND user_id = _user_id 
          AND role = 'collaborator'
          AND accepted_at IS NOT NULL
          AND _stage = ANY(can_edit_stages)
      ) THEN TRUE
      ELSE FALSE
    END
$$;

-- Função: Verificar se pode convidar mais membros (limite de 3)
CREATE OR REPLACE FUNCTION public.can_invite_to_workspace(_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) 
    FROM public.workspace_members 
    WHERE workspace_id = _workspace_id AND accepted_at IS NOT NULL
  ) < (
    SELECT max_guests FROM public.workspaces WHERE id = _workspace_id
  )
$$;

-- Função: Obter workspace do usuário (como owner)
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.workspaces WHERE owner_id = _user_id LIMIT 1
$$;

-- ============================================
-- RLS POLICIES - workspaces
-- ============================================

-- Owner pode ver seu próprio workspace
CREATE POLICY "Owners can view own workspace"
ON public.workspaces FOR SELECT
USING (auth.uid() = owner_id);

-- Membros podem ver workspaces que participam
CREATE POLICY "Members can view joined workspaces"
ON public.workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = id 
      AND user_id = auth.uid() 
      AND accepted_at IS NOT NULL
  )
);

-- Owner pode atualizar seu workspace
CREATE POLICY "Owners can update own workspace"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id);

-- Owner pode deletar seu workspace
CREATE POLICY "Owners can delete own workspace"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- Sistema pode inserir workspace (via trigger)
CREATE POLICY "System can insert workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- RLS POLICIES - workspace_members
-- ============================================

-- Owner do workspace pode gerenciar membros
CREATE POLICY "Workspace owners can manage members"
ON public.workspace_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

-- Membros podem ver outros membros do mesmo workspace
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

-- Usuário pode atualizar seu próprio registro (para aceitar convite)
CREATE POLICY "Users can accept own invites"
ON public.workspace_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - workspace_invites
-- ============================================

-- Owner do workspace pode gerenciar convites
CREATE POLICY "Workspace owners can manage invites"
ON public.workspace_invites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

-- Convidado pode ver convites pelo seu email
CREATE POLICY "Invitees can view own invites"
ON public.workspace_invites FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- ============================================
-- ATUALIZAR POLICIES DE SCRIPTS
-- ============================================

-- Adicionar policy para membros do workspace verem scripts
CREATE POLICY "Workspace members can view scripts"
ON public.scripts FOR SELECT
USING (
  workspace_id IS NOT NULL 
  AND public.is_workspace_member(auth.uid(), workspace_id)
);

-- ============================================
-- ATUALIZAR TRIGGER handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (user_id, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo')
  );
  
  -- Criar streak
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  -- Criar settings
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  
  -- Criar workspace para o novo usuário
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, 'Meu Workspace')
  RETURNING id INTO new_workspace_id;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- CRIAR WORKSPACES PARA USUÁRIOS EXISTENTES
-- ============================================

INSERT INTO public.workspaces (owner_id, name)
SELECT id, 'Meu Workspace'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspaces WHERE owner_id = auth.users.id
);

-- ============================================
-- VINCULAR SCRIPTS EXISTENTES AOS WORKSPACES
-- ============================================

UPDATE public.scripts s
SET workspace_id = (
  SELECT id FROM public.workspaces WHERE owner_id = s.user_id LIMIT 1
)
WHERE s.workspace_id IS NULL;
-- 1. Criar função is_workspace_owner_safe (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_workspace_owner_safe(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = _workspace_id AND w.owner_id = _user_id
  )
$$;

-- 2. Atualizar política "Members can view workspace members"
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;

CREATE POLICY "Members can view workspace members" ON public.workspace_members
FOR SELECT USING (
  is_workspace_member_safe(auth.uid(), workspace_id)
  OR is_workspace_owner_safe(auth.uid(), workspace_id)
);

-- 3. Atualizar política "Workspace owners can manage members"
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;

CREATE POLICY "Workspace owners can manage members" ON public.workspace_members
FOR ALL USING (
  is_workspace_owner_safe(auth.uid(), workspace_id)
);
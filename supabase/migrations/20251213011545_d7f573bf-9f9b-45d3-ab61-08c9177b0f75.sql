-- 1. Remover a policy bugada que causa recursão infinita
DROP POLICY IF EXISTS "Members can view joined workspaces" ON public.workspaces;

-- 2. Criar função SECURITY DEFINER para verificar membership sem recursão
CREATE OR REPLACE FUNCTION public.is_workspace_member_safe(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.user_id = _user_id
      AND wm.workspace_id = _workspace_id
      AND wm.accepted_at IS NOT NULL
  )
$$;

-- 3. Recriar a policy corretamente usando a função
CREATE POLICY "Members can view joined workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR
  is_workspace_member_safe(auth.uid(), id)
);
-- 1. Criar função SECURITY DEFINER para verificar convites sem recursão
CREATE OR REPLACE FUNCTION public.can_view_workspace_as_invitee(_email text, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_invites wi
    WHERE wi.workspace_id = _workspace_id 
      AND wi.email = _email 
      AND wi.expires_at > now()
  )
$$;

-- 2. Dropar e recriar política em workspaces (estava com bug: wi.workspace_id = wi.id)
DROP POLICY IF EXISTS "Invitees can view invited workspaces" ON workspaces;

CREATE POLICY "Invitees can view invited workspaces" ON workspaces
FOR SELECT USING (
  can_view_workspace_as_invitee(auth.email(), id)
);

-- 3. Dropar e recriar política em workspace_invites para usar função safe
DROP POLICY IF EXISTS "Workspace owners can manage invites" ON workspace_invites;

CREATE POLICY "Workspace owners can manage invites" ON workspace_invites
FOR ALL USING (
  is_workspace_owner_safe(auth.uid(), workspace_id)
);
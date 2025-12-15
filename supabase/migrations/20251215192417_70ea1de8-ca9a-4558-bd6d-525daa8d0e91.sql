-- Permitir que convidados vejam workspaces para os quais foram convidados
CREATE POLICY "Invitees can view invited workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_invites wi
    WHERE wi.workspace_id = id
      AND wi.email = auth.email()
      AND wi.expires_at > now()
  )
);
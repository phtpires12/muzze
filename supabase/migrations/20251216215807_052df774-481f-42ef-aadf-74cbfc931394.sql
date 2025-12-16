-- Function to check if authenticated user has a valid invite for a workspace
CREATE OR REPLACE FUNCTION public.has_valid_invite(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_invites wi
    WHERE wi.workspace_id = _workspace_id 
      AND wi.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND wi.expires_at > now()
  )
$$;

-- Policy to allow users to accept invites and join workspaces
CREATE POLICY "Users can accept invites to join workspace"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND has_valid_invite(workspace_id)
);
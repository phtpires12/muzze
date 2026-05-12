-- Create a security definer function to fetch workspace members with email (owner-only)
CREATE OR REPLACE FUNCTION public.get_workspace_members_full(_workspace_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  workspace_id uuid,
  role workspace_role,
  email text,
  invited_at timestamptz,
  invited_by uuid,
  accepted_at timestamptz,
  allowed_timer_stages text[],
  can_edit_stages text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_workspace_owner_safe(auth.uid(), _workspace_id) THEN
    RAISE EXCEPTION 'Unauthorized: only workspace owner can list member emails';
  END IF;

  RETURN QUERY
  SELECT wm.id, wm.user_id, wm.workspace_id, wm.role, wm.email,
         wm.invited_at, wm.invited_by, wm.accepted_at,
         wm.allowed_timer_stages, wm.can_edit_stages
  FROM public.workspace_members wm
  WHERE wm.workspace_id = _workspace_id;
END;
$$;

-- Revoke direct SELECT on the email column from regular roles so only owners
-- (via the SECURITY DEFINER function above) can read member emails.
REVOKE SELECT (email) ON public.workspace_members FROM anon, authenticated;

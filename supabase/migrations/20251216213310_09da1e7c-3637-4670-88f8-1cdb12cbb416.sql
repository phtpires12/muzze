-- Function to get invite by ID without RLS restrictions
-- Allows unauthenticated users to view invite details by ID (UUID acts as secret)
CREATE OR REPLACE FUNCTION public.get_invite_by_id(invite_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role workspace_role,
  workspace_id uuid,
  invited_by uuid,
  expires_at timestamptz,
  allowed_timer_stages text[],
  can_edit_stages text[],
  workspace_name text,
  workspace_owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wi.id,
    wi.email,
    wi.role,
    wi.workspace_id,
    wi.invited_by,
    wi.expires_at,
    wi.allowed_timer_stages,
    wi.can_edit_stages,
    w.name as workspace_name,
    w.owner_id as workspace_owner_id
  FROM workspace_invites wi
  JOIN workspaces w ON w.id = wi.workspace_id
  WHERE wi.id = invite_id;
END;
$$;
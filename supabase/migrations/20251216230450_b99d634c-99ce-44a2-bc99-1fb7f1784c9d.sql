-- Fix existing workspace_members without email by getting it from workspace_invites
UPDATE public.workspace_members wm
SET email = wi.email
FROM public.workspace_invites wi
WHERE wm.workspace_id = wi.workspace_id
  AND wm.email IS NULL
  AND wi.email IS NOT NULL
  AND wm.accepted_at IS NOT NULL;

-- Also try to get email from auth.users for any remaining members without email
UPDATE public.workspace_members wm
SET email = au.email
FROM auth.users au
WHERE wm.user_id = au.id
  AND wm.email IS NULL
  AND wm.accepted_at IS NOT NULL;

-- Delete pending invites where the user is already an active member in that workspace
DELETE FROM public.workspace_invites wi
WHERE EXISTS (
  SELECT 1 FROM public.workspace_members wm
  WHERE wm.workspace_id = wi.workspace_id
    AND wm.accepted_at IS NOT NULL
    AND wm.user_id IN (
      SELECT id FROM auth.users WHERE email = wi.email
    )
);
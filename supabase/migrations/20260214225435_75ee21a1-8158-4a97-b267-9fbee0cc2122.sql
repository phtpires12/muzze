
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, username text, plan_type text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();
  
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF NOT (public.has_role(caller_id, 'admin') OR public.has_role(caller_id, 'developer')) THEN
    RAISE EXCEPTION 'Unauthorized: only admins/developers can list users';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    au.email::text,
    p.username,
    p.plan_type,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

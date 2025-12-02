-- ===========================================
-- CORREÇÃO DE VULNERABILIDADE CRÍTICA
-- grant_role_by_email privilege escalation
-- ===========================================

-- 1. Corrigir a função: mudar AND para OR (bloquear NULL ao invés de bypass)
CREATE OR REPLACE FUNCTION public.grant_role_by_email(_email text, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _caller_id UUID;
BEGIN
  -- Get the caller's user ID
  _caller_id := auth.uid();
  
  -- CORREÇÃO: Mudar IS NOT NULL AND para IS NULL OR
  -- Agora bloqueia quando caller é NULL OU quando não é admin
  IF _caller_id IS NULL OR NOT public.has_role(_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can grant roles';
  END IF;
  
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 2. Revogar EXECUTE de todos os roles públicos
REVOKE EXECUTE ON FUNCTION public.grant_role_by_email(text, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_role_by_email(text, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_role_by_email(text, app_role) FROM authenticated;

-- 3. Criar admin inicial (phtpires12@gmail.com)
-- Feito via migração porque a função agora exige admin existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('12446de8-cf35-4984-886c-edffcfe33a72', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
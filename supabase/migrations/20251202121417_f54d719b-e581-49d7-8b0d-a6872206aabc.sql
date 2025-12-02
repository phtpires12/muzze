-- ========================================
-- P0: Proteger função grant_role_by_email
-- ========================================
CREATE OR REPLACE FUNCTION public.grant_role_by_email(_email text, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _caller_id UUID;
BEGIN
  -- Get the caller's user ID
  _caller_id := auth.uid();
  
  -- Check if caller is admin (or if this is service_role calling without auth context)
  IF _caller_id IS NOT NULL AND NOT public.has_role(_caller_id, 'admin') THEN
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
$function$;

-- ========================================
-- P2: Adicionar INSERT policy em notification_logs
-- ========================================
CREATE POLICY "Users can insert own notification logs"
  ON public.notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- P4: Tornar bucket shot-references privado
-- ========================================
UPDATE storage.buckets 
SET public = false 
WHERE id = 'shot-references';

-- Política para upload de imagens (garantir que existe)
DROP POLICY IF EXISTS "Users can upload own shot references" ON storage.objects;
CREATE POLICY "Users can upload own shot references"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'shot-references' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para visualizar próprias imagens
DROP POLICY IF EXISTS "Users can view own shot references" ON storage.objects;
CREATE POLICY "Users can view own shot references"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'shot-references' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para deletar próprias imagens
DROP POLICY IF EXISTS "Users can delete own shot references" ON storage.objects;
CREATE POLICY "Users can delete own shot references"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shot-references' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
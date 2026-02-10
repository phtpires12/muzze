CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Essencial: criar perfil
  INSERT INTO public.profiles (user_id, timezone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo'));

  -- Secundarios: se falharem, nao impedem a criacao do usuario
  BEGIN
    INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.settings (user_id) VALUES (NEW.id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.workspaces (owner_id, name) VALUES (NEW.id, 'Meu Workspace');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$function$;
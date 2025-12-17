-- Trigger para auto-preencher workspace_id se NULL (backup safety net)
CREATE OR REPLACE FUNCTION public.set_script_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    NEW.workspace_id := (
      SELECT id FROM public.workspaces 
      WHERE owner_id = NEW.user_id 
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger apenas se não existir
DROP TRIGGER IF EXISTS set_script_workspace_trigger ON public.scripts;

CREATE TRIGGER set_script_workspace_trigger
BEFORE INSERT ON public.scripts
FOR EACH ROW
EXECUTE FUNCTION public.set_script_workspace();
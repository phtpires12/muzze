-- Criar função de validação para duration_seconds
CREATE OR REPLACE FUNCTION public.validate_stage_time_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Proteção: rejeitar duração maior que 2 horas (7200 segundos)
  IF NEW.duration_seconds > 7200 THEN
    RAISE EXCEPTION 'duration_seconds exceeds maximum allowed (7200): %', NEW.duration_seconds;
  END IF;
  
  -- Proteção: rejeitar duração negativa
  IF NEW.duration_seconds < 0 THEN
    RAISE EXCEPTION 'duration_seconds cannot be negative: %', NEW.duration_seconds;
  END IF;
  
  -- Validação extra: duração não pode ser maior que diferença entre ended_at e started_at
  IF NEW.started_at IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
    DECLARE
      calculated_duration INTEGER;
    BEGIN
      calculated_duration := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::integer;
      
      -- Se duração reportada for mais de 60 segundos maior que a calculada, algo está errado
      IF NEW.duration_seconds > calculated_duration + 60 THEN
        -- Log para debug mas usar o valor calculado em vez de rejeitar
        RAISE NOTICE 'duration_seconds (%) exceeds calculated duration (%), using calculated value', 
          NEW.duration_seconds, calculated_duration;
        NEW.duration_seconds := GREATEST(calculated_duration, 0);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger BEFORE INSERT para validar duration
DROP TRIGGER IF EXISTS validate_stage_time_duration_trigger ON public.stage_times;

CREATE TRIGGER validate_stage_time_duration_trigger
BEFORE INSERT ON public.stage_times
FOR EACH ROW
EXECUTE FUNCTION public.validate_stage_time_duration();
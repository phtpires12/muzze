
CREATE OR REPLACE FUNCTION public.get_monthly_stage_summary(
  p_user_id uuid,
  p_start_utc timestamptz,
  p_end_utc timestamptz,
  p_timezone text DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE(day_key text, total_minutes numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(started_at AT TIME ZONE p_timezone, 'YYYY-MM-DD') as dk,
    SUM(duration_seconds) / 60.0 as tm
  FROM public.stage_times
  WHERE user_id = p_user_id
    AND started_at >= p_start_utc
    AND started_at <= p_end_utc
    AND started_at IS NOT NULL
  GROUP BY dk
  ORDER BY dk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

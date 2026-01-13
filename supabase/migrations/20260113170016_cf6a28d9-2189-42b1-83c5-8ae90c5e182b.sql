-- Create aggregator function to get stage time summary (avoids 1000 row limit)
CREATE OR REPLACE FUNCTION public.get_stage_time_summary()
RETURNS TABLE (
  total_seconds bigint,
  sessions_over_25 integer,
  sessions_without_pause integer,
  sessions_without_abandon integer,
  used_stages text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(st.duration_seconds), 0)::bigint as total_seconds,
    COUNT(*) FILTER (WHERE st.duration_seconds >= 1500)::integer as sessions_over_25,
    COUNT(*) FILTER (WHERE st.duration_seconds >= 1500 AND st.had_pause = false)::integer as sessions_without_pause,
    COUNT(*) FILTER (WHERE st.duration_seconds >= 1500 AND st.was_abandoned = false)::integer as sessions_without_abandon,
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT st.stage), NULL) as used_stages
  FROM public.stage_times st
  WHERE st.user_id = auth.uid();
END;
$$;
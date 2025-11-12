-- Fix the search_path security issue by setting it explicitly
DROP FUNCTION IF EXISTS get_weekly_leaderboard();

CREATE OR REPLACE FUNCTION get_weekly_leaderboard()
RETURNS TABLE (
  user_id uuid,
  username text,
  weekly_time_seconds integer,
  weekly_ideas_count integer,
  rank bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH weekly_stats AS (
    SELECT 
      p.user_id,
      COALESCE(p.username, split_part(au.email, '@', 1)) as username,
      COALESCE(SUM(st.duration_seconds), 0)::integer as weekly_time_seconds,
      COALESCE(COUNT(DISTINCT CASE 
        WHEN st.stage = 'ideation' THEN st.id 
      END), 0)::integer as weekly_ideas_count
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.user_id
    LEFT JOIN stage_times st ON st.user_id = p.user_id 
      AND st.created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY p.user_id, p.username, au.email
  )
  SELECT 
    ws.user_id,
    ws.username,
    ws.weekly_time_seconds,
    ws.weekly_ideas_count,
    RANK() OVER (ORDER BY ws.weekly_time_seconds DESC, ws.weekly_ideas_count DESC) as rank
  FROM weekly_stats ws
  ORDER BY rank;
END;
$$;
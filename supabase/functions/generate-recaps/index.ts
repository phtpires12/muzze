import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecapStats {
  total_minutes: number;
  days_active: number;
  avg_daily_minutes: number;
  sessions_count: number;
  stage_breakdown: Record<string, number>;
  best_day: string | null;
  best_day_minutes: number;
  weekly_goal_hit_count: number;
  favorite_stage: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Verify cron secret for scheduled calls
    const authHeader = req.headers.get('Authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized call to generate-recaps');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who might need a recap
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, weekly_goal_minutes, timezone')
      .eq('first_login', false);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const results = {
      processed: 0,
      recaps_created: 0,
      errors: [] as string[],
    };

    const periodConfigs = [
      { type: '30d', days: 30 },
      { type: '60d', days: 60 },
      { type: '90d', days: 90 },
      { type: '180d', days: 180 },
      { type: '365d', days: 365 },
    ];

    for (const profile of profiles || []) {
      try {
        results.processed++;

        // Get user's first session date
        const { data: firstSession } = await supabase
          .from('stage_times')
          .select('created_at')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (!firstSession) {
          continue; // No sessions yet
        }

        const firstSessionDate = new Date(firstSession.created_at);
        const today = new Date();
        const daysSinceStart = Math.floor((today.getTime() - firstSessionDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check each period type
        for (const period of periodConfigs) {
          if (daysSinceStart < period.days) continue;

          const periodEnd = new Date();
          periodEnd.setHours(23, 59, 59, 999);
          
          const periodStart = new Date(periodEnd);
          periodStart.setDate(periodStart.getDate() - period.days);
          periodStart.setHours(0, 0, 0, 0);

          // Check if recap already exists for this period
          const { data: existingRecap } = await supabase
            .from('user_recaps')
            .select('id')
            .eq('user_id', profile.user_id)
            .eq('period_type', period.type)
            .eq('period_end', periodEnd.toISOString().split('T')[0])
            .single();

          if (existingRecap) {
            continue; // Recap already exists
          }

          // Calculate stats for this period
          const stats = await calculateRecapStats(
            supabase,
            profile.user_id,
            periodStart,
            periodEnd,
            profile.weekly_goal_minutes || 420
          );

          // Check eligibility (at least 3 days active)
          if (stats.days_active < 3) {
            continue;
          }

          // Get previous period stats for comparison
          const previousPeriodStart = new Date(periodStart);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - period.days);
          const previousPeriodEnd = new Date(periodStart);
          previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

          let previousPeriodMinutes: number | null = null;
          const { data: previousStats } = await supabase
            .from('stage_times')
            .select('duration_seconds')
            .eq('user_id', profile.user_id)
            .gte('created_at', previousPeriodStart.toISOString())
            .lte('created_at', previousPeriodEnd.toISOString());

          if (previousStats && previousStats.length > 0) {
            previousPeriodMinutes = Math.round(
              previousStats.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60
            );
          }

          // Create the recap
          const computedStats = {
            stageBreakdown: stats.stage_breakdown,
            bestDay: stats.best_day,
            bestDayMinutes: stats.best_day_minutes,
            weeklyGoalHitCount: stats.weekly_goal_hit_count,
            totalWeeks: Math.ceil(period.days / 7),
            previousPeriodMinutes,
            favoriteStage: stats.favorite_stage,
          };

          const { error: insertError } = await supabase
            .from('user_recaps')
            .insert({
              user_id: profile.user_id,
              period_type: period.type,
              period_start: periodStart.toISOString().split('T')[0],
              period_end: periodEnd.toISOString().split('T')[0],
              total_minutes: stats.total_minutes,
              days_active: stats.days_active,
              avg_daily_minutes: stats.avg_daily_minutes,
              sessions_count: stats.sessions_count,
              computed_stats: computedStats,
              is_eligible: true,
            });

          if (insertError) {
            console.error(`Error inserting recap for user ${profile.user_id}:`, insertError);
            results.errors.push(`User ${profile.user_id}: ${insertError.message}`);
          } else {
            results.recaps_created++;
            console.log(`Created ${period.type} recap for user ${profile.user_id}`);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error(`Error processing user ${profile.user_id}:`, error);
        results.errors.push(`User ${profile.user_id}: ${error.message}`);
      }
    }

    console.log('Generate recaps completed:', results);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error;
    console.error('Error in generate-recaps:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateRecapStats(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  weeklyGoalMinutes: number
): Promise<RecapStats> {
  // Get all sessions in the period
  const { data: sessions } = await supabase
    .from('stage_times')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  if (!sessions || sessions.length === 0) {
    return {
      total_minutes: 0,
      days_active: 0,
      avg_daily_minutes: 0,
      sessions_count: 0,
      stage_breakdown: {},
      best_day: null,
      best_day_minutes: 0,
      weekly_goal_hit_count: 0,
      favorite_stage: null,
    };
  }

  // Calculate total minutes and sessions
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const sessionsCount = sessions.length;

  // Calculate days active
  const activeDays = new Set<string>();
  const dailyMinutes: Record<string, number> = {};
  const stageBreakdown: Record<string, number> = {};

  for (const session of sessions) {
    const day = new Date(session.created_at).toISOString().split('T')[0];
    activeDays.add(day);
    
    const mins = Math.round((session.duration_seconds || 0) / 60);
    dailyMinutes[day] = (dailyMinutes[day] || 0) + mins;

    if (session.stage) {
      stageBreakdown[session.stage] = (stageBreakdown[session.stage] || 0) + mins;
    }
  }

  const daysActive = activeDays.size;
  const avgDailyMinutes = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0;

  // Find best day
  let bestDay: string | null = null;
  let bestDayMinutes = 0;
  for (const [day, mins] of Object.entries(dailyMinutes)) {
    if (mins > bestDayMinutes) {
      bestDay = day;
      bestDayMinutes = mins;
    }
  }

  // Find favorite stage
  let favoriteStage: string | null = null;
  let maxStageMinutes = 0;
  for (const [stage, mins] of Object.entries(stageBreakdown)) {
    if (mins > maxStageMinutes) {
      favoriteStage = stage;
      maxStageMinutes = mins;
    }
  }

  // Calculate weekly goals hit
  const weeks = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
  let weeklyGoalHitCount = 0;
  
  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(periodStart);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let weekMinutes = 0;
    for (const [day, mins] of Object.entries(dailyMinutes)) {
      const dayDate = new Date(day);
      if (dayDate >= weekStart && dayDate <= weekEnd) {
        weekMinutes += mins;
      }
    }

    if (weekMinutes >= weeklyGoalMinutes) {
      weeklyGoalHitCount++;
    }
  }

  return {
    total_minutes: totalMinutes,
    days_active: daysActive,
    avg_daily_minutes: avgDailyMinutes,
    sessions_count: sessionsCount,
    stage_breakdown: stageBreakdown,
    best_day: bestDay,
    best_day_minutes: bestDayMinutes,
    weekly_goal_hit_count: weeklyGoalHitCount,
    favorite_stage: favoriteStage,
  };
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= TIMEZONE UTILS (duplicado do frontend para Deno) =============

/**
 * Retorna a chave do dia no formato 'YYYY-MM-DD' para uma data em uma timezone específica
 */
function getDayKey(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Retorna a chave do dia atual na timezone especificada
 */
function getTodayKey(timezone: string): string {
  return getDayKey(new Date(), timezone);
}

/**
 * Retorna a chave do dia anterior na timezone especificada
 */
function getYesterdayKey(timezone: string): string {
  const todayKey = getTodayKey(timezone);
  const [year, month, day] = todayKey.split('-').map(Number);
  
  // Criar data no meio do dia para evitar problemas de DST
  const todayNoon = new Date(year, month - 1, day, 12, 0, 0);
  todayNoon.setDate(todayNoon.getDate() - 1);
  
  return `${todayNoon.getFullYear()}-${String(todayNoon.getMonth() + 1).padStart(2, '0')}-${String(todayNoon.getDate()).padStart(2, '0')}`;
}

/**
 * Converte um dayKey (YYYY-MM-DD) em uma timezone para bounds UTC
 */
function getDayBoundsUTC(dayKey: string, timezone: string): { startUTC: Date; endUTC: Date } {
  const [year, month, day] = dayKey.split('-').map(Number);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Criar data de referência ao meio-dia para evitar problemas de DST
  const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Calcular offset da timezone
  const parts = formatter.formatToParts(refDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  const localDay = parseInt(getPart('day'));
  const localHour = parseInt(getPart('hour'));
  
  // Calcular diferença para encontrar offset
  const utcHours = refDate.getUTCHours();
  let offsetHours = utcHours - localHour;
  
  // Ajustar para mudança de dia
  if (localDay !== day) {
    offsetHours += (localDay > day ? -24 : 24);
  }
  
  // Criar início do dia: 00:00:00 na timezone → UTC
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0 + offsetHours, 0, 0, 0));
  
  // Criar fim do dia: 23:59:59.999 na timezone → UTC
  const endUTC = new Date(Date.UTC(year, month - 1, day, 23 + offsetHours, 59, 59, 999));
  
  return { startUTC, endUTC };
}

// ============= GAMIFICATION UTILS (duplicado do frontend para Deno) =============

// Rampa de hábito: meta diária mínima baseada no nível
function getDailyGoalMinutesForLevel(level: number): number {
  const safeLevel = typeof level === 'number' && !isNaN(level) ? Math.floor(level) : 1;
  if (safeLevel <= 1) return 5;
  if (safeLevel === 2) return 10;
  if (safeLevel === 3) return 15;
  return 25; // Nível 4+
}

// Calcula nível baseado em XP
function calculateLevelByXP(xp: number): number {
  const XP_LEVELS = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 300 },
    { level: 4, xpRequired: 700 },
    { level: 5, xpRequired: 1500 },
    { level: 6, xpRequired: 3000 },
    { level: 7, xpRequired: 6000 },
  ];
  
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i].level;
    }
  }
  return 1;
}

// Retorna o nível efetivo (não regressivo)
function getEffectiveLevel(xp: number, highestLevel: number): number {
  const calculatedLevel = calculateLevelByXP(xp);
  return Math.max(highestLevel || 1, calculatedLevel);
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: Verify cron secret to prevent unauthorized calls
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.log('Unauthorized: Invalid or missing cron secret');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting daily streak check...');

    // Get all user profiles with XP and highest_level for level calculation
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, min_streak_minutes, streak_freezes, timezone, xp_points, highest_level');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Checking ${profiles?.length || 0} users...`);

    for (const profile of profiles || []) {
      try {
        const timezone = profile.timezone || 'America/Sao_Paulo';
        
        // CORREÇÃO: Calcular "ontem" na timezone do usuário, não UTC
        const yesterdayKey = getYesterdayKey(timezone);
        const { startUTC, endUTC } = getDayBoundsUTC(yesterdayKey, timezone);

        console.log(`[check-streaks] User ${profile.user_id}:`, {
          timezone,
          yesterdayKey,
          startUTC: startUTC.toISOString(),
          endUTC: endUTC.toISOString(),
        });

        // Get all sessions from yesterday (usando created_at para consistência)
        const { data: sessions, error: sessionsError } = await supabase
          .from('stage_times')
          .select('duration_seconds, created_at')
          .eq('user_id', profile.user_id)
          .gte('created_at', startUTC.toISOString())
          .lte('created_at', endUTC.toISOString());

        if (sessionsError) {
          console.error(`Error fetching sessions for user ${profile.user_id}:`, sessionsError);
          continue;
        }

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;
        
        // Calcula a meta baseada no nível do usuário
        const effectiveLevel = getEffectiveLevel(profile.xp_points || 0, profile.highest_level || 1);
        const levelGoal = getDailyGoalMinutesForLevel(effectiveLevel);
        const userOverride = profile.min_streak_minutes || 0;
        const metMinutes = Math.max(levelGoal, userOverride);
        
        const passed = totalMinutes >= metMinutes;

        console.log(`[check-streaks] User ${profile.user_id}: ${totalMinutes.toFixed(2)} min (goal: ${metMinutes}, level: ${effectiveLevel}, passed: ${passed})`);

        if (!passed) {
          // Didn't meet goal - use freeze if available
          if (profile.streak_freezes > 0) {
            console.log(`[check-streaks] Using freeze for user ${profile.user_id}`);

            // Deduct freeze
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ streak_freezes: profile.streak_freezes - 1 })
              .eq('user_id', profile.user_id);

            if (updateError) {
              console.error(`Error updating freeze for user ${profile.user_id}:`, updateError);
              continue;
            }

            // Log freeze usage com timestamp correto (meia-noite do dia perdido na timezone)
            const freezeTimestamp = startUTC.toISOString();
            const { error: logError } = await supabase
              .from('streak_freeze_usage')
              .insert({ user_id: profile.user_id, used_at: freezeTimestamp });

            if (logError) {
              console.error(`Error logging freeze usage for user ${profile.user_id}:`, logError);
            }

            console.log(`[check-streaks] Freeze used successfully for user ${profile.user_id}, recorded for ${yesterdayKey}`);
          } else {
            console.log(`[check-streaks] Resetting streak for user ${profile.user_id} (no freezes available)`);

            // Reset streak
            const { error: resetError } = await supabase
              .from('streaks')
              .update({ current_streak: 0 })
              .eq('user_id', profile.user_id);

            if (resetError) {
              console.error(`Error resetting streak for user ${profile.user_id}:`, resetError);
            }
          }
        } else {
          console.log(`[check-streaks] User ${profile.user_id} met their goal for ${yesterdayKey}!`);
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.user_id}:`, userError);
      }
    }

    console.log('Daily streak check completed');

    return new Response(
      JSON.stringify({ success: true, checked: profiles?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-streaks function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

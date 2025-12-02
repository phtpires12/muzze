import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, min_streak_minutes, streak_freezes, timezone');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Checking ${profiles?.length || 0} users...`);

    for (const profile of profiles || []) {
      try {
        // Calculate yesterday's date range in user's timezone
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        console.log(`Checking user ${profile.user_id} for date ${yesterday.toISOString()}`);

        // Get all sessions from yesterday
        const { data: sessions, error: sessionsError } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', profile.user_id)
          .gte('started_at', yesterday.toISOString())
          .lte('started_at', yesterdayEnd.toISOString());

        if (sessionsError) {
          console.error(`Error fetching sessions for user ${profile.user_id}:`, sessionsError);
          continue;
        }

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;
        const metMinutes = profile.min_streak_minutes || 20;

        console.log(`User ${profile.user_id}: ${totalMinutes} minutes (goal: ${metMinutes})`);

        if (totalMinutes < metMinutes) {
          // Didn't meet goal - use freeze if available
          if (profile.streak_freezes > 0) {
            console.log(`Using freeze for user ${profile.user_id}`);

            // Deduct freeze
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ streak_freezes: profile.streak_freezes - 1 })
              .eq('user_id', profile.user_id);

            if (updateError) {
              console.error(`Error updating freeze for user ${profile.user_id}:`, updateError);
              continue;
            }

            // Log freeze usage
            const { error: logError } = await supabase
              .from('streak_freeze_usage')
              .insert({ user_id: profile.user_id, used_at: yesterday.toISOString() });

            if (logError) {
              console.error(`Error logging freeze usage for user ${profile.user_id}:`, logError);
            }

            console.log(`Freeze used successfully for user ${profile.user_id}`);
          } else {
            console.log(`Resetting streak for user ${profile.user_id} (no freezes available)`);

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
          console.log(`User ${profile.user_id} met their goal!`);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderMessage {
  title: string;
  body: string;
}

const REMINDER_MESSAGES: Record<string, ReminderMessage> = {
  'reminder_1': {
    title: '🔥 Hora de criar!',
    body: 'Sua ofensiva está esperando. Só faltam alguns minutos pra manter o ritmo!'
  },
  'reminder_2': {
    title: '⚡ Ainda dá tempo!',
    body: 'Que tal uma sessão rápida? Sua criatividade agradece.'
  },
  'reminder_3': {
    title: '😱 Última chance!',
    body: 'Sua ofensiva está em risco! Não deixe o fogo apagar.'
  }
};

async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(Deno.env.get('Firebase_API_KEY') || '{}');
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const privateKey = serviceAccount.private_key;
  
  // Import private key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(dataToSign)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendFCMNotification(token: string, message: ReminderMessage, accessToken: string): Promise<boolean> {
  try {
    const projectId = 'muzze-app';
    
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: message.title,
              body: message.body
            },
            webpush: {
              fcm_options: {
                link: '/'
              }
            }
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('FCM API Error:', response.status, errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting reminder check...');

    // Get access token for FCM
    const accessToken = await getAccessToken();
    console.log('FCM access token obtained');

    // Get all users with notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, reminder_time, timezone, daily_goal_minutes')
      .eq('notifications_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with notifications enabled`);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let sentCount = 0;

    for (const profile of profiles || []) {
      try {
        // Calculate user's local time
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: profile.timezone }));
        const userHour = userTime.getHours();
        const userMinute = userTime.getMinutes();
        
        // Parse reminder_time (format: HH:MM:SS or HH:MM)
        const [reminderHour, reminderMinute] = profile.reminder_time.split(':').map(Number);
        
        // Check if user has completed daily goal
        const { data: stageTimes } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', profile.user_id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);
        
        const totalSeconds = stageTimes?.reduce((sum, st) => sum + (st.duration_seconds || 0), 0) || 0;
        const totalMinutes = Math.floor(totalSeconds / 60);
        const dailyGoalMet = totalMinutes >= (profile.daily_goal_minutes || 25);

        if (dailyGoalMet) {
          console.log(`User ${profile.user_id} already met daily goal, skipping`);
          continue;
        }

        // Determine which reminder to send based on time
        let reminderType: string | null = null;
        
        const minutesSinceReminder = (userHour * 60 + userMinute) - (reminderHour * 60 + reminderMinute);
        
        if (minutesSinceReminder >= 0 && minutesSinceReminder < 60) {
          reminderType = 'reminder_1';
        } else if (minutesSinceReminder >= 240 && minutesSinceReminder < 300) {
          reminderType = 'reminder_2';
        } else if (minutesSinceReminder >= 480 && minutesSinceReminder < 540) {
          reminderType = 'reminder_3';
        }

        if (!reminderType) {
          continue;
        }

        // Check if this reminder was already sent today
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('notification_type', reminderType)
          .eq('notification_date', today)
          .single();

        if (existingLog) {
          console.log(`Reminder ${reminderType} already sent to user ${profile.user_id} today`);
          continue;
        }

        // Get user's device tokens
        const { data: tokens } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('user_id', profile.user_id);

        if (!tokens || tokens.length === 0) {
          console.log(`No tokens found for user ${profile.user_id}`);
          continue;
        }

        // Send notification to all user's devices
        const message = REMINDER_MESSAGES[reminderType];
        let successCount = 0;
        
        for (const { token } of tokens) {
          const success = await sendFCMNotification(token, message, accessToken);
          if (success) successCount++;
        }

        // Log the notification
        await supabase
          .from('notification_logs')
          .insert({
            user_id: profile.user_id,
            notification_type: reminderType,
            notification_date: today,
            success: successCount > 0,
            error_message: successCount === 0 ? 'Failed to send to any device' : null
          });

        if (successCount > 0) {
          sentCount++;
          console.log(`Sent ${reminderType} to user ${profile.user_id} (${successCount} devices)`);
        }
      } catch (error) {
        console.error(`Error processing user ${profile.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${profiles?.length || 0} users, sent ${sentCount} reminders`,
        sentCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

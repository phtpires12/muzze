import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationMessage {
  title: string;
  body: string;
}

const SUBSCRIPTION_MESSAGES: Record<string, NotificationMessage> = {
  'subscription_expiring_3d': {
    title: '⏰ Sua assinatura expira em 3 dias',
    body: 'Renove agora para não perder acesso ao Muzze Pro!'
  },
  'subscription_expiring_1d': {
    title: '⚠️ Último dia de Muzze Pro',
    body: 'Sua assinatura expira amanhã. Renove para continuar!'
  },
  'subscription_expired': {
    title: '😔 Seu plano voltou para Free',
    body: 'Sua assinatura expirou. Assine novamente para desbloquear todos os recursos!'
  },
  'payment_failed': {
    title: '❌ Problema no pagamento',
    body: 'Não conseguimos processar seu pagamento. Atualize seus dados.'
  },
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

async function sendFCMNotification(token: string, message: NotificationMessage, accessToken: string): Promise<boolean> {
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
                link: '/my-plan'
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

async function sendNotificationToUser(
  supabase: any,
  userId: string,
  notificationType: string,
  accessToken: string
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already sent today
  const { data: existingLog } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .eq('notification_date', today)
    .single();

  if (existingLog) {
    console.log(`Notification ${notificationType} already sent to user ${userId} today`);
    return false;
  }

  // Get user's device tokens
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) {
    console.log(`No tokens found for user ${userId}`);
    return false;
  }

  const message = SUBSCRIPTION_MESSAGES[notificationType];
  if (!message) {
    console.error(`Unknown notification type: ${notificationType}`);
    return false;
  }

  let successCount = 0;
  for (const { token } of tokens) {
    const success = await sendFCMNotification(token, message, accessToken);
    if (success) successCount++;
  }

  // Log the notification
  await supabase
    .from('notification_logs')
    .insert({
      user_id: userId,
      notification_type: notificationType,
      notification_date: today,
      success: successCount > 0,
      error_message: successCount === 0 ? 'Failed to send to any device' : null
    });

  return successCount > 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting subscription notification check...');

    const accessToken = await getAccessToken();
    console.log('FCM access token obtained');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Date calculations
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

    let sentCount = 0;

    // 1. Check subscriptions expiring in 3 days
    const { data: expiring3Days } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'cancelled')
      .gte('expires_at', `${threeDaysStr}T00:00:00`)
      .lt('expires_at', `${threeDaysStr}T23:59:59`);

    console.log(`Found ${expiring3Days?.length || 0} subscriptions expiring in 3 days`);

    for (const sub of expiring3Days || []) {
      const sent = await sendNotificationToUser(supabase, sub.user_id, 'subscription_expiring_3d', accessToken);
      if (sent) sentCount++;
    }

    // 2. Check subscriptions expiring in 1 day
    const { data: expiring1Day } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'cancelled')
      .gte('expires_at', `${oneDayStr}T00:00:00`)
      .lt('expires_at', `${oneDayStr}T23:59:59`);

    console.log(`Found ${expiring1Day?.length || 0} subscriptions expiring in 1 day`);

    for (const sub of expiring1Day || []) {
      const sent = await sendNotificationToUser(supabase, sub.user_id, 'subscription_expiring_1d', accessToken);
      if (sent) sentCount++;
    }

    // 3. Check subscriptions that expired today - downgrade and notify
    const { data: expiredToday } = await supabase
      .from('subscriptions')
      .select('user_id, id')
      .eq('status', 'cancelled')
      .gte('expires_at', `${today}T00:00:00`)
      .lt('expires_at', `${today}T23:59:59`);

    console.log(`Found ${expiredToday?.length || 0} subscriptions that expired today`);

    for (const sub of expiredToday || []) {
      // Downgrade to free
      await supabase
        .from('profiles')
        .update({ plan_type: 'free' })
        .eq('user_id', sub.user_id);

      // Mark subscription as expired
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      const sent = await sendNotificationToUser(supabase, sub.user_id, 'subscription_expired', accessToken);
      if (sent) sentCount++;
      
      console.log(`Downgraded user ${sub.user_id} to free due to expiration`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed subscriptions, sent ${sentCount} notifications`,
        stats: {
          expiring3Days: expiring3Days?.length || 0,
          expiring1Day: expiring1Day?.length || 0,
          expiredToday: expiredToday?.length || 0,
          notificationsSent: sentCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-subscription-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

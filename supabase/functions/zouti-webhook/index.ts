import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-zouti-signature',
};

// Mapeamento de produtos Zouti para planos
const PRODUCT_PLAN_MAP: Record<string, 'pro' | 'studio'> = {
  'prod_offer_6f2pv1lxpkwlwv72vv3xgs': 'pro',
};

// FCM Notification helpers
async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(Deno.env.get('Firebase_API_KEY') || '{}');
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;
  
  const header = { alg: 'RS256', typ: 'JWT' };
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
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function sendPaymentNotification(supabase: any, userId: string, title: string, body: string): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) {
      console.log(`No device tokens for user ${userId}`);
      return;
    }

    const projectId = 'muzze-app';
    
    for (const { token } of tokens) {
      await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              webpush: { fcm_options: { link: '/my-plan' } }
            }
          })
        }
      );
    }

    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: 'payment_issue',
        notification_date: new Date().toISOString().split('T')[0],
        success: true
      });

    console.log(`Payment notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
}

interface ZoutiWebhookPayload {
  event?: string;
  type?: string;
  status?: string;
  transaction_id?: string;
  subscription_id?: string;
  product?: {
    id?: string;
    name?: string;
  };
  customer?: {
    email?: string;
    name?: string;
  };
  // Campos alternativos dependendo da estrutura do webhook
  data?: {
    id?: string;
    status?: string;
    customer?: {
      email?: string;
    };
    product?: {
      id?: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar secret (opcional por enquanto, será ativado quando tiver o secret)
    const webhookSecret = Deno.env.get('ZOUTI_WEBHOOK_SECRET');
    const signatureHeader = req.headers.get('x-zouti-signature') || req.headers.get('x-webhook-secret');
    
    if (webhookSecret && signatureHeader !== webhookSecret) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const payload: ZoutiWebhookPayload = await req.json();
    console.log('Zouti webhook received:', JSON.stringify(payload, null, 2));

    // Extrair dados (adaptar conforme estrutura real do webhook da Zouti)
    const eventType = payload.event || payload.type || payload.status || '';
    const transactionId = payload.transaction_id || payload.data?.id || '';
    const subscriptionId = payload.subscription_id || '';
    const customerEmail = payload.customer?.email || payload.data?.customer?.email || '';
    const productId = payload.product?.id || payload.data?.product?.id || '';

    if (!customerEmail) {
      console.error('No customer email in payload');
      return new Response(
        JSON.stringify({ error: 'Missing customer email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar user_id pelo email usando a função RPC
    const { data: userId, error: userError } = await supabase
      .rpc('get_user_id_by_email', { _email: customerEmail.toLowerCase() });

    if (userError || !userId) {
      console.error('User not found for email:', customerEmail, userError);
      // Retornar 200 para não reprocessar (usuário pode não ter conta ainda)
      return new Response(
        JSON.stringify({ success: false, message: 'User not found', email: customerEmail }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found user:', userId, 'for email:', customerEmail);

    // Determinar plano baseado no produto
    const planType = PRODUCT_PLAN_MAP[productId] || 'pro';

    // Processar evento
    const eventLower = eventType.toLowerCase();
    
    if (eventLower.includes('aprovad') || eventLower.includes('ativ') || eventLower.includes('paid') || eventLower.includes('success')) {
      // APROVADO: Upgrade para pro
      console.log('Processing approval for user:', userId);

      // Atualizar plan_type no profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan_type: planType })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Calculate expires_at (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Inserir/atualizar subscription (upsert por transaction_id)
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          zouti_transaction_id: transactionId || `manual_${Date.now()}`,
          zouti_subscription_id: subscriptionId,
          zouti_customer_email: customerEmail.toLowerCase(),
          zouti_product_id: productId,
          plan_type: planType,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          raw_payload: payload,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'zouti_transaction_id',
        });

      if (subError) {
        console.error('Error inserting subscription:', subError);
        throw subError;
      }

      console.log('User upgraded to', planType);
      return new Response(
        JSON.stringify({ success: true, action: 'upgraded', plan: planType }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (eventLower.includes('cancel')) {
      // CANCELADO: Marcar cancelled_at mas manter acesso até expiração
      console.log('Processing cancellation for user:', userId);

      // Get current subscription to preserve expires_at or set it
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('started_at, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // If no expires_at, calculate from started_at + 30 days
      let expiresAt = currentSub?.expires_at;
      if (!expiresAt && currentSub?.started_at) {
        const startDate = new Date(currentSub.started_at);
        startDate.setDate(startDate.getDate() + 30);
        expiresAt = startDate.toISOString();
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subError) {
        console.error('Error updating subscription:', subError);
      }

      // Não downgrade imediato - usuário mantém acesso até fim do período
      console.log('Subscription cancelled, access maintained until expiration');
      return new Response(
        JSON.stringify({ success: true, action: 'cancelled', expires_at: expiresAt }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROBLEMA DE PAGAMENTO: Notificar usuário imediatamente
    if (eventLower.includes('atrasad') || eventLower.includes('inadimpl') || 
        eventLower.includes('fail') || eventLower.includes('expired') ||
        eventLower.includes('overdue') || eventLower.includes('unpaid')) {
      console.log('Processing payment issue for user:', userId);

      // Send immediate push notification
      await sendPaymentNotification(
        supabase,
        userId,
        '❌ Problema no pagamento',
        'Não conseguimos processar seu pagamento. Atualize seus dados para manter o acesso.'
      );

      return new Response(
        JSON.stringify({ success: true, action: 'payment_issue_notified' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (eventLower.includes('reembols') || eventLower.includes('refund') || eventLower.includes('chargeback')) {
      // REEMBOLSADO: Downgrade imediato para free
      console.log('Processing refund for user:', userId);

      // Atualizar subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .is('refunded_at', null);

      if (subError) {
        console.error('Error updating subscription:', subError);
      }

      // Downgrade imediato
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan_type: 'free' })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error downgrading profile:', profileError);
        throw profileError;
      }

      console.log('User downgraded to free due to refund');
      return new Response(
        JSON.stringify({ success: true, action: 'refunded', plan: 'free' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Evento não reconhecido - logar e retornar sucesso
    console.log('Unhandled event type:', eventType);
    return new Response(
      JSON.stringify({ success: true, action: 'logged', event: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

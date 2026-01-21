import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Esta versão é atualizada automaticamente a cada deploy
// O timestamp do deploy serve como identificador único da versão
const APP_VERSION = new Date().toISOString();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return new Response(
      JSON.stringify({
        version: APP_VERSION,
        timestamp: Date.now(),
        forceUpdate: false, // Pode ser usado para forçar updates em casos críticos
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Não cachear esta resposta
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in app-version function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

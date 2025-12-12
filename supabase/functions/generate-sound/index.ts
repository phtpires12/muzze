import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOUND_PROMPTS: Record<string, string> = {
  pause: "Soft UI click sound, gentle pause notification, subtle and modern, 0.5 seconds",
  resume: "Positive UI notification sound, gentle chime, encouraging resume action, 0.8 seconds",
  complete: "Achievement unlocked sound, celebratory chime, success notification, uplifting, 1.5 seconds"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();
    
    if (!type || !SOUND_PROMPTS[type]) {
      return new Response(
        JSON.stringify({ error: 'Invalid sound type. Use: pause, resume, or complete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log(`Generating sound effect: ${type}`);

    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: SOUND_PROMPTS[type],
        duration_seconds: type === 'complete' ? 1.5 : type === 'resume' ? 0.8 : 0.5,
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log(`Sound generated successfully: ${type}, size: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ audio: base64Audio, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating sound:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

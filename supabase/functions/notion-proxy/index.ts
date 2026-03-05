import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { code, redirect_uri } = await req.json()

        // As credenciais devem estar salvas nas 'Secrets' do projeto Lovable/Supabase
        const clientId = Deno.env.get('NOTION_CLIENT_ID')
        const clientSecret = Deno.env.get('NOTION_CLIENT_SECRET')

        if (!clientId || !clientSecret) {
            throw new Error('Notion OAuth credentials not configured')
        }

        const encoded = btoa(`${clientId}:${clientSecret}`);

        const notionResponse = await fetch("https://api.notion.com/v1/oauth/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                code,
                redirect_uri,
            }),
        });

        const notionData = await notionResponse.json();

        if (!notionResponse.ok) {
            console.error('Notion Error:', notionData);
            throw new Error(`Notion API Error: ${notionData.error || 'Unknown error'}`);
        }

        // Apenas devolvemos os tokens para o frontend poder salvar na table profiles
        return new Response(
            JSON.stringify({
                success: true,
                access_token: notionData.access_token,
                workspace_id: notionData.workspace_id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error: any) {
        console.error('Error on notion-proxy:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})

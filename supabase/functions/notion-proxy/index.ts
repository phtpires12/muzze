import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, ...params } = body;

    // =========================================================================
    // ACTION: OAUTH (Troca o Código pelo Access Token e Workspace ID)
    // =========================================================================
    if (action === "oauth") {
      const { code, redirect_uri } = params;
      const clientId = Deno.env.get("NOTION_CLIENT_ID");
      const clientSecret = Deno.env.get("NOTION_CLIENT_SECRET");

      if (!clientId || !clientSecret)
        throw new Error("Notion OAuth credentials not configured. Please add them in the Edge Functions Secrets.");

      const encoded = btoa(`${clientId}:${clientSecret}`);

      const notionResponse = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${encoded}`,
        },
        body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri }),
      });

      const notionData = await notionResponse.json();

      if (!notionResponse.ok) {
        throw new Error(`Notion API Error: ${notionData.error || notionData.message || "Unknown error"}`);
      }

      return new Response(
        JSON.stringify({ success: true, access_token: notionData.access_token, workspace_id: notionData.workspace_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // =========================================================================
    // ACTION: SEARCH_DATABASES (Busca as tabelas do Notion do usuário)
    // =========================================================================
    if (action === "search_databases") {
      const { token, query } = params;
      if (!token) throw new Error("Notion access token is missing");

      const bodyPayload: any = {
        filter: { value: "database", property: "object" },
      };

      if (query && typeof query === "string" && query.trim() !== "") {
        bodyPayload.query = query.trim();
      }

      const notionResponse = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await notionResponse.json();
      if (!notionResponse.ok) throw new Error(data.message || "Erro ao buscar tabelas do Notion");

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =========================================================================
    // ACTION: QUERY_DATABASE (Traz as linhas/páginas de uma tabela)
    // =========================================================================
    if (action === "query_database") {
      const { token, database_id } = params;
      if (!token || !database_id) throw new Error("Missing params");

      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 100,
          sorts: [{ direction: "descending", timestamp: "last_edited_time" }],
        }),
      });

      const data = await notionResponse.json();
      if (!notionResponse.ok) throw new Error(data.message || "Erro ao consultar a tabela do Notion");

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =========================================================================
    // ACTION: GET_BLOCKS (Traz o conteúdo rico de dentro de uma página)
    // =========================================================================
    if (action === "get_blocks") {
      const { token, page_id } = params;
      if (!token || !page_id) throw new Error("Missing params");

      const notionResponse = await fetch(`https://api.notion.com/v1/blocks/${page_id}/children?page_size=100`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      });

      const data = await notionResponse.json();
      if (!notionResponse.ok) throw new Error(data.message || "Erro ao buscar os blocos internos");

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Ação Default caso não bata com as de cima
    throw new Error("Action method not supported by this proxy");
  } catch (error: any) {
    console.error("Error on notion-proxy:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

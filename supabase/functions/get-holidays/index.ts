import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const countryCode = (url.searchParams.get("country_code") || "").toUpperCase();
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    if (!countryCode || countryCode.length !== 2) {
      return new Response(
        JSON.stringify({ error: "country_code is required (2-letter ISO code)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: cached } = await supabase
      .from("holiday_cache")
      .select("holidays, fetched_at")
      .eq("country_code", countryCode)
      .eq("year", year)
      .single();

    if (cached && new Date(cached.fetched_at) > thirtyDaysAgo) {
      return new Response(
        JSON.stringify(cached.holidays),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from Nager.Date API
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      console.error(`Nager.Date API error: ${apiResponse.status} - ${text}`);
      if (apiResponse.status === 404) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Failed to fetch holidays" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const holidays = await apiResponse.json();

    const simplifiedHolidays = holidays.map((h: Record<string, unknown>) => ({
      date: h.date,
      localName: h.localName,
      name: h.name,
      types: h.types,
    }));

    // Upsert into cache
    await supabase.from("holiday_cache").upsert(
      {
        country_code: countryCode,
        year,
        holidays: simplifiedHolidays,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "country_code,year" }
    );

    return new Response(JSON.stringify(simplifiedHolidays), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-holidays:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = [
  "http://localhost:4321",
  "https://meteo.cnsld.cc",
];

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  };
}

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    // Preflight OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    // GET /api/current
    if (path === "/api/current") {
      const { data, error } = await supabase
        .from("weather")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) return json({ error }, corsHeaders, 500);
      return json({ data: data?.[0] ?? null }, corsHeaders);
    }

    // GET /api/daily-stats
    if (path === "/api/daily-stats") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("weather")
        .select("temperature, humidity")
        .gte("created_at", startOfDay.toISOString());

      if (error) return json({ error }, corsHeaders, 500);

      if (!data || data.length === 0) {
        return json({
          data: {
            temp_max: null, temp_min: null,
            humidity_max: null, humidity_min: null,
            records_count: 0,
          },
        }, corsHeaders);
      }

      const temps = data.map((d) => d.temperature).filter((t) => t != null);
      const hums = data.map((d) => d.humidity).filter((h) => h != null);

      return json({
        data: {
          temp_max: temps.length > 0 ? Math.max(...temps) : null,
          temp_min: temps.length > 0 ? Math.min(...temps) : null,
          humidity_max: hums.length > 0 ? Math.max(...hums) : null,
          humidity_min: hums.length > 0 ? Math.min(...hums) : null,
          records_count: data.length,
        },
      }, corsHeaders);
    }

    // GET /api/history
    if (path === "/api/history") {
      const { data, error } = await supabase
        .from("weather")
        .select("*")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

      if (error) return json({ error }, corsHeaders, 500);
      return json({ data }, corsHeaders);
    }

    // 404 per qualsevol altra ruta
    return json({ error: "Not found" }, corsHeaders, 404);
  },
};

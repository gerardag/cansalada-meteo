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

export async function onRequest(context) {
  const { request, env } = context;

  // Gestionar preflight OPTIONS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  // Inicialitzar Supabase i passar-lo al context
  context.data.supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
  context.data.corsHeaders = getCorsHeaders(request);

  return await context.next();
}

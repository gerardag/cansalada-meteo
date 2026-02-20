export async function onRequestGet(context) {
  const { supabase, corsHeaders } = context.data;

  const { data, error } = await supabase
    .from("weather")
    .select("*")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ data }), {
    headers: corsHeaders,
  });
}

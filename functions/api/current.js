export async function onRequestGet(context) {
  const { supabase, corsHeaders } = context.data;

  const { data, error } = await supabase
    .from("weather")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ data: data?.[0] ?? null }), {
    headers: corsHeaders,
  });
}

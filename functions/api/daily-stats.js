export async function onRequestGet(context) {
  const { supabase, corsHeaders } = context.data;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("weather")
    .select("temperature, humidity")
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({
        data: {
          temp_max: null,
          temp_min: null,
          humidity_max: null,
          humidity_min: null,
          records_count: 0,
        },
      }),
      { headers: corsHeaders }
    );
  }

  const temperatures = data.map((d) => d.temperature).filter((t) => t != null);
  const humidities = data.map((d) => d.humidity).filter((h) => h != null);

  return new Response(
    JSON.stringify({
      data: {
        temp_max: temperatures.length > 0 ? Math.max(...temperatures) : null,
        temp_min: temperatures.length > 0 ? Math.min(...temperatures) : null,
        humidity_max: humidities.length > 0 ? Math.max(...humidities) : null,
        humidity_min: humidities.length > 0 ? Math.min(...humidities) : null,
        records_count: data.length,
      },
    }),
    { headers: corsHeaders }
  );
}

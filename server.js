

const Fastify = require("fastify");
require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const fastify = Fastify({ logger: true });

const supabase = createClient(
		process.env.SUPABASE_URL,
		process.env.SUPABASE_ANON_KEY
);

// Último registro
fastify.get("/api/current", async (request, reply) => {
	const { data, error } = await supabase
		.from("weather")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(1);
	if (error) return reply.code(500).send({ error });
	return { data: data && data[0] };
});

// Estadísticas del día actual (máx/mín de temperatura y humedad)
fastify.get("/api/daily-stats", async (request, reply) => {
	// Obtener el inicio del día actual en UTC
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const { data, error } = await supabase
		.from("weather")
		.select("temperature, humidity")
		.gte("created_at", startOfDay.toISOString());

	if (error) return reply.code(500).send({ error });

	if (!data || data.length === 0) {
		return {
			data: {
				temp_max: null,
				temp_min: null,
				humidity_max: null,
				humidity_min: null,
				records_count: 0
			}
		};
	}

	// Calcular máximos y mínimos
	const temperatures = data.map(d => d.temperature).filter(t => t != null);
	const humidities = data.map(d => d.humidity).filter(h => h != null);

	return {
		data: {
			temp_max: temperatures.length > 0 ? Math.max(...temperatures) : null,
			temp_min: temperatures.length > 0 ? Math.min(...temperatures) : null,
			humidity_max: humidities.length > 0 ? Math.max(...humidities) : null,
			humidity_min: humidities.length > 0 ? Math.min(...humidities) : null,
			records_count: data.length
		}
	};
});

// Histórico últimas 24h
fastify.get("/api/history", async (request, reply) => {
	const { data, error } = await supabase
		.from("weather")
		.select("*")
		.gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
		.order("created_at", { ascending: true });
	if (error) return reply.code(500).send({ error });
	return { data };
});

fastify.listen({ port: 3000, host: "0.0.0.0" });


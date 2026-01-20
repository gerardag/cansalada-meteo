
require('dotenv').config();
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const GW2000_IP = "192.168.1.57";
const INTERVAL = 60_000;

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY,
);

const ID_MAP = {
	"0x02": "temperature",
	"0x07": "humidity",
	"0x03": "dew_point",
	"0x0B": "wind_speed",
	"0x0C": "wind_gust",
	"0x19": "wind_gust_max",
	"0x15": "solar_radiation",
	"0x17": "uv_index",
	"0x6D": "wind_direction",
};

const RAIN_ID_MAP = {
	"0x0D": "rain_event",
	"0x0E": "rain_rate",
	"0x10": "rain_daily",
	"0x11": "rain_weekly",
	"0x12": "rain_monthly",
	"0x13": "rain_total",
};

function parseCommonList(commonList) {
	const result = {};
	for (const item of commonList) {
		const key = ID_MAP[item.id];
		if (key) {
			// Extrae solo el número si hay unidades
			let value = item.val;
			if (typeof value === "string") {
				value = value.replace(/[^\d.-]+/g, "");
			}
			result[key] = parseFloat(value);
		}
	}
	return result;
}

function parseRainData(rainList) {
	const result = {};
	for (const item of rainList) {
		const key = RAIN_ID_MAP[item.id];
		if (key) {
			// Extrae solo el número si hay unidades
			let value = item.val;
			if (typeof value === "string") {
				value = value.replace(/[^\d.-]+/g, "");
			}
			result[key] = parseFloat(value);
		}
	}
	return result;
}

async function poll() {
	try {
		const { data: res } = await axios.get(
			`http://${GW2000_IP}/get_livedata_info`,
		);

		// Procesar common_list
		const weatherData = parseCommonList(res.common_list || []);

		// Procesar datos de lluvia
		const rainData = parseRainData(res.rain || []);

		// Combinar ambos objetos
		const completeData = { ...weatherData, ...rainData };

		const { data, error } = await supabase
			.from("weather")
			.insert([completeData])
			.select();

		if (error) console.error("Supabase write error", error);
		else console.log("Inserted", data);
	} catch (err) {
		console.error("Poll error", err.message);
	}
}

setInterval(poll, INTERVAL);
poll();

-- Schema para la tabla weather con datos de lluvia incluidos
-- Puedes ejecutar este SQL en Supabase después de borrar la tabla anterior

DROP TABLE IF EXISTS weather;

CREATE TABLE weather (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Datos meteorológicos básicos
  temperature NUMERIC(5,2),
  humidity NUMERIC(5,2),
  dew_point NUMERIC(5,2),

  -- Datos de viento
  wind_speed NUMERIC(6,2),
  wind_gust NUMERIC(6,2),
  wind_gust_max NUMERIC(6,2),

  -- Datos de radiación solar y UV
  solar_radiation NUMERIC(8,2),
  uv_index INTEGER,

  -- Datos de lluvia
  rain_event NUMERIC(8,2),      -- Lluvia del evento actual (mm)
  rain_rate NUMERIC(8,2),        -- Tasa de lluvia (mm/hr)
  rain_daily NUMERIC(8,2),       -- Lluvia del día (mm)
  rain_weekly NUMERIC(8,2),      -- Lluvia de la semana (mm)
  rain_monthly NUMERIC(8,2),     -- Lluvia del mes (mm)
  rain_total NUMERIC(8,2)        -- Lluvia total acumulada (mm)
);

-- Índice para consultas por fecha
CREATE INDEX idx_weather_created_at ON weather(created_at DESC);

-- Habilitar Row Level Security (opcional)
ALTER TABLE weather ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (opcional)
CREATE POLICY "Allow public read access" ON weather
  FOR SELECT
  USING (true);

-- Política para permitir inserción con service role (opcional)
CREATE POLICY "Allow service role insert" ON weather
  FOR INSERT
  WITH CHECK (true);

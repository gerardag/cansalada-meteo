-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.weather (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  temperature numeric,
  humidity numeric,
  dew_point numeric,
  wind_speed numeric,
  wind_gust numeric,
  wind_gust_max numeric,
  solar_radiation numeric,
  uv_index integer,
  rain_event numeric,
  rain_rate numeric,
  rain_daily numeric,
  rain_weekly numeric,
  rain_monthly numeric,
  rain_total numeric,
  wind_direction numeric CHECK (wind_direction >= 0::numeric AND wind_direction <= 360::numeric),
  CONSTRAINT weather_pkey PRIMARY KEY (id)
);
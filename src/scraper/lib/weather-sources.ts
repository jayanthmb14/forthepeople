/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Weather sources → one reading shape (pure: parsing + range checks)
//
//  1. OpenWeather current weather (needs OPENWEATHER_API_KEY). Stored as
//     sent: metric, wind in m/s, rain = last hour. source "OpenWeatherMap".
//  2. Open-Meteo (open-meteo.com, no key, CC BY 4.0) — the fallback when
//     OpenWeather fails or has no key. Wind is requested in km/h (the
//     weather page reads non-OpenWeather wind as km/h), rain = the sum of
//     the last four 15-minute values (= last hour). The attribution Open-
//     Meteo asks for is in the source label below.
//
// Each reading keeps the time the SOURCE measured it (OpenWeather `dt`,
// Open-Meteo `current.time`), never "when we fetched it".
// ═══════════════════════════════════════════════════════════

export const OPENWEATHER_SOURCE = "OpenWeatherMap";
export const OPEN_METEO_SOURCE = "Open-Meteo.com (CC BY 4.0)";

export interface WeatherSample {
  temperature: number;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDir: string | null;
  conditions: string | null;
  rainfall: number | null;
  pressure: number | null;
  /** km */
  visibility: number | null;
  source: string;
  recordedAt: Date;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** 0–360° → "N", "NNE", … */
export function windDirection(deg: number | null): string | null {
  if (deg === null) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/** WMO weather code (Open-Meteo) → short English text the weather page understands. */
export function wmoDescription(code: number | null): string | null {
  if (code === null) return null;
  if (code === 0) return "clear sky";
  if (code === 1) return "mainly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code === 61) return "light rain";
  if (code === 63) return "moderate rain";
  if (code === 65) return "heavy rain";
  if (code === 66 || code === 67) return "freezing rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code === 85 || code === 86) return "snow showers";
  if (code === 95) return "thunderstorm";
  if (code === 96 || code === 99) return "thunderstorm with hail";
  return null;
}

/** OpenWeather `data/2.5/weather` JSON → reading, or null when a core field is missing. */
export function parseOpenWeather(json: unknown): WeatherSample | null {
  const j = json as {
    dt?: unknown;
    main?: { temp?: unknown; feels_like?: unknown; humidity?: unknown; pressure?: unknown };
    wind?: { speed?: unknown; deg?: unknown };
    weather?: Array<{ description?: unknown }>;
    visibility?: unknown;
    rain?: { "1h"?: unknown };
  } | null;
  const temperature = num(j?.main?.temp);
  const dt = num(j?.dt);
  if (temperature === null || dt === null) return null;
  const visibilityM = num(j?.visibility);
  const description = j?.weather?.[0]?.description;
  return {
    temperature,
    feelsLike: num(j?.main?.feels_like),
    humidity: num(j?.main?.humidity),
    windSpeed: num(j?.wind?.speed),
    windDir: windDirection(num(j?.wind?.deg)),
    conditions: typeof description === "string" && description.trim() ? description.trim() : null,
    rainfall: num(j?.rain?.["1h"]),
    pressure: num(j?.main?.pressure),
    visibility: visibilityM === null ? null : visibilityM / 1000,
    source: OPENWEATHER_SOURCE,
    recordedAt: new Date(dt * 1000),
  };
}

/** The Open-Meteo request for one point (see the file header for units). */
export function openMeteoUrl(lat: number, lng: number): string {
  const current = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "weather_code",
    "pressure_msl",
    "wind_speed_10m",
    "wind_direction_10m",
    "visibility",
  ].join(",");
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=${current}&minutely_15=precipitation&past_minutely_15=4&forecast_minutely_15=0` +
    `&wind_speed_unit=kmh&timezone=GMT&timeformat=unixtime`
  );
}

/** Open-Meteo forecast JSON (requested with openMeteoUrl) → reading, or null. */
export function parseOpenMeteo(json: unknown): WeatherSample | null {
  const j = json as {
    current?: Record<string, unknown>;
    minutely_15?: { precipitation?: unknown[] };
  } | null;
  const c = j?.current;
  const temperature = num(c?.temperature_2m);
  const time = num(c?.time);
  if (!c || temperature === null || time === null) return null;
  const rainParts = (j?.minutely_15?.precipitation ?? []).map(num);
  const rainfall =
    rainParts.length === 4 && rainParts.every((x) => x !== null)
      ? Math.round((rainParts as number[]).reduce((a, b) => a + b, 0) * 100) / 100
      : null;
  const visibilityM = num(c.visibility);
  return {
    temperature,
    feelsLike: num(c.apparent_temperature),
    humidity: num(c.relative_humidity_2m),
    windSpeed: num(c.wind_speed_10m),
    windDir: windDirection(num(c.wind_direction_10m)),
    conditions: wmoDescription(num(c.weather_code)),
    rainfall,
    pressure: num(c.pressure_msl),
    visibility: visibilityM === null ? null : Math.round(visibilityM / 100) / 10,
    source: OPEN_METEO_SOURCE,
    recordedAt: new Date(time * 1000),
  };
}

/** How old a reading may be before we refuse to store it as "current". */
export const MAX_WEATHER_AGE_MS = 6 * 3600_000;

/**
 * Range checks before a reading is stored. Returns the problems found
 * (empty = fine). Limits are generous for India: −10…55 °C, humidity
 * 0…100 %, sea-level pressure 870…1085 hPa, rain 0…500 mm in an hour.
 */
export function weatherProblems(s: WeatherSample, nowMs: number): string[] {
  const p: string[] = [];
  if (s.temperature < -10 || s.temperature > 55) p.push(`temperature ${s.temperature}°C out of range`);
  if (s.feelsLike !== null && (s.feelsLike < -25 || s.feelsLike > 70)) p.push(`feels-like ${s.feelsLike}°C out of range`);
  if (s.humidity !== null && (s.humidity < 0 || s.humidity > 100)) p.push(`humidity ${s.humidity}% out of range`);
  if (s.pressure !== null && (s.pressure < 870 || s.pressure > 1085)) p.push(`pressure ${s.pressure} hPa out of range`);
  if (s.windSpeed !== null && (s.windSpeed < 0 || s.windSpeed > 400)) p.push(`wind ${s.windSpeed} out of range`);
  if (s.rainfall !== null && (s.rainfall < 0 || s.rainfall > 500)) p.push(`rain ${s.rainfall} mm out of range`);
  const t = s.recordedAt.getTime();
  if (Number.isNaN(t)) p.push("reading has no valid time");
  else if (t > nowMs + 15 * 60_000) p.push("reading time is in the future");
  else if (nowMs - t > MAX_WEATHER_AGE_MS) p.push(`reading is ${Math.round((nowMs - t) / 3600_000)} h old`);
  return p;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Fetch one district's forecast (server only; read-only, no DB writes)
//
// Open-Meteo is always asked; OpenWeather only when OPENWEATHER_API_KEY is
// set. Both run in parallel with an 8 s timeout. Open-Meteo is the main
// source (7 days + a current value); OpenWeather is the second opinion, or
// the main source when Open-Meteo fails. Problems are kept as short
// reasons — never the request URL (the OpenWeather one carries the key).
// Nothing is invented when both fail: `primary` is null.
// ═══════════════════════════════════════════════════════════

import {
  FORECAST_CACHE_SECONDS,
  compareForecasts,
  openMeteoForecastUrl,
  openWeatherForecastUrl,
  parseOpenMeteoForecast,
  parseOpenWeatherForecast,
  type ForecastPayload,
  type SourceForecast,
} from "./forecast";

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT = "ForThePeople.in (https://forthepeople.in)";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Second cache layer when Redis is not configured (local dev).
    next: { revalidate: FORECAST_CACHE_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function reason(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError" || err.name === "AbortError") return "timed out";
    // Keep it short; a fetch error message can echo the URL, so cut at the first "http".
    return err.message.split("http")[0].trim().slice(0, 80) || "request failed";
  }
  return "request failed";
}

export async function fetchDistrictForecast(opts: { state: string; district: string; lat: number; lng: number }): Promise<ForecastPayload> {
  const { state, district, lat, lng } = opts;
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  const problems: string[] = [];

  const [om, owm] = await Promise.allSettled([
    getJson(openMeteoForecastUrl(lat, lng)),
    key ? getJson(openWeatherForecastUrl(lat, lng, key)) : Promise.resolve(null),
  ]);

  let openMeteo: SourceForecast | null = null;
  if (om.status === "fulfilled") {
    openMeteo = parseOpenMeteoForecast(om.value);
    if (!openMeteo) problems.push("Open-Meteo: reply had no usable forecast");
  } else {
    problems.push(`Open-Meteo: ${reason(om.reason)}`);
  }

  let openWeather: SourceForecast | null = null;
  if (!key) {
    problems.push("OpenWeather: no key configured (second source skipped)");
  } else if (owm.status === "fulfilled") {
    openWeather = parseOpenWeatherForecast(owm.value);
    if (!openWeather) problems.push("OpenWeather: reply had no usable forecast");
  } else {
    problems.push(`OpenWeather: ${reason(owm.reason)}`);
  }

  const primary = openMeteo ?? openWeather;
  const check = openMeteo && openWeather ? openWeather : null;
  return {
    state,
    district,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    primary,
    check,
    checks: compareForecasts(primary, check),
    problems,
  };
}

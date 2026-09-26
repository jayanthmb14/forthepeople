/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Weather — OpenWeatherMap API
// Schedule: every 30 min via /api/cron/scrape-weather (vercel.json).
//   (The old "every 5 minutes" ran on a Railway node-cron container that
//    expired in April 2026; Vercel Cron is the only scheduler now.)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { logUpdate } from "@/lib/update-log";

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

// Override map for districts where OWM city name differs from district name
const OWM_CITY_OVERRIDE: Record<string, string> = {
  "bengaluru-urban": "Bangalore",
  "mysuru":          "Mysore",
  "new-delhi":       "New Delhi",
  "central-delhi":   "New Delhi",
  "north-delhi":     "New Delhi",
  "north-west-delhi":"New Delhi",
  "north-east-delhi":"New Delhi",
  "east-delhi":      "New Delhi",
  "south-delhi":     "New Delhi",
  "south-west-delhi":"New Delhi",
  "south-east-delhi":"New Delhi",
  "west-delhi":      "New Delhi",
  "shahdara":        "New Delhi",
  "mumbai":          "Mumbai",
  "kolkata":         "Kolkata",
  "chennai":         "Chennai",
  "pune":            "Pune",
};

interface OWMResponse {
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number; deg: number };
  weather: Array<{ description: string }>;
  visibility: number;
  rain?: { "1h"?: number };
}

const WIND_DIR = (deg: number) => {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
};

export async function scrapeWeather(ctx: JobContext): Promise<ScraperResult> {
  if (!OWM_KEY) {
    ctx.log("OPENWEATHER_API_KEY not set — skipping");
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: "No API key" };
  }

  try {
    const city = OWM_CITY_OVERRIDE[ctx.districtSlug] ?? ctx.districtName ?? ctx.districtSlug;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${OWM_KEY}&units=metric`;
    // 8 s cap: OpenWeather normally answers in <1 s; a hung call must not
    // block the other districts in the same cron run.
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: OWMResponse = await res.json();

    const reading = await prisma.weatherReading.create({
      data: {
        districtId: ctx.districtId,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        windDir: WIND_DIR(data.wind.deg),
        conditions: data.weather[0]?.description ?? null,
        rainfall: data.rain?.["1h"] ?? null,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : null, // m→km
        source: "OpenWeatherMap",
        recordedAt: new Date(),
      },
    });

    // Keep only last 48 readings
    const old = await prisma.weatherReading.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { recordedAt: "desc" },
      skip: 48,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.weatherReading.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }

    const summary = `Weather updated: ${data.main.temp}°C, ${data.weather[0]?.description ?? "—"}`;
    ctx.log(summary);

    await logUpdate({
      source: "scraper",
      actorLabel: "cron",
      tableName: "WeatherReading",
      recordId: reading.id,
      action: "create",
      districtId: ctx.districtId,
      districtName: ctx.districtName,
      moduleName: "weather",
      description: summary,
      recordCount: 1,
    });

    return { success: true, recordsNew: 1, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

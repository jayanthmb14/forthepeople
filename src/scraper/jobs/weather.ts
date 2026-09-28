/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Weather — OpenWeather, with Open-Meteo as the fallback
// Schedule: every 30 min via /api/cron/scrape-weather (vercel.json).
//   (The old "every 5 minutes" ran on a Railway node-cron container that
//    expired in April 2026; Vercel Cron is the only scheduler now.)
//
// Sept 2026 (v5.2): OpenWeather is asked by the district HQ's lat/lon
// (src/lib/geo/district-centroids.ts, the point the forecast route and
// Open-Meteo use), not by town name — "q=Mandya,IN" gave a station whose
// reading differed from Open-Meteo's by ~4 °C.
//
// Sept 2026 (v5):
//  - Open-Meteo (no key) is tried when OpenWeather fails, has no key, or
//    sends a reading that fails the range checks. Both parsers and the
//    checks live in src/scraper/lib/weather-sources.ts.
//  - A reading is stored with the time the source measured it, and the
//    same reading is never stored twice.
//  - No UpdateLog row per reading any more (10,818 of ~13,100 UpdateLog
//    rows were weather readings). The cron route writes ONE summary row
//    per run instead.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { weatherCityName } from "../lib/district-aliases";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import {
  openMeteoUrl,
  openWeatherCurrentUrl,
  parseOpenMeteo,
  parseOpenWeather,
  weatherProblems,
  type WeatherSample,
} from "../lib/weather-sources";

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const FETCH_TIMEOUT_MS = 8_000; // both APIs answer in < 1 s normally

/** The district HQ point (same as the forecast route and Open-Meteo), or null. */
function pointOf(ctx: JobContext) {
  return DISTRICT_CENTROIDS[`${ctx.stateSlug}/${ctx.districtSlug}`] ?? null;
}

async function fromOpenWeather(ctx: JobContext): Promise<WeatherSample> {
  if (!OWM_KEY) throw new Error("OPENWEATHER_API_KEY not set");
  // By lat/lon of the district HQ, so the reading matches Open-Meteo and the
  // forecast; the town name only when the district has no point on file.
  const point = pointOf(ctx);
  const url = openWeatherCurrentUrl(point ?? { city: weatherCityName(ctx.districtSlug, ctx.districtName) }, OWM_KEY);
  if (!point) ctx.log(`OpenWeather: no coordinates for ${ctx.stateSlug}/${ctx.districtSlug}; asking by town name`);
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`OpenWeather HTTP ${res.status}`);
  const sample = parseOpenWeather(await res.json());
  if (!sample) throw new Error("OpenWeather reply had no temperature or time");
  return sample;
}

async function fromOpenMeteo(ctx: JobContext): Promise<WeatherSample> {
  const point = pointOf(ctx);
  if (!point) throw new Error(`no coordinates for ${ctx.stateSlug}/${ctx.districtSlug}`);
  const res = await fetch(openMeteoUrl(point.lat, point.lng), {
    headers: { "User-Agent": "ForThePeople.in (https://forthepeople.in)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const sample = parseOpenMeteo(await res.json());
  if (!sample) throw new Error("Open-Meteo reply had no temperature or time");
  return sample;
}

/** Result of one district's collection, with which source was used. */
export interface WeatherCollectResult extends ScraperResult {
  /** Source label of the stored (or already-stored) reading. */
  source?: string;
  /** True when the reading was already in the DB (nothing new measured). */
  duplicate?: boolean;
}

/**
 * Collect one district's current weather. Tries OpenWeather, then
 * Open-Meteo; stores the first reading that passes the range checks.
 */
export async function collectWeather(ctx: JobContext): Promise<WeatherCollectResult> {
  const problems: string[] = [];
  let sample: WeatherSample | null = null;

  for (const [label, get] of [
    ["OpenWeather", fromOpenWeather],
    ["Open-Meteo", fromOpenMeteo],
  ] as const) {
    try {
      const s = await get(ctx);
      const bad = weatherProblems(s, Date.now());
      if (bad.length > 0) {
        problems.push(`${label}: rejected (${bad.join(", ")})`);
        continue;
      }
      sample = s;
      break;
    } catch (err) {
      problems.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (problems.length > 0) ctx.log(problems.join(" | "));
  if (!sample) {
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: problems.join(" | ") || "no source answered" };
  }

  try {
    // Same source + same measurement time = the same reading; don't store twice.
    const existing = await prisma.weatherReading.findFirst({
      where: { districtId: ctx.districtId, source: sample.source, recordedAt: sample.recordedAt },
      select: { id: true },
    });
    if (existing) {
      ctx.log(`${sample.source}: reading of ${sample.recordedAt.toISOString()} already stored`);
      return { success: true, recordsNew: 0, recordsUpdated: 0, source: sample.source, duplicate: true };
    }

    await prisma.weatherReading.create({
      data: { districtId: ctx.districtId, ...sample },
    });

    // Keep only the last 48 readings per district.
    const old = await prisma.weatherReading.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { recordedAt: "desc" },
      skip: 48,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.weatherReading.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }

    ctx.log(`${sample.source}: ${sample.temperature}°C, ${sample.conditions ?? "—"} (measured ${sample.recordedAt.toISOString()})`);
    return { success: true, recordsNew: 1, recordsUpdated: 0, source: sample.source };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

/** ScraperJob signature for the admin "run now" button (/api/admin/run-scraper). */
export async function scrapeWeather(ctx: JobContext): Promise<ScraperResult> {
  const { success, recordsNew, recordsUpdated, error } = await collectWeather(ctx);
  return { success, recordsNew, recordsUpdated, error };
}

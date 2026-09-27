/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/forecast?state=karnataka&district=mandya
//   → ForecastPayload (src/lib/weather/forecast.ts)
//
// Read-only. Today, tomorrow and the next days for one district, from
// Open-Meteo (no key) with OpenWeather's forecast as a second opinion when
// OPENWEATHER_API_KEY is set. The point asked for is the district
// headquarters town (src/lib/geo/district-centroids.ts); districts without
// a verified point get 404, so the route never calls a source with a
// made-up location.
//
// Cache: Redis 1 h per district (5 min after a failure, so a dead source is
// not asked on every visit), CDN 30 min + 1 h stale-while-revalidate. The
// payload carries `fetchedAt` and each value's own time, so the page can
// say exactly how old it is.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cacheGet, cacheSet } from "@/lib/cache";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { fetchDistrictForecast } from "@/lib/weather/fetch-forecast";
import { FORECAST_CACHE_SECONDS, FORECAST_FAIL_CACHE_SECONDS, type ForecastPayload } from "@/lib/weather/forecast";

export const runtime = "nodejs";
export const maxDuration = 20;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CACHE_VERSION = "v1";

function cacheHeaders(resp: NextResponse, ok: boolean) {
  resp.headers.set(
    "Cache-Control",
    ok ? `public, s-maxage=${FORECAST_CACHE_SECONDS / 2}, stale-while-revalidate=${FORECAST_CACHE_SECONDS}` : `public, s-maxage=${FORECAST_FAIL_CACHE_SECONDS}`,
  );
  return resp;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const state = (sp.get("state") ?? "").toLowerCase();
  const district = (sp.get("district") ?? "").toLowerCase();

  if (!SLUG.test(state) || !SLUG.test(district) || state.length > 60 || district.length > 60) {
    return NextResponse.json({ error: "state and district params required" }, { status: 400 });
  }
  const point = DISTRICT_CENTROIDS[`${state}/${district}`];
  if (!point) {
    return NextResponse.json({ error: "no forecast point for this district" }, { status: 404 });
  }

  const key = `ftp:forecast:${CACHE_VERSION}:${state}/${district}`;
  const cached = await cacheGet<ForecastPayload>(key);
  if (cached) {
    return cacheHeaders(NextResponse.json({ ...cached, fromCache: true }), Boolean(cached.primary));
  }

  try {
    const payload = await fetchDistrictForecast({ state, district, lat: point.lat, lng: point.lng });
    const ok = Boolean(payload.primary);
    await cacheSet(key, payload, ok ? FORECAST_CACHE_SECONDS : FORECAST_FAIL_CACHE_SECONDS);
    // 200 even when no source answered: the page shows an honest empty
    // state from `primary: null` and `problems`.
    return cacheHeaders(NextResponse.json({ ...payload, fromCache: false }), ok);
  } catch (err) {
    Sentry.captureException(err);
    console.error("[API] forecast error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

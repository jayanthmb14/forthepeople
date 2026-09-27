/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Verifier: weather — the temperature we show vs a second source
//
// The weather page shows the newest WeatherReading (OpenWeather, or
// Open-Meteo when OpenWeather failed). We ask the OTHER service for the
// same district now and compare the temperatures: within ±3 °C and at
// most 90 minutes apart → both independent services agree → "verified".
// A stored reading older than 3 hours is not compared ("stored-too-old";
// the freshness check reports it as stale).
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { weatherCityName } from "@/scraper/lib/district-aliases";
import {
  OPEN_METEO_SOURCE,
  OPENWEATHER_SOURCE,
  openMeteoUrl,
  parseOpenMeteo,
  parseOpenWeather,
  weatherProblems,
  type WeatherSample,
} from "@/scraper/lib/weather-sources";
import { compareTemperature, decideStatus, fmtNumber, WEATHER_MAX_STORED_AGE_MIN, WEATHER_TOLERANCE_C } from "./compare";
import { DeadlineError, errText, fetchJson } from "./http";
import type { DistrictRef, SourceCheck, VerifierOutput, VerifyContext } from "./types";

async function openMeteoNow(d: DistrictRef, deadlineMs: number): Promise<WeatherSample> {
  const point = DISTRICT_CENTROIDS[`${d.stateSlug}/${d.slug}`];
  if (!point) throw new Error(`no coordinates for ${d.stateSlug}/${d.slug}`);
  const s = parseOpenMeteo(await fetchJson(openMeteoUrl(point.lat, point.lng), { deadlineMs, timeoutMs: 10_000 }));
  if (!s) throw new Error("Open-Meteo reply had no temperature");
  return s;
}

async function openWeatherNow(d: DistrictRef, deadlineMs: number): Promise<WeatherSample> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY not set");
  const city = weatherCityName(d.slug, d.name);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${key}&units=metric`;
  const s = parseOpenWeather(await fetchJson(url, { deadlineMs, timeoutMs: 10_000 }));
  if (!s) throw new Error("OpenWeather reply had no temperature");
  return s;
}

/** Display name of a stored source label. */
function shortSource(label: string): string {
  if (label === OPEN_METEO_SOURCE) return "Open-Meteo";
  return label;
}

export async function verifyWeather(ctx: VerifyContext): Promise<VerifierOutput> {
  const out: VerifierOutput = { records: [], reviews: [], errors: [] };
  for (const d of ctx.districts) {
    if (Date.now() > ctx.deadlineMs - 5_000) {
      out.errors.push("weather: time budget used up");
      break;
    }
    const key = `weather:${d.slug}`;
    const stored = await prisma.weatherReading.findFirst({
      where: { districtId: d.id },
      orderBy: { recordedAt: "desc" },
      select: { id: true, temperature: true, source: true, recordedAt: true },
    });
    const base = {
      datasetKey: key,
      dataset: "weather" as const,
      stateSlug: d.stateSlug,
      districtSlug: d.slug,
      entityType: "WeatherReading",
      tolerance: `±${WEATHER_TOLERANCE_C} °C`,
    };
    if (!stored || stored.temperature === null) {
      out.records.push({ ...base, kind: "cross-source", entityId: stored?.id ?? null, dataDate: stored?.recordedAt ?? null, primarySource: stored?.source ?? "—", primaryValue: null, sources: [], agreed: null, status: "unchecked", reason: "no-stored-data", notes: "No weather reading stored for this district." });
      continue;
    }
    const ageMin = (ctx.now.getTime() - stored.recordedAt.getTime()) / 60_000;
    const shown = `${fmtNumber(stored.temperature)} °C`;
    if (ageMin > WEATHER_MAX_STORED_AGE_MIN) {
      out.records.push({ ...base, kind: "cross-source", entityId: stored.id, dataDate: stored.recordedAt, primarySource: shortSource(stored.source), primaryValue: shown, sources: [], agreed: null, status: "unchecked", reason: "stored-too-old", notes: `The reading we show is ${Math.round(ageMin / 60)} h old; not compared.` });
      continue;
    }

    const useOpenWeather = stored.source === OPEN_METEO_SOURCE;
    const otherLabel = useOpenWeather ? OPENWEATHER_SOURCE : "Open-Meteo";
    let check: SourceCheck;
    let note: string;
    try {
      const other = useOpenWeather ? await openWeatherNow(d, ctx.deadlineMs) : await openMeteoNow(d, ctx.deadlineMs);
      const problems = weatherProblems(other, ctx.now.getTime());
      if (problems.length > 0) throw new Error(`reply rejected (${problems.join(", ")})`);
      const cmp = compareTemperature({ temperature: stored.temperature, recordedAt: stored.recordedAt }, other);
      check = {
        source: otherLabel,
        value: `${fmtNumber(other.temperature)} °C`,
        agreed: cmp.agreed,
        independent: true,
        url: useOpenWeather ? "https://openweathermap.org" : "https://open-meteo.com",
        asOf: other.recordedAt.toISOString(),
      };
      note = cmp.agreed === null
        ? `Readings ${Math.round(cmp.gapMinutes)} min apart; not compared.`
        : `${shown} vs ${check.value} (difference ${fmtNumber(cmp.diff)} °C, ${Math.round(cmp.gapMinutes)} min apart).`;
    } catch (err) {
      if (err instanceof DeadlineError) {
        out.errors.push("weather: time budget used up");
        break;
      }
      check = { source: otherLabel, value: null, agreed: null, independent: true, url: null, asOf: null };
      note = `${otherLabel}: ${errText(err)}`;
      out.errors.push(`weather/${d.slug}: ${errText(err)}`);
    }
    const noAnswer = check.value === null ? "second-source-failed" : "times-too-far-apart";
    const verdict = decideStatus([check], { primaryCounts: true, noAnswerReason: noAnswer });
    out.records.push({
      ...base,
      kind: "cross-source",
      entityId: stored.id,
      dataDate: stored.recordedAt,
      primarySource: shortSource(stored.source),
      primaryValue: shown,
      sources: [check],
      agreed: verdict.agreed,
      status: verdict.status,
      reason: verdict.reason,
      notes: note,
    });
  }
  ctx.log(`weather: ${out.records.length} checks (${out.records.filter((r) => r.status === "verified").length} verified, ${out.records.filter((r) => r.status === "disagreement").length} disagree)`);
  return out;
}

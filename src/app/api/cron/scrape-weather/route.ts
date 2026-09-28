/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Weather collector — every 30 minutes
// GET /api/cron/scrape-weather      schedule "*/30 * * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-weather"
//
// WHY (Sept 2026 audit, item 3.7): weather only ever ran inside a Railway
// node-cron container that expired in April, so the homepage was showing
// April temperatures as "Latest weather reading". This route is the first
// Vercel-scheduled weather job. It loops every active district and calls
// the existing scrapeWeather() job (which has an 8 s fetch timeout).
//
// Districts are processed in small parallel batches so 10-30 districts
// finish well inside maxDuration = 60 even if a few time out.
//
// Sept 2026 (v5): Open-Meteo is the fallback source (no key), so a missing
// OPENWEATHER_API_KEY no longer stops the run. The job no longer writes an
// UpdateLog row per reading; this route writes ONE summary row per run.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { collectWeather } from "@/scraper/jobs/weather";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import { jobContextFor, listActiveDistricts } from "@/scraper/lib/cron-districts";
import { withCronErrors } from "@/scraper/lib/cron-run";

export const runtime = "nodejs";
export const maxDuration = 60;
const CRON_NAME = "scrape-weather";

// How many districts to fetch at once. OpenWeather's free tier allows
// 60 calls/min, so 5 in flight is comfortably safe.
const BATCH_SIZE = 5;
// Stop starting new batches after this long (leaves ~15 s for the last batch).
const TIME_BUDGET_MS = 45_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  return withCronErrors(CRON_NAME, runStart, () => collectAll(runStart));
}

/** Everything after cronStarted(); a throw is recorded by withCronErrors. */
async function collectAll(runStart: number): Promise<Response> {
  const districts = await listActiveDistricts();

  const results: Array<{ district: string; success: boolean; stored: boolean; source?: string; error?: string }> = [];
  let partial = false;

  for (let i = 0; i < districts.length; i += BATCH_SIZE) {
    if (Date.now() - runStart > TIME_BUDGET_MS) {
      partial = true;
      console.warn(`[scrape-weather] time budget exhausted; ${districts.length - i} district(s) left`);
      break;
    }

    const batch = districts.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (d) => {
        const logs: string[] = [];
        const result = await collectWeather(jobContextFor(d, (msg) => logs.push(msg)));
        console.log(`[scrape-weather/${d.slug}] ${result.success ? "ok" : "fail"} | ${logs.join(" | ")}`);

        // Bust the district's cached weather so the page shows the new reading.
        if (result.recordsNew > 0 && redis) {
          await redis.del(cacheKey(d.slug, "weather")).catch(() => {});
        }
        return {
          district: d.slug,
          success: result.success,
          stored: result.recordsNew > 0,
          source: result.source,
          error: result.error,
        };
      }),
    );

    for (let j = 0; j < settled.length; j++) {
      const s = settled[j];
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        Sentry.captureException(s.reason);
        results.push({
          district: batch[j].slug,
          success: false,
          stored: false,
          error: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
      }
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const stored = results.filter((r) => r.stored).length;

  // ONE "What changed and when" row per run (it used to be one per reading).
  if (stored > 0) {
    const bySource = new Map<string, number>();
    for (const r of results) if (r.stored && r.source) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
    const sources = Array.from(bySource, ([name, n]) => `${name} ${n}`).join(", ");
    await logUpdate({
      source: "cron",
      actorLabel: "cron",
      tableName: "WeatherReading",
      recordId: `scrape-weather:${new Date(runStart).toISOString()}`,
      action: "create",
      moduleName: "weather",
      description: `Weather readings for ${stored} of ${districts.length} districts (${sources})`,
      recordCount: stored,
      details: { districts: results.filter((r) => r.stored).map((r) => r.district), bySource: Object.fromEntries(bySource) },
    });
  }
  const failures = results.filter((r) => !r.success).map((r) => ({ district: r.district, error: r.error }));
  const outcome = runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
  const allFailed = outcome === "error";
  await cronFinished(CRON_NAME, runStart, {
    status: outcome,
    count: stored,
    failures,
    attempted: results.length,
  });

  return NextResponse.json({
    ok: !allFailed,
    partial,
    districts: results.length,
    succeeded,
    stored,
    durationMs: Date.now() - runStart,
    results,
  });
}

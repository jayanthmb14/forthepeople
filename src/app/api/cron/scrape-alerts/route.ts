/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Official disaster alerts (NDMA SACHET) — every 30 minutes
// GET /api/cron/scrape-alerts       schedule "*/30 * * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-alerts" + one ScraperLog row ("alerts")
//
// WHY (Sept 2026 audit): no alerts collector had run since April, and
// the old one turned news headlines into "alerts". This reads NDMA's
// SACHET feed — the channel IMD, CWC and the State Disaster Management
// Authorities use for official warnings — maps each alert to our
// districts by name (state + district) or by the alert polygon, and
// expires alerts when their CAP expiry passes. See src/scraper/jobs/alerts.ts.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { listActiveDistricts } from "@/scraper/lib/cron-districts";
import { collectSachetAlerts, toAlertDistricts } from "@/scraper/jobs/alerts";

export const runtime = "nodejs";
export const maxDuration = 60;
const CRON_NAME = "scrape-alerts";
// Stop starting new CAP downloads after this long.
const TIME_BUDGET_MS = 40_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  const logs: string[] = [];

  try {
    const rows = await listActiveDistricts();
    const districts = toAlertDistricts(rows);

    const r = await collectSachetAlerts(districts, {
      deadlineMs: runStart + TIME_BUDGET_MS,
      log: (m) => logs.push(m),
    });
    console.log(`[scrape-alerts] ${logs.join(" | ")}`);

    // Fresh alerts must show at once: bust the alerts + overview caches.
    for (const slug of Object.keys(r.changedBy)) {
      if (redis) {
        await redis.del(cacheKey(slug, "alerts")).catch(() => {});
        await redis.del(cacheKey(slug, "overview")).catch(() => {});
      }
    }
    // "What changed and when": one row per district for NEW alerts only
    // (CWC re-issues a flood bulletin every few hours; updates are not news).
    for (const slug of Object.keys(r.createdBy)) {
      const d = districts.find((x) => x.slug === slug);
      await logUpdate({
        source: "cron",
        actorLabel: "cron",
        tableName: "LocalAlert",
        recordId: `scrape-alerts:${slug}:${new Date(runStart).toISOString()}`,
        action: "create",
        districtId: d?.id,
        moduleName: "alerts",
        description: `${r.createdBy[slug]} new official alert(s) from NDMA SACHET`,
        recordCount: r.createdBy[slug],
      });
    }

    const failedAll = r.capFetched === 0 && r.capFailed > 0;
    await cronFinished(CRON_NAME, runStart, {
      status: failedAll ? "error" : r.capFailed > 0 ? "partial" : "ok",
      count: r.recordsNew,
      updated: r.recordsUpdated + r.expired,
      error: r.capFailed > 0 ? `${r.capFailed} SACHET message(s) could not be fetched` : undefined,
    });

    return NextResponse.json({
      ok: !failedAll,
      itemsInFeed: r.itemsInFeed,
      capFetched: r.capFetched,
      capFailed: r.capFailed,
      created: r.recordsNew,
      updated: r.recordsUpdated,
      expired: r.expired,
      changedBy: r.changedBy,
      durationMs: Date.now() - runStart,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-alerts] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `SACHET: ${msg}` });
    return NextResponse.json({ ok: false, error: "SACHET feed could not be read" }, { status: 502 });
  }
}

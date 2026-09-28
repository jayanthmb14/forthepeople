/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Tap water at home (Jal Jeevan Mission) — daily
// GET /api/cron/scrape-jjm          schedule "15 4 * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-jjm" + one ScraperLog row ("jjm")
//
// WHY (Sept 2026 audit): the tap-water page showed a March seed with
// round numbers; the old job called a JJM API that returns 404. This
// reads the public JJM dashboard's district figures (rural homes with a
// tap / all rural homes), double-checked across two dashboard endpoints.
// See src/scraper/jobs/jjm-dashboard.ts. The dashboard updates daily.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { listActiveDistricts } from "@/scraper/lib/cron-districts";
import { runOutcome } from "@/scraper/lib/run-log";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { toCollectorDistricts } from "@/scraper/lib/source-districts";
import { collectJjmCoverage } from "@/scraper/jobs/jjm-dashboard";

export const runtime = "nodejs";
export const maxDuration = 120;
const CRON_NAME = "scrape-jjm";
const TIME_BUDGET_MS = 90_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await acquireCronLock(CRON_NAME, maxDuration + 30))) {
    return NextResponse.json({ ok: true, skipped: "another run is in progress" });
  }

  const runStart = await cronStarted(CRON_NAME);
  const logs: string[] = [];
  try {
    const rows = await listActiveDistricts();
    const districts = toCollectorDistricts(rows);
    const r = await collectJjmCoverage(districts, { deadlineMs: runStart + TIME_BUDGET_MS, log: (m) => logs.push(m) });
    console.log(`[scrape-jjm] ${logs.join(" | ")}`);

    for (const slug of r.changedSlugs) {
      const d = districts.find((x) => x.slug === slug);
      if (redis) {
        await redis.del(cacheKey(slug, "jjm")).catch(() => {});
        await redis.del(cacheKey(slug, "overview")).catch(() => {});
      }
      const f = r.figures[slug];
      await logUpdate({
        source: "cron",
        actorLabel: "cron",
        tableName: "JJMStatus",
        recordId: `scrape-jjm:${slug}:${new Date(runStart).toISOString().slice(0, 10)}`,
        action: "update",
        districtId: d?.id,
        moduleName: "jjm",
        description: f
          ? `Tap water: ${f.withTap} of ${f.households} rural homes (${f.pct}%) — Jal Jeevan Mission dashboard`
          : "Tap water figures updated from the Jal Jeevan Mission dashboard",
        recordCount: 1,
      });
    }
    // Unchanged rows still moved their "as of" date: bust those caches too.
    if (redis) {
      for (const slug of Object.keys(r.figures)) {
        if (!r.changedSlugs.includes(slug)) await redis.del(cacheKey(slug, "jjm")).catch(() => {});
      }
    }

    const outcome = runOutcome({ attempted: r.attempted, failed: r.failures.length, budgetExhausted: r.budgetExhausted });
    await cronFinished(CRON_NAME, runStart, {
      status: outcome,
      count: r.created,
      updated: r.changed + r.confirmed,
      failures: r.failures,
      attempted: r.attempted,
    });
    return NextResponse.json({
      ok: outcome !== "error",
      outcome,
      created: r.created,
      changed: r.changed,
      confirmed: r.confirmed,
      notCovered: r.notCovered,
      failures: r.failures,
      figures: r.figures,
      durationMs: Date.now() - runStart,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-jjm] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `JJM dashboard: ${msg}` });
    return NextResponse.json({ ok: false, error: "JJM dashboard could not be read" }, { status: 502 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

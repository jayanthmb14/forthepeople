/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Government contracts (tenders) — every 2 hours
// GET /api/cron/scrape-tenders      schedule "15 */2 * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-tenders" + one ScraperLog row ("tenders")
//
// WHY (Sept 2026 audit): no tender collector had ever run and the 12
// seeded tenders closed in May. This reads the active tenders of a few
// district bodies (city corporations, zilla parishad, city police / bus /
// power undertakings) on the Maharashtra, Tamil Nadu, West Bengal and
// Delhi GePNIC portals, one Tender per tender from its own page. The
// first runs fill in the backlog a fair share per body at a time; after
// that each run only reads new or changed tenders.
// See src/scraper/jobs/gepnic-tenders.ts and src/scraper/lib/gepnic.ts.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { listActiveDistricts } from "@/scraper/lib/cron-districts";
import { runOutcome } from "@/scraper/lib/run-log";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { toCollectorDistricts } from "@/scraper/lib/source-districts";
import { collectGepnicTenders } from "@/scraper/jobs/gepnic-tenders";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-tenders";
const TIME_BUDGET_MS = 240_000;

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
    const r = await collectGepnicTenders(districts, { deadlineMs: runStart + TIME_BUDGET_MS, log: (m) => logs.push(m) });
    console.log(`[scrape-tenders] ${logs.join(" | ")}`);

    // "What changed and when": one row per district per run with new tenders.
    for (const slug of r.changedSlugs) {
      const d = districts.find((x) => x.slug === slug);
      const s = r.perDistrict[slug];
      if (!s || s.created === 0) continue;
      await logUpdate({
        source: "cron",
        actorLabel: "cron",
        tableName: "Tender",
        recordId: `scrape-tenders:${slug}:${new Date(runStart).toISOString()}`,
        action: "create",
        districtId: d?.id,
        moduleName: "tenders",
        description: `${s.created} new tender(s) from the state e-procurement portal`,
        recordCount: s.created,
      });
    }

    // Budget running out is expected while the backlog fills in: that is
    // "partial" only through budgetExhausted, not a failure.
    const outcome = runOutcome({ attempted: r.attempted, failed: r.failures.length, budgetExhausted: r.budgetExhausted });
    await cronFinished(CRON_NAME, runStart, {
      status: outcome,
      count: r.created,
      updated: r.updated + r.closed,
      failures: r.failures,
      attempted: r.attempted,
      error: r.failures.length === 0 && r.pending > 0 ? `${r.pending} listed tender(s) left for the next run` : undefined,
    });
    return NextResponse.json({
      ok: outcome !== "error",
      outcome,
      created: r.created,
      updated: r.updated,
      skipped: r.skipped,
      closed: r.closed,
      pending: r.pending,
      notCovered: r.notCovered,
      failures: r.failures,
      perDistrict: r.perDistrict,
      durationMs: Date.now() - runStart,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-tenders] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `tender portals: ${msg}` });
    return NextResponse.json({ ok: false, error: "tender portals could not be read" }, { status: 502 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

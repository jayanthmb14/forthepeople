/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Rural jobs scheme (MGNREGA) "At a glance" — daily
// GET /api/cron/scrape-mgnrega      schedule "50 4 * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-mgnrega" + one ScraperLog row ("mgnrega")
//
// WHY (Sept 2026 audit): MGNREGA ran 156 times and wrote nothing (a
// made-up data.gov.in id), and the village-council page showed seeded
// round numbers. This reads each rural district's official "At a
// glance" page (job cards, persondays, households, wages, works, money,
// "As on" date) and stores it as a Redis snapshot
// ("ftp:data:mgnrega:<slug>") after the checks in src/scraper/lib/nrega.ts.
// The figures page is slow (≈20 s a district), hence maxDuration 300.
// See src/scraper/jobs/mgnrega-glance.ts.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { dropModuleCaches } from "@/lib/cache";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { toCollectorDistricts } from "@/scraper/lib/source-districts";
import { collectMgnregaGlance } from "@/scraper/jobs/mgnrega-glance";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-mgnrega";
const TIME_BUDGET_MS = 250_000;

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
    const rows = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
      orderBy: { name: "asc" },
    });
    const districts = toCollectorDistricts(rows);
    const r = await collectMgnregaGlance(districts, { deadlineMs: runStart + TIME_BUDGET_MS, log: (m) => logs.push(m) });
    console.log(`[scrape-mgnrega] ${logs.join(" | ")}`);

    for (const slug of r.changedSlugs) {
      const d = districts.find((x) => x.slug === slug);
      const s = r.summary[slug];
      await dropModuleCaches(slug, ["panchayats", "schemes"]);
      await logUpdate({
        source: "cron",
        actorLabel: "cron",
        tableName: "MGNREGA At a glance",
        recordId: `scrape-mgnrega:${slug}:${s?.asOf ?? "?"}`,
        action: "update",
        districtId: d?.id,
        moduleName: "gram-panchayat",
        description: s
          ? `MGNREGA as on ${s.asOf}: FY ${s.fy}, ${s.persondaysLakh ?? "?"} lakh persondays so far`
          : "MGNREGA figures updated",
        recordCount: 1,
      });
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
      summary: r.summary,
      durationMs: Date.now() - runStart,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-mgnrega] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `NREGA At a glance: ${msg}` });
    return NextResponse.json({ ok: false, error: "NREGA could not be read" }, { status: 502 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

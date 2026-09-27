/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Schools — UDISE+ district statistics — weekly
// GET /api/cron/scrape-schools      schedule "40 4 * * 2" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-schools" + one ScraperLog row ("schools")
//
// WHY (Sept 2026 audit): the schools page only had hand-entered rows;
// the old job asked data.gov.in for a resource that never answered.
// This stores each district's official UDISE+ totals (schools, teachers,
// students, facilities) as a Redis snapshot ("ftp:data:udise:<slug>",
// src/scraper/lib/district-snapshot.ts) after internal-consistency
// checks. UDISE+ publishes once a year; weekly is enough to pick up a
// new school year within days. See src/scraper/jobs/udise-schools.ts.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { logUpdate } from "@/lib/update-log";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { toCollectorDistricts } from "@/scraper/lib/source-districts";
import { collectUdiseSchools } from "@/scraper/jobs/udise-schools";

export const runtime = "nodejs";
export const maxDuration = 180;
const CRON_NAME = "scrape-schools";
const TIME_BUDGET_MS = 150_000;

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
    const r = await collectUdiseSchools(districts, { deadlineMs: runStart + TIME_BUDGET_MS, log: (m) => logs.push(m) });
    console.log(`[scrape-schools] ${logs.join(" | ")}`);

    for (const slug of r.changedSlugs) {
      const d = districts.find((x) => x.slug === slug);
      const s = r.summary[slug];
      if (redis) await redis.del(cacheKey(slug, "schools")).catch(() => {});
      await logUpdate({
        source: "cron",
        actorLabel: "cron",
        tableName: "Redis:ftp:data:udise",
        recordId: `scrape-schools:${slug}:${s?.year ?? "?"}`,
        action: "update",
        districtId: d?.id,
        moduleName: "schools",
        description: s
          ? `UDISE+ ${s.year}: ${s.schools} schools, ${s.teachers} teachers, ${s.students} students`
          : "School statistics updated from UDISE+",
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
    console.error(`[scrape-schools] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `UDISE+: ${msg}` });
    return NextResponse.json({ ok: false, error: "UDISE+ could not be read" }, { status: 502 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

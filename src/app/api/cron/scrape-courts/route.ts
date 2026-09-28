/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: court cases waiting (NJDG) — twice a day
// GET /api/cron/scrape-courts        schedule "40 1,13 * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-courts" + one ScraperLog row ("courts")
//
// WHY: the courts page showed hand-seeded figures (no source row, round
// numbers) and the old collector (jobs/courts.ts) called an NJDG API that
// has been gone since the v3 site. NJDG's public dashboards publish every
// district's figures daily without a captcha; src/scraper/jobs/courts-njdg.ts
// reads them (3 requests per NJDG unit, ≥ 3 s apart).
//
// A full pass is ~50 requests, close to the 300 s limit, so each run
// takes the districts read longest ago first and stops starting new ones
// at 250 s. Two runs a day refresh every district daily; NJDG itself
// updates once a day.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { dropModuleCaches } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import { hasNjdgSource } from "@/lib/courts/sources";
import { snapshotAges } from "@/lib/courts/store";
import { NjdgClient, scrapeCourtsNjdg } from "@/scraper/jobs/courts-njdg";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-courts";
/** Stop starting new work after this; one unit takes ≤ ~40 s even with a retry. */
const TIME_BUDGET_MS = 250_000;
const LOCK_KEY = "ftp:lock:scrape-courts";

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // One run at a time (a manual trigger during the scheduled run would
  // double the load on NJDG).
  if (redis) {
    try {
      const got = await redis.set(LOCK_KEY, String(Date.now()), { nx: true, ex: maxDuration + 20 });
      if (got !== "OK") return NextResponse.json({ ok: true, skipped: "already running" });
    } catch {
      // Redis down: run anyway; Vercel does not overlap scheduled runs.
    }
  }

  const runStart = await cronStarted(CRON_NAME);
  const deadline = runStart + TIME_BUDGET_MS;

  try {
    const active = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    });
    const covered = active.filter((d) => hasNjdgSource(d.slug));
    const notCovered = active.filter((d) => !hasNjdgSource(d.slug)).map((d) => d.slug);

    // Oldest (or never) read first, so a run that runs out of time still
    // moves every district forward over the day.
    const ages = await snapshotAges(covered.map((d) => d.slug));
    covered.sort((a, b) => (ages.get(a.slug) ?? 0) - (ages.get(b.slug) ?? 0));

    const client = new NjdgClient();
    const results: Array<{ district: string; success: boolean; newCount: number; updatedCount: number; error?: string }> = [];
    let partial = false;

    for (const d of covered) {
      if (Date.now() > deadline) {
        partial = true;
        console.warn(`[scrape-courts] time budget used; ${covered.length - results.length} district(s) left for the next run`);
        break;
      }
      const logs: string[] = [];
      const ctx: JobContext = {
        districtId: d.id,
        districtSlug: d.slug,
        districtName: d.name,
        stateSlug: d.state?.slug ?? "",
        stateName: d.state?.name ?? "",
        log: (msg) => logs.push(msg),
      };
      try {
        const r = await scrapeCourtsNjdg(ctx, { client, deadline });
        results.push({ district: d.slug, success: r.success, newCount: r.recordsNew, updatedCount: r.recordsUpdated, error: r.error });
        console.log(`[scrape-courts/${d.slug}] ${r.success ? "ok" : "fail"} | ${logs.join(" | ")}`);
        if (r.recordsNew + r.recordsUpdated > 0) await dropModuleCaches(d.slug, ["courts"]);
      } catch (err) {
        Sentry.captureException(err);
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ district: d.slug, success: false, newCount: 0, updatedCount: 0, error: msg });
        console.error(`[scrape-courts/${d.slug}] threw: ${msg}`);
      }
    }

    const failures = results.filter((r) => !r.success).map((r) => ({ district: r.district, error: r.error }));
    const outcome = runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
    await cronFinished(CRON_NAME, runStart, {
      status: outcome,
      count: results.reduce((s, r) => s + r.newCount, 0),
      updated: results.reduce((s, r) => s + r.updatedCount, 0),
      failures,
      attempted: results.length,
    });

    return NextResponse.json({
      ok: outcome !== "error",
      outcome,
      partial,
      requests: client.requests,
      notCovered,
      durationMs: Date.now() - runStart,
      results,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    if (redis) await redis.del(LOCK_KEY).catch(() => {});
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: daily data verification (double-check)
// GET /api/cron/verify-data      schedule "45 6 * * *" (vercel.json; 12:15 IST — after the
//                                 06:00 UTC dam reading and the 03:30 UTC crop run)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:verify-data" + one ScraperLog row ("verify-data")
// Lock: Redis "ftp:lock:verify-data" so two runs never overlap.
//
// Runs the verifiers in src/lib/verification/ (freshness, leaders,
// weather, dams, mandi) inside a 240 s budget, writes DataVerification
// rows, and queues anything that disagrees for an admin to review. It
// never changes the data it checks. docs/VERIFICATION.md explains it.
//
// Manual run (one verifier, some districts):
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     "https://forthepeople.in/api/cron/verify-data?only=leaders&district=mandya,pune"
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { cacheKey } from "@/lib/cache";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runVerification, VERIFIER_NAMES, type VerifierName } from "@/lib/verification/run";
import { verificationTableReady } from "@/lib/verification/store";
import { stateCacheKey, VERIFICATION_MODULE } from "@/lib/verification/cache-keys";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "verify-data";
const TIME_BUDGET_MS = 240_000;
const LOCK_KEY = "ftp:lock:verify-data";
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const only = (params.get("only") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is VerifierName => (VERIFIER_NAMES as string[]).includes(s));
  const districtSlugs = (params.get("district") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SLUG_RE.test(s));

  if (redis) {
    const got = await redis.set(LOCK_KEY, new Date().toISOString(), { nx: true, ex: 290 }).catch(() => "OK");
    if (got === null) {
      return NextResponse.json({ ok: false, skipped: "another verify-data run is in progress" }, { status: 409 });
    }
  }

  const runStart = await cronStarted(CRON_NAME);
  try {
    if (!(await verificationTableReady())) {
      const error = "DataVerification table missing — run `npm run db:push`";
      await cronFinished(CRON_NAME, runStart, { status: "skipped", error });
      return NextResponse.json({ ok: false, skipped: error });
    }

    const report = await runVerification({
      deadlineMs: runStart + TIME_BUDGET_MS,
      only: only.length ? only : undefined,
      districtSlugs: districtSlugs.length ? districtSlugs : undefined,
    });

    const status = report.written === 0 ? "error" : report.errors.length > 0 ? "partial" : "ok";
    await cronFinished(CRON_NAME, runStart, {
      status,
      count: report.written,
      updated: report.reviewsCreated,
      error: report.errors.length ? `${report.errors.length} problem(s): ${report.errors.slice(0, 6).join(" | ")}` : undefined,
    });

    // The public summaries must show today's checks.
    if (redis) {
      const districts = await prisma.district.findMany({ where: { active: true }, select: { slug: true, state: { select: { slug: true } } } });
      const keys = new Set<string>();
      for (const d of districts) {
        keys.add(cacheKey(d.slug, VERIFICATION_MODULE));
        keys.add(stateCacheKey(d.state.slug));
      }
      if (keys.size > 0) await redis.del(...keys).catch(() => {});
    }

    return NextResponse.json({ ok: status !== "error", durationMs: Date.now() - runStart, ...report });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg.slice(0, 500) });
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  } finally {
    if (redis) await redis.del(LOCK_KEY).catch(() => {});
  }
}

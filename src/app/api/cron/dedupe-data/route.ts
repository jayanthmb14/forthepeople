/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: daily duplicate guard
// GET /api/cron/dedupe-data        schedule "15 7 * * *" (12:45 IST — after the
//                                  morning collectors, update-exams at 06:30 UTC
//                                  and verify-data at 06:45 UTC)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:dedupe-data" + one ScraperLog row ("dedupe-data")
// Lock: Redis "lock:cron:dedupe-data" so two runs never overlap.
//
// Runs src/lib/dedupe/guard.ts over every citizen-facing table inside a
// 240 s budget:
//   - EXACT duplicates (same canonical key in the same place) are merged
//     automatically — best row kept, gaps filled, child rows moved, the
//     rest deleted or set active=false;
//   - GovernmentExam copies become one national / state / district row;
//     statuses and election types are rewritten in the canonical set;
//   - FUZZY candidates (≥ 85% alike, different keys) are never changed:
//     each pair is queued ONCE in NewsActionQueue, dataType
//     "verify-duplicates", for a person to decide.
// Exams from non-government organisers are reported, not deleted (the
// exams page already hides them).
//
// Manual runs:
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://forthepeople.in/api/cron/dedupe-data?dry=1"
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://forthepeople.in/api/cron/dedupe-data?only=InfraProject,Scheme"
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { runDuplicateGuard, TABLE_SPECS, type GuardReport } from "@/lib/dedupe/guard";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "dedupe-data";
const TIME_BUDGET_MS = 240_000;
const TABLES = new Set(["GovernmentExam", ...TABLE_SPECS.map((s) => s.table)]);

/** Page caches (ftp:<district>:<module>…) to drop after a table changed. */
const MODULE_OF: Record<string, string[]> = {
  GovernmentExam: ["exams", "exam-news", "overview"],
  ElectionResult: ["elections"],
  InfraProject: ["infrastructure", "overview"],
  Scheme: ["schemes"],
  GovOffice: ["offices"],
  PoliceStation: ["police"],
  School: ["schools"],
  LocalAlert: ["alerts", "overview"],
  CitizenTip: ["tips"],
  FamousPersonality: ["famous-personalities"],
  LocalIndustry: ["local-industries"],
  GramPanchayat: ["panchayats"],
  SugarFactory: ["factories"],
  HousingScheme: ["housing"],
  Leader: ["leaders", "overview"],
  CropPrice: ["crops"],
  DamReading: ["water"],
  RainfallHistory: ["rainfall"],
  CrimeStat: ["police"],
  CourtStat: ["courts"],
  BudgetEntry: ["budget"],
  BudgetAllocation: ["budget"],
  PopulationHistory: ["population"],
  NewsItem: ["news"],
};

function changedTables(r: GuardReport): string[] {
  const out = r.tables.filter((t) => t.resolved > 0 || t.normalised > 0 || t.keptRowsFilled > 0).map((t) => t.table);
  if (r.exams && (r.exams.rowsRemoved > 0 || r.exams.rowsMoved > 0 || r.exams.statusesNormalised > 0)) out.push("GovernmentExam");
  return out;
}

async function bustCaches(tables: string[]): Promise<number> {
  if (!redis || tables.length === 0) return 0;
  const modules = new Set(tables.flatMap((t) => MODULE_OF[t] ?? []));
  let deleted = 0;
  for (const m of modules) {
    let cursor: string | number = 0;
    do {
      const [next, keys] = (await redis.scan(cursor, { match: `ftp:*:${m}*`, count: 200 })) as unknown as [string | number, string[]];
      cursor = next;
      if (keys.length) deleted += await redis.del(...keys);
    } while (String(cursor) !== "0");
  }
  return deleted;
}

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const dryRun = params.get("dry") === "1" || params.get("dry") === "true";
  const only = (params.get("only") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => TABLES.has(s));

  if (!(await acquireCronLock(CRON_NAME, maxDuration + 30))) {
    return NextResponse.json({ ok: true, skipped: "another run is in progress" });
  }
  const runStart = await cronStarted(CRON_NAME);
  const logs: string[] = [];
  try {
    const report = await runDuplicateGuard(prisma, {
      dryRun,
      deadlineMs: runStart + TIME_BUDGET_MS,
      only: only.length ? only : undefined,
      log: (m) => logs.push(m),
    });
    console.log(`[cron/dedupe-data]${dryRun ? " (dry run)" : ""} ${logs.join(" | ") || "no duplicates"}`);

    const resolved = report.tables.reduce((n, t) => n + t.resolved, 0) + (report.exams?.rowsRemoved ?? 0);
    const normalised =
      report.tables.reduce((n, t) => n + t.normalised + t.keptRowsFilled, 0) +
      (report.exams ? report.exams.rowsMoved + report.exams.statusesNormalised : 0);
    const cachesDropped = dryRun ? 0 : await bustCaches(changedTables(report)).catch(() => 0);

    const status = report.errors.length > 0 || report.budgetExhausted ? (report.tables.length === 0 && !report.exams ? "error" : "partial") : "ok";
    await cronFinished(CRON_NAME, runStart, {
      status,
      count: dryRun ? 0 : resolved,
      updated: dryRun ? 0 : normalised + report.queued,
      error:
        [
          ...report.errors,
          report.budgetExhausted ? `time budget reached before: ${report.notReached.join(", ")}` : "",
          dryRun ? "dry run — nothing written" : "",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
    });

    return NextResponse.json({
      ok: status !== "error",
      dryRun,
      durationMs: Date.now() - runStart,
      resolved,
      normalised,
      queuedForReview: report.queued,
      alreadyInReview: report.queueSkippedExisting,
      cachesDropped,
      exams: report.exams,
      tables: report.tables.filter((t) => t.exactGroups || t.normalised || t.fuzzy),
      fuzzy: report.fuzzy.slice(0, 100),
      errors: report.errors,
      notReached: report.notReached,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg.slice(0, 500) });
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

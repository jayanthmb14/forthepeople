/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Daily exam status updater
// Schedule: 30 6 * * *  (06:30 UTC = 12:00 IST)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:update-exams"
//
// Passes:
//   0) Official sources (Sept 2026 v5): UPSC's active-exams pages and
//      SSC's live-exams feed create/update national exams with their
//      official dates, notice PDF and page link, and set lastVerifiedAt.
//      See src/scraper/jobs/exams.ts.
//   A) Auto-advance status based on calendar dates (no AI, just logic).
//      "Applications open" needs a published closing date.
//   B) Mark exams whose lastVerifiedAt is >30 days old as
//      needsVerification=true so the UI shows an "unverified" hint.
//   C) An exam that claims "open" without a published closing date is
//      set to "UNVERIFIED" (the old hard-coded list marked exams "open"
//      with no dates at all). The exams page should show UNVERIFIED as
//      "dates not confirmed — check the official site".
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { collectOfficialExams } from "@/scraper/jobs/exams";

export const runtime = "nodejs";
export const maxDuration = 120;
const CRON_NAME = "update-exams";

const STALE_DAYS = 30;
// Leave time for passes A–C after the official-source pass.
const OFFICIAL_PASS_BUDGET_MS = 70_000;
const OPEN_STATUSES = ["open", "APPLICATIONS_OPEN"];

// Status precedence so we never downgrade.
const RANK: Record<string, number> = {
  upcoming: 0,
  NOTIFICATION_OUT: 1,
  open: 3,
  APPLICATIONS_OPEN: 3,
  closed: 4,
  APPLICATIONS_CLOSED: 4,
  ADMIT_CARD_OUT: 5,
  EXAM_SCHEDULED: 5,
  RESULT_PENDING: 6,
  results: 7,
  RESULT_OUT: 7,
  COMPLETED: 8,
};

function rank(s: string | null | undefined): number {
  if (!s) return -1;
  return RANK[s] ?? -1;
}

function computeStatusFromDates(e: {
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  admitCardDate: Date | null;
  examDate: Date | null;
  resultDate: Date | null;
}): string | null {
  const now = Date.now();
  const appStart = e.startDate?.getTime() ?? null;
  const appEnd = e.endDate?.getTime() ?? null;
  const admit = e.admitCardDate?.getTime() ?? null;
  const exam = e.examDate?.getTime() ?? null;
  const result = e.resultDate?.getTime() ?? null;

  let next: string | null = null;

  if (result != null && result < now) next = "COMPLETED";
  else if (exam != null && exam < now) next = "RESULT_PENDING";
  else if (admit != null && admit <= now && (exam == null || exam >= now)) next = "ADMIT_CARD_OUT";
  else if (appEnd != null && appEnd < now && (exam == null || exam > now)) next = "APPLICATIONS_CLOSED";
  // Open only inside a window whose closing date was published.
  else if (appStart != null && appEnd != null && appStart <= now && appEnd >= now) next = "APPLICATIONS_OPEN";

  if (!next) return null;
  return rank(next) > rank(e.status) ? next : null; // never downgrade
}

export async function GET(req: Request) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = await cronStarted(CRON_NAME);
  let scanned = 0;
  let statusAdvanced = 0;
  let flaggedStale = 0;
  let unverified = 0;
  const logs: string[] = [];

  try {
    // Pass 0: official sources (a failing source is reported, not fatal)
    const official = await collectOfficialExams((m) => logs.push(m), {
      deadlineMs: startedAt + OFFICIAL_PASS_BUDGET_MS,
    });
    console.log(`[cron/update-exams] ${logs.join(" | ")}`);

    // Pass A: status-from-dates
    const exams = await prisma.governmentExam.findMany({
      where: { NOT: { status: { in: ["COMPLETED", "results"] } } },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        admitCardDate: true,
        examDate: true,
        resultDate: true,
      },
    });
    scanned = exams.length;

    for (const e of exams) {
      const nextStatus = computeStatusFromDates(e);
      if (nextStatus) {
        await prisma.governmentExam.update({
          where: { id: e.id },
          data: { status: nextStatus },
        });
        statusAdvanced++;
      }
    }

    // Pass B: stale verification flag
    const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000);
    const stale = await prisma.governmentExam.updateMany({
      where: {
        needsVerification: false,
        NOT: { status: { in: ["COMPLETED", "results"] } },
        OR: [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: cutoff } },
        ],
      },
      data: { needsVerification: true },
    });
    flaggedStale = stale.count;

    // Pass C: "open" without a published closing date is not a fact
    const unconfirmed = await prisma.governmentExam.updateMany({
      where: { status: { in: OPEN_STATUSES }, endDate: null },
      data: { status: "UNVERIFIED", needsVerification: true },
    });
    unverified = unconfirmed.count;

    const failedSources = official.sources.filter((s) => !s.ok);
    await cronFinished(CRON_NAME, startedAt, {
      // A failed official source still leaves passes A–C done → "partial".
      status: failedSources.length > 0 ? "partial" : "ok",
      count: official.recordsNew,
      updated: official.recordsUpdated + statusAdvanced + flaggedStale + unverified,
      error: official.error,
    });

    return NextResponse.json({
      ok: true,
      official: { created: official.recordsNew, updated: official.recordsUpdated, sources: official.sources },
      scanned,
      statusAdvanced,
      flaggedStale,
      unverified,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[cron/update-exams] error:", err);
    await cronFinished(CRON_NAME, startedAt, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

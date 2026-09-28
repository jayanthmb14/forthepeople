/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: News collector (every 4 hours, vercel.json)
// Also: auto-expires stale alerts (>14 days) + deduplicates news
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-news"
//
// Time budget (v5): no district starts after 240 s and no AI classification
// starts after it either, so the run always records its result before
// Vercel's 300 s kill. Districts whose news was fetched longest ago go
// first, and each district gets an equal share of the AI time (after that,
// keyword sorting only), so every district is reached on every run.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { dropModuleCaches } from "@/lib/cache";
import { scrapeNews } from "@/scraper/jobs/news";
import { alertCronFailed } from "@/lib/admin-alerts";
import { resetExtractionCounters } from "@/lib/news-action-engine";
import { translationTargets } from "@/lib/translation/content";
import { translatePendingContent } from "@/lib/translation/job";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { planTitleDuplicates } from "@/lib/news-dedupe";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-news";

const STALE_ALERT_DAYS = 14;
/** No new district, and no AI classification, starts after this. */
const BUDGET_MS = 240_000;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized invocations
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);

  // Reset module-scoped extraction counters so this cron starts fresh.
  // (news-action-engine caps expensive extractions like infrastructure at
  //  10 per cron run to bound AI spend.)
  resetExtractionCounters();

  const results: Array<{ district: string; success: boolean; newCount: number; dedupRemoved: number; alertsExpired: number; error?: string }> = [];
  let totalAlertsExpired = 0;
  const deadlineAt = runStart + BUDGET_MS;

  const districtRows = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  // Least-recently-fetched district first (never-fetched first of all).
  const lastFetch = new Map<string, number>();
  try {
    const rows = await prisma.newsItem.groupBy({
      by: ["districtId"],
      where: { districtId: { in: districtRows.map((d) => d.id) } },
      _max: { fetchedAt: true },
    });
    for (const r of rows) if (r.districtId && r._max.fetchedAt) lastFetch.set(r.districtId, r._max.fetchedAt.getTime());
  } catch { /* fall back to alphabetical */ }
  const activeDistrictRows = [...districtRows].sort(
    (a, b) => (lastFetch.get(a.id) ?? -Infinity) - (lastFetch.get(b.id) ?? -Infinity),
  );
  const notReached: string[] = [];

  for (const [i, row] of activeDistrictRows.entries()) {
    const slug = row.slug;
    if (Date.now() >= deadlineAt) {
      notReached.push(slug);
      continue;
    }
    // Fair share: this district may spend AI time only up to an equal slice
    // of what is left, so every district gets fresh news every run.
    const districtsLeft = activeDistrictRows.length - i;
    const aiDeadlineAt = Math.min(deadlineAt, Date.now() + (deadlineAt - Date.now()) / districtsLeft);
    const stateSlug = (row as { state?: { slug: string } }).state?.slug ?? "karnataka";
    const stateName = (row as { state?: { name: string } }).state?.name ?? "Karnataka";
    const districtId = row.id;

    const logs: string[] = [];
    const ctx: JobContext = {
      districtSlug: slug,
      districtId,
      districtName: row.name,
      stateSlug,
      stateName,
      log: (msg) => logs.push(msg),
    };

    // ── 1. Scrape news ──
    let result: { success: boolean; recordsNew: number; error?: string };
    try {
      result = await scrapeNews(ctx, { deadlineAt, aiDeadlineAt });
    } catch (scrapeErr) {
      Sentry.captureException(scrapeErr);
      const errMsg = scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr);
      alertCronFailed("scrape-news", errMsg).catch(() => {});
      results.push({ district: slug, success: false, newCount: 0, dedupRemoved: 0, alertsExpired: 0, error: errMsg });
      continue;
    }

    // ── 2. Deduplicate news by normalized title prefix ──
    // Same 50-character title prefix (punctuation ignored) in the last 30
    // days: the ORIGINAL (fetched first) stays — the later copies used to
    // win, leaving NewsItem.duplicateOf and stored translations pointing at
    // deleted rows. References move to the original before the copies go.
    let dedupRemoved = 0;
    try {
      const newsItems = await prisma.newsItem.findMany({
        where: { districtId, publishedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
        orderBy: { publishedAt: "desc" },
        select: { id: true, title: true, fetchedAt: true },
        take: 5000,
      });
      for (const { keepId, removeIds } of planTitleDuplicates(newsItems)) {
        await prisma.newsItem.updateMany({ where: { duplicateOf: { in: removeIds } }, data: { duplicateOf: keepId } });
        await prisma.newsItem.updateMany({ where: { id: keepId, duplicateOf: keepId }, data: { duplicateOf: null } });
        await prisma.contentTranslation.deleteMany({ where: { entityType: "news", entityId: { in: removeIds } } }).catch(() => {});
        const del = await prisma.newsItem.deleteMany({ where: { id: { in: removeIds } } });
        dedupRemoved += del.count;
      }
    } catch { /* non-fatal */ }

    // ── 3. Expire stale LocalAlerts (>14 days, still active) ──
    let alertsExpired = 0;
    try {
      const staleDate = new Date(Date.now() - STALE_ALERT_DAYS * 86_400_000);
      const exp = await prisma.localAlert.updateMany({
        where: {
          districtId: districtId,
          active: true,
          createdAt: { lt: staleDate },
        },
        data: { active: false },
      });
      alertsExpired = exp.count;
      totalAlertsExpired += alertsExpired;
    } catch { /* non-fatal */ }

    results.push({
      district: slug,
      success: result.success,
      newCount: result.recordsNew,
      dedupRemoved,
      alertsExpired,
      error: result.error,
    });

    // Invalidate news cache for this district
    if (result.success) await dropModuleCaches(slug, ["news", "overview"], { locales: translationTargets() });
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const totalDedup = results.reduce((s, r) => s + r.dedupRemoved, 0);

  // Record the run for /api/health. If EVERY district failed, that is an
  // error run (one flaky feed is not — the others still delivered).
  const failedDistricts = results.filter((r) => !r.success);
  const allFailed = results.length > 0 && failedDistricts.length === results.length;
  if (notReached.length > 0) {
    console.warn(`[scrape-news] time budget used; not reached this run: ${notReached.join(", ")}`);
  }
  await cronFinished(CRON_NAME, runStart, {
    status: allFailed ? "error" : "ok",
    count: totalNew,
    error: allFailed
      ? `all ${results.length} districts failed: ${failedDistricts[0]?.error ?? "unknown"}`
      : notReached.length > 0
        ? `time budget used; ${notReached.length} district(s) left for the next run: ${notReached.join(", ")}`
        : undefined,
  });

  // Translate the new articles once, now, into every switched-on language
  // (stored; visitors switching language never trigger a translation).
  // Whatever doesn't fit in the time left is picked up by translate-content.
  let translation: Awaited<ReturnType<typeof translatePendingContent>> | null = null;
  const timeLeft = 270_000 - (Date.now() - runStart);
  if (totalNew > 0 && timeLeft > 20_000) {
    translation = await translatePendingContent({ budgetMs: timeLeft - 10_000 }).catch((err) => {
      console.warn("[scrape-news] translation step failed:", err instanceof Error ? err.message : err);
      return null;
    });
  }

  return NextResponse.json({ ok: true, totalNew, totalDedup, totalAlertsExpired, notReached, results, translation });
}

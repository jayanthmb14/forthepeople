/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Daily news collector (06:00 UTC, vercel.json)
// Also: auto-expires stale alerts (>14 days) + deduplicates news
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-news"
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { scrapeNews } from "@/scraper/jobs/news";
import { alertCronFailed } from "@/lib/admin-alerts";
import { resetExtractionCounters } from "@/lib/news-action-engine";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-news";

const STALE_ALERT_DAYS = 14;

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

  const activeDistrictRows = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  for (const row of activeDistrictRows) {
    const slug = row.slug;
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
      result = await scrapeNews(ctx);
    } catch (scrapeErr) {
      Sentry.captureException(scrapeErr);
      const errMsg = scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr);
      alertCronFailed("scrape-news", errMsg).catch(() => {});
      results.push({ district: slug, success: false, newCount: 0, dedupRemoved: 0, alertsExpired: 0, error: errMsg });
      continue;
    }

    // ── 2. Deduplicate news by normalized title prefix ──
    let dedupRemoved = 0;
    try {
      const newsItems = await prisma.newsItem.findMany({
        where: { districtId },
        orderBy: { publishedAt: "desc" },
        select: { id: true, title: true },
      });

      const seen = new Map<string, string[]>();
      for (const item of newsItems) {
        const key = (item.title ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().substring(0, 50);
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(item.id);
      }

      const idsToDelete: string[] = [];
      for (const ids of seen.values()) {
        if (ids.length > 1) idsToDelete.push(...ids.slice(1));
      }

      if (idsToDelete.length > 0) {
        const del = await prisma.newsItem.deleteMany({ where: { id: { in: idsToDelete } } });
        dedupRemoved = del.count;
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
    if (result.success && redis) {
      await redis.del(cacheKey(slug, "news"));
      await redis.del(cacheKey(slug, "overview"));
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const totalDedup = results.reduce((s, r) => s + r.dedupRemoved, 0);

  // Record the run for /api/health. If EVERY district failed, that is an
  // error run (one flaky feed is not — the others still delivered).
  const failedDistricts = results.filter((r) => !r.success);
  const allFailed = results.length > 0 && failedDistricts.length === results.length;
  await cronFinished(CRON_NAME, runStart, {
    status: allFailed ? "error" : "ok",
    count: totalNew,
    error: allFailed ? `all ${results.length} districts failed: ${failedDistricts[0]?.error ?? "unknown"}` : undefined,
  });

  return NextResponse.json({ ok: true, totalNew, totalDedup, totalAlertsExpired, results });
}

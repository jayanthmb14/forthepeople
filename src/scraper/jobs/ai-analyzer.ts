/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — AI News Intelligence (cron: news-intelligence, every 4 h)
// Pipeline per district: fresh news → context → ONE AI call → insights
//
// v5 rework (Sept 2026 audit, backend-ai-news.md §5 items 3–4). Before, a
// run made 10 AI calls per district (one per module) in alphabetical order
// with no deadline, so it was killed at 300 s after 1–3 districts, and every
// AI error was logged as "no relevant news". Now:
//   - ONE call per district returns every module at once (10× fewer calls)
//   - a district is analysed only when it has news fetched after its last
//     successful analysis (most runs have nothing to do and finish fast)
//   - least-recently-attempted districts go first; no new district starts
//     after the time budget (default 240 s) is used up
//   - AI failures are logged as phase=llm status=error and counted, and the
//     cron is marked failed when every AI call failed
// Model routing: purpose "news-analysis" = free Tier 1 (src/lib/ai-models.ts).
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { NOT_FROM_NEWS_OPTIONAL, OFFICIAL_ALERTS, SHOWN_CROP_PRICE } from "@/lib/data-filters";
import { AIDeadlineError, callAIJSON } from "@/lib/ai-provider";
import {
  NEWS_INTEL_MODULES,
  buildNewsIntelPrompt,
  parseNewsIntelAnswer,
  planNewsIntelRun,
  type NewsIntelArticle,
  type NewsIntelInsight,
} from "@/lib/news-intel";

const DEFAULT_BUDGET_MS = 240_000;
/** Do not start a district with less time left than this. */
const MIN_DISTRICT_MS = 30_000;
/** Per-model timeout for the one-call-per-district prompt (longer answer). */
const CALL_TIMEOUT_MS = 45_000;
const NEWS_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ARTICLES = 15;

async function log(
  districtId: string,
  phase: string,
  status: "success" | "error" | "skipped",
  message?: string,
  extra?: {
    durationMs?: number;
    itemsProcessed?: number;
    tokensUsed?: number;
    aiProvider?: string;
    aiModel?: string;
    usedFallback?: boolean;
  },
) {
  await prisma.newsIntelligenceLog
    .create({ data: { districtId, phase, status, message: message?.slice(0, 500), ...extra } })
    .catch(() => {}); // non-fatal
}

// ── Context for the prompt ────────────────────────────────
async function fetchContextLines(districtId: string): Promise<string[]> {
  const [leaders, latestCrops, latestWeather, activeAlerts] = await Promise.all([
    // Curated leaders only: rows once written from headlines ("D K Shivakumar —
    // Chief Minister — BJP" under Mumbai) must not reach the prompt as fact.
    // This job writes AIInsight rows only; leader changes found in news go
    // to the admin queue (src/lib/news-action-rules.ts), never to Leader.
    prisma.leader.findMany({
      where: { districtId, tier: { lte: 2 }, active: true, ...NOT_FROM_NEWS_OPTIONAL },
      select: { name: true, role: true },
      take: 5,
    }),
    prisma.cropPrice.findMany({
      where: { districtId, ...SHOWN_CROP_PRICE },
      orderBy: { date: "desc" },
      take: 3,
      select: { commodity: true, modalPrice: true },
    }),
    prisma.weatherReading.findFirst({
      where: { districtId },
      orderBy: { recordedAt: "desc" },
      select: { temperature: true, conditions: true },
    }),
    prisma.localAlert.findMany({
      where: { districtId, active: true, ...OFFICIAL_ALERTS },
      take: 3,
      select: { title: true },
    }),
  ]);

  return [
    leaders.length > 0 ? `Key officials: ${leaders.map((l) => `${l.name} (${l.role})`).join(", ")}` : "",
    latestCrops.length > 0 ? `Crop prices: ${latestCrops.map((c) => `${c.commodity} ₹${c.modalPrice}/q`).join(", ")}` : "",
    latestWeather ? `Weather: ${latestWeather.conditions}, ${latestWeather.temperature}°C` : "",
    activeAlerts.length > 0 ? `Active alerts: ${activeAlerts.map((a) => a.title).join("; ")}` : "",
  ].filter(Boolean);
}

// ── Save one insight (replaces the previous one for the module) ──
async function saveInsight(
  districtId: string,
  insight: NewsIntelInsight,
  articles: NewsIntelArticle[],
  ai: { provider: string; model: string },
): Promise<boolean> {
  // Low-confidence answers are not shown to citizens.
  if (insight.confidence < 0.5) return false;

  const previous = await prisma.aIInsight.findMany({
    where: { districtId, module: insight.module },
    orderBy: { createdAt: "desc" },
    select: { id: true, approved: true },
    take: 50,
  });

  const cited = articles.filter((a) => insight.newsIds.includes(a.id));
  const created = await prisma.aIInsight.create({
    data: {
      districtId,
      module: insight.module,
      headline: insight.headline,
      summary: insight.summary,
      sentiment: insight.sentiment,
      confidence: insight.confidence,
      // Only the articles the insight is actually based on.
      sourceUrls: cited.map((a) => a.url).filter(Boolean),
      newsItemIds: insight.newsIds,
      aiProvider: ai.provider,
      aiModel: ai.model,
      approved: insight.confidence >= 0.8, // auto-approve high-confidence insights
    },
  });

  // Add to review queue if not auto-approved
  if (!created.approved) {
    await prisma.reviewQueue.create({
      data: { insightId: created.id, districtId, status: "pending" },
    });
  }

  // What the new insight replaces. An approved one replaces every earlier
  // insight; one waiting for review replaces only the earlier ones except
  // the latest approved, which stays on the page until an admin approves
  // the new one (/api/insights shows approved insights only — deleting it
  // left the module with no insight). Their review items and stored
  // translations go with them (ReviewQueue.insightId has no cascade: 404
  // of 406 pending review items pointed at deleted insights).
  const keepApproved = created.approved ? null : (previous.find((p) => p.approved)?.id ?? null);
  const replaced = previous.map((p) => p.id).filter((id) => id !== keepApproved);
  if (replaced.length > 0) {
    await prisma.reviewQueue.deleteMany({ where: { insightId: { in: replaced } } }).catch(() => {});
    await prisma.contentTranslation.deleteMany({ where: { entityType: "insight", entityId: { in: replaced } } }).catch(() => {});
    await prisma.aIInsight.deleteMany({ where: { id: { in: replaced } } }).catch(() => {});
  }
  return true;
}

// ── Main runner ───────────────────────────────────────────
export interface AnalyzerStats {
  districts: number;
  /** Districts with new news that needed analysis. */
  needingWork: number;
  processed: number;
  skippedNoNewNews: number;
  /** Districts that needed work but the time budget ran out first. */
  notReached: number;
  aiCalls: number;
  aiFailures: number;
  insightsSaved: number;
  stoppedEarly: boolean;
  /** First few AI error messages (for the cron record and admin email). */
  errors: string[];
  durationMs: number;
}

export async function runAIAnalyzer(opts: { budgetMs?: number } = {}): Promise<AnalyzerStats> {
  const start = Date.now();
  const deadline = start + (opts.budgetMs ?? DEFAULT_BUDGET_MS);
  const since = new Date(start - NEWS_WINDOW_MS);

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const [successRows, attemptRows, newsRows] = await Promise.all([
    prisma.newsIntelligenceLog.groupBy({
      by: ["districtId"],
      where: { phase: "llm", status: "success" },
      _max: { createdAt: true },
    }),
    prisma.newsIntelligenceLog.groupBy({
      by: ["districtId"],
      where: { phase: "llm", status: { in: ["success", "error"] } },
      _max: { createdAt: true },
    }),
    prisma.newsItem.groupBy({
      by: ["districtId"],
      where: { publishedAt: { gte: since }, duplicateOf: null, districtId: { not: null } },
      _max: { fetchedAt: true },
    }),
  ]);

  const toMap = (rows: Array<{ districtId: string | null; _max: Record<string, Date | null> }>, field: string) => {
    const m = new Map<string, Date>();
    for (const r of rows) {
      const d = r._max[field];
      if (r.districtId && d) m.set(r.districtId, d);
    }
    return m;
  };
  const plan = planNewsIntelRun(
    districts.map((d) => d.id),
    toMap(newsRows, "fetchedAt"),
    toMap(successRows, "createdAt"),
    toMap(attemptRows, "createdAt"),
  );

  const stats: AnalyzerStats = {
    districts: districts.length,
    needingWork: plan.order.length,
    processed: 0,
    skippedNoNewNews: plan.noNewNews.length,
    notReached: 0,
    aiCalls: 0,
    aiFailures: 0,
    insightsSaved: 0,
    stoppedEarly: false,
    errors: [],
    durationMs: 0,
  };
  console.log(
    `[AI Analyzer] ${plan.order.length} of ${districts.length} district(s) have new news; ` +
      `${plan.noNewNews.length} skipped (nothing new since their last analysis)`,
  );

  const byId = new Map(districts.map((d) => [d.id, d]));
  for (let idx = 0; idx < plan.order.length; idx++) {
    const district = byId.get(plan.order[idx]);
    if (!district) continue;

    if (deadline - Date.now() < MIN_DISTRICT_MS) {
      stats.stoppedEarly = true;
      stats.notReached = plan.order.length - idx;
      console.log(`[AI Analyzer] Time budget used; ${stats.notReached} district(s) left for the next run`);
      break;
    }

    const t0 = Date.now();
    const articles: NewsIntelArticle[] = await prisma.newsItem.findMany({
      where: { districtId: district.id, publishedAt: { gte: since }, duplicateOf: null },
      orderBy: { publishedAt: "desc" },
      take: MAX_ARTICLES,
      select: { id: true, title: true, summary: true, url: true },
    });
    if (articles.length === 0) continue;

    const contextLines = await fetchContextLines(district.id);
    const { systemPrompt, userPrompt } = buildNewsIntelPrompt({
      districtName: district.name,
      stateName: district.state?.name ?? "",
      modules: NEWS_INTEL_MODULES,
      articles,
      contextLines,
    });

    try {
      const { data, provider, model, usedFallback } = await callAIJSON({
        systemPrompt,
        userPrompt,
        purpose: "news-analysis",
        jsonShape: "object",
        maxTokens: 1800,
        temperature: 0.2,
        district: district.slug,
        timeoutMs: CALL_TIMEOUT_MS,
        deadlineAt: deadline,
      });
      stats.aiCalls++;

      const insights = parseNewsIntelAnswer(
        data,
        NEWS_INTEL_MODULES,
        articles.map((a) => a.id),
      );
      let saved = 0;
      for (const insight of insights) {
        try {
          if (await saveInsight(district.id, insight, articles, { provider, model })) saved++;
        } catch (err) {
          console.error(`[AI Analyzer] save failed for ${district.slug}/${insight.module}:`, err instanceof Error ? err.message : err);
        }
      }
      stats.insightsSaved += saved;
      stats.processed++;

      const modulesText = insights.length
        ? insights.map((i) => i.module).join(", ")
        : "no module had relevant news";
      await log(district.id, "llm", "success", `${articles.length} articles → ${insights.length} insight(s), ${saved} saved (${modulesText})`, {
        durationMs: Date.now() - t0,
        itemsProcessed: articles.length,
        aiProvider: provider,
        aiModel: model,
        usedFallback,
      });
    } catch (err) {
      if (err instanceof AIDeadlineError) {
        stats.stoppedEarly = true;
        stats.notReached = plan.order.length - idx;
        break;
      }
      stats.aiCalls++;
      stats.aiFailures++;
      const msg = err instanceof Error ? err.message : String(err);
      if (stats.errors.length < 3) stats.errors.push(`${district.slug}: ${msg.slice(0, 200)}`);
      console.error(`[AI Analyzer] AI call failed for ${district.slug}:`, msg);
      await log(district.id, "llm", "error", `AI call failed: ${msg}`, {
        durationMs: Date.now() - t0,
        itemsProcessed: articles.length,
      });
    }
  }

  stats.durationMs = Date.now() - start;
  console.log(
    `[AI Analyzer] Done in ${stats.durationMs}ms: ${stats.processed} processed, ${stats.insightsSaved} insight(s) saved, ` +
      `${stats.aiFailures}/${stats.aiCalls} AI call(s) failed, ${stats.notReached} not reached`,
  );
  return stats;
}

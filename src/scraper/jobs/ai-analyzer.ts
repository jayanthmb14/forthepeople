/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — AI News Intelligence System
// Uses Gemini 2.5 Flash to analyze news and generate insights
// Pipeline: Ingest → Context Fetch → LLM Evaluation → Decision Engine
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-provider";

// Modules that can have AI insights
const INSIGHT_MODULES = [
  "overview", "leadership", "finance", "water", "crops",
  "weather", "police", "elections", "health", "power",
];

async function log(
  districtId: string,
  phase: string,
  status: string,
  message?: string,
  extra?: { tokensUsed?: number; durationMs?: number; itemsProcessed?: number }
) {
  await prisma.newsIntelligenceLog.create({
    data: { districtId, phase, status, message: message?.slice(0, 500), ...extra },
  }).catch(() => {}); // non-fatal
}

// ── Phase 1: Ingest recent news ───────────────────────────
async function ingestNews(districtId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
  const news = await prisma.newsItem.findMany({
    where: { districtId, publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: { id: true, title: true, summary: true, url: true, source: true, publishedAt: true },
  });
  return news;
}

// ── Phase 2: Context fetch ────────────────────────────────
async function fetchContext(districtId: string) {
  const [district, leaders, latestCrops, latestWeather, activeAlerts] = await Promise.all([
    prisma.district.findUnique({
      where: { id: districtId },
      select: { name: true, nameLocal: true, population: true },
    }),
    prisma.leader.findMany({
      where: { districtId, tier: { lte: 2 } },
      select: { name: true, role: true, party: true },
      take: 5,
    }),
    prisma.cropPrice.findMany({
      where: { districtId },
      orderBy: { date: "desc" },
      take: 3,
      select: { commodity: true, modalPrice: true },
    }),
    prisma.weatherReading.findFirst({
      where: { districtId },
      orderBy: { recordedAt: "desc" },
      select: { temperature: true, conditions: true, rainfall: true },
    }),
    prisma.localAlert.findMany({
      where: { districtId, active: true },
      take: 3,
      select: { title: true, severity: true },
    }),
  ]);

  return { district, leaders, latestCrops, latestWeather, activeAlerts };
}

// ── Phase 3: LLM Evaluation ───────────────────────────────
interface NewsItem {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  source: string;
}

async function evaluateWithAI(
  news: NewsItem[],
  context: Awaited<ReturnType<typeof fetchContext>>,
  module: string
): Promise<{
  headline: string;
  summary: string;
  sentiment: string;
  confidence: number;
  relevantNewsIds: string[];
  aiProvider: string;
  aiModel: string;
  usedFallback: boolean;
} | null> {
  if (!news.length) return null;

  const districtName = context.district?.name ?? "the district";
  const newsText = news
    .slice(0, 10)
    .map((n, i) => `[${i + 1}] ${n.title}\n${n.summary ?? ""}`)
    .join("\n\n");

  const contextText = [
    context.leaders.length > 0 ? `Key officials: ${context.leaders.map((l) => `${l.name} (${l.role})`).join(", ")}` : "",
    context.latestCrops.length > 0 ? `Crop prices: ${context.latestCrops.map((c) => `${c.commodity} ₹${c.modalPrice}/q`).join(", ")}` : "",
    context.latestWeather ? `Weather: ${context.latestWeather.conditions}, ${context.latestWeather.temperature}°C` : "",
    context.activeAlerts.length > 0 ? `Active alerts: ${context.activeAlerts.map((a) => a.title).join("; ")}` : "",
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are an AI assistant summarizing government/civic news for ${districtName} district, India.`;
  const userPrompt = `Module focus: ${module}

Recent news articles (last 24 hours):
${newsText}

Current district context:
${contextText}

Return ONLY valid JSON:
{
  "headline": "Max 100 char headline summarizing key development",
  "summary": "2-3 sentences explaining the significance for citizens",
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "relevantNewsIndices": [1, 2, 3]
}

If no relevant news for this module, return: {"noRelevantNews": true}`;

  try {
    const response = await callAI({ systemPrompt, userPrompt, purpose: "news-analysis", jsonMode: true });
    const text = response.text.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.noRelevantNews) return null;

    const relevantNewsIds = (parsed.relevantNewsIndices ?? [])
      .map((idx: number) => news[idx - 1]?.id)
      .filter(Boolean);

    return {
      headline: String(parsed.headline ?? "").slice(0, 120),
      summary: String(parsed.summary ?? "").slice(0, 500),
      sentiment: ["positive", "negative", "neutral"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0.5))),
      relevantNewsIds,
      aiProvider: response.provider,
      aiModel: response.model,
      usedFallback: response.usedFallback,
    };
  } catch {
    return null;
  }
}

// ── Phase 4: Decision Engine ──────────────────────────────
async function saveInsight(
  districtId: string,
  module: string,
  insight: NonNullable<Awaited<ReturnType<typeof evaluateWithAI>>>,
  news: NewsItem[]
) {
  // Only save if confidence >= 0.5
  if (insight.confidence < 0.5) return;

  // Upsert insight (replace previous for same district+module)
  const existing = await prisma.aIInsight.findFirst({
    where: { districtId, module },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const created = await prisma.aIInsight.create({
    data: {
      districtId,
      module,
      headline: insight.headline,
      summary: insight.summary,
      sentiment: insight.sentiment,
      confidence: insight.confidence,
      sourceUrls: news.map((n) => n.url).filter(Boolean),
      newsItemIds: insight.relevantNewsIds,
      aiProvider: insight.aiProvider,
      aiModel: insight.aiModel,
      approved: insight.confidence >= 0.8, // auto-approve high-confidence insights
    },
  });

  // Add to review queue if not auto-approved
  if (!created.approved) {
    await prisma.reviewQueue.create({
      data: {
        insightId: created.id,
        districtId,
        status: "pending",
      },
    });
  }

  // Clean up old insight
  if (existing) {
    await prisma.aIInsight.delete({ where: { id: existing.id } }).catch(() => {});
  }
}

// ── Main runner ───────────────────────────────────────────
export async function runAIAnalyzer() {
  console.log("[AI Analyzer] Starting intelligence pipeline…");
  const start = Date.now();

  const activeDistricts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  for (const district of activeDistricts) {
    const districtSlug = district.slug;
    try {

      await log(district.id, "ingest", "started");

      // Phase 1: Ingest
      const news = await ingestNews(district.id);
      await log(district.id, "ingest", "success", `${news.length} articles`, { itemsProcessed: news.length });

      if (news.length === 0) {
        await log(district.id, "ingest", "skipped", "No recent news");
        continue;
      }

      // Phase 2: Context
      const context = await fetchContext(district.id);
      await log(district.id, "context", "success", "Context fetched");

      // Phase 3+4: LLM + Decision (per module)
      for (const moduleName of INSIGHT_MODULES) {
        const phaseStart = Date.now();
        try {
          const insight = await evaluateWithAI(news, context, moduleName);
          const durationMs = Date.now() - phaseStart;

          if (insight) {
            await saveInsight(district.id, moduleName, insight, news);
            await log(district.id, "llm", "success", `${moduleName}: ${insight.headline.slice(0, 50)}… [${insight.aiProvider}${insight.usedFallback ? " fallback" : ""}]`, { durationMs });
          } else {
            await log(district.id, "llm", "skipped", `${moduleName}: no relevant news`, { durationMs });
          }
        } catch (err) {
          await log(district.id, "llm", "error", `${moduleName}: ${String(err).slice(0, 200)}`, {
            durationMs: Date.now() - phaseStart,
          });
        }

        // Rate limiting: 1 req per second
        await new Promise((r) => setTimeout(r, 1000));
      }

      console.log(`[AI Analyzer] ${district.name} processed in ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`[AI Analyzer] Error for ${districtSlug}:`, err);
    }
  }

  console.log(`[AI Analyzer] Pipeline complete in ${Date.now() - start}ms`);
}

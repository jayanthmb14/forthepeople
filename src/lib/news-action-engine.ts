/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// News Action Engine — execute DB mutations from news classifications
// High confidence (>0.85): auto-execute | Mid (0.60-0.85): queue for review
// ═══════════════════════════════════════════════════════════
import { prisma } from "./db";
import { Prisma } from "@/generated/prisma";
import { callAIJSON } from "./ai-provider";
import { extractExamFromNews, syncExamFromNews } from "./exam-sync";
import { extractVerifyAndSyncInfra } from "./infra-sync";
import { logUpdate } from "./update-log";
import { decideNewsAction } from "./news-action-rules";

// ── Per-cron extraction cap ─────────────────────────────────
// Each news cron invocation calls resetExtractionCounters() once at start.
// Inside executeNewsAction, the infrastructure case bails out after 10 AI
// extractions so a burst of infra-tagged articles can't blow through the
// free-tier quota in a single run.
const EXTRACTION_CAPS = {
  infrastructure: 10,
} as const;
let infraExtractionsThisRun = 0;
export function resetExtractionCounters() {
  infraExtractionsThisRun = 0;
}

export interface NewsClassification {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  /** When the outlet published the article. Timeline dates, "announced"
   *  dates and the prompts' "Published:" line use it — never the sync time. */
  articlePublishedAt: Date;
  /** The outlet's name (publisher), when known. */
  articleSource?: string | null;
  districtId: string;
  targetModule: string;
  moduleAction: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  /**
   * The classifier's answer to "is this article about THIS district (or
   * state-/India-wide news that applies to its people)?". Anything other
   * than true means no action is taken (Sept 2026: "High Court of Karnataka"
   * stories were arriving in the Hyderabad feed).
   */
  isAboutDistrict?: boolean;
}

export interface ArticleClassification {
  targetModule: string;
  moduleAction: string;
  confidence: number;
  extractedData: Record<string, unknown>;
  isAboutDistrict: boolean;
  provider: string;
  model: string;
}

// ── Enhanced AI classification with data extraction ─────────
/**
 * Returns null when the AI could not classify (every model failed, or no
 * usable JSON). The failure is logged as an error — never silently.
 */
export async function classifyArticleWithAI(
  title: string,
  source: string,
  districtName: string,
  publishedAt?: Date,
  opts: { stateName?: string; summary?: string; deadlineAt?: number } = {},
): Promise<ArticleClassification | null> {
  const today = new Date().toISOString().split("T")[0];
  const articleDate = publishedAt ? publishedAt.toISOString().split("T")[0] : today;
  const ageDays = publishedAt
    ? Math.floor((Date.now() - publishedAt.getTime()) / 86400000)
    : 0;
  const place = opts.stateName ? `${districtName} district, ${opts.stateName}` : `${districtName} district`;
  const stateLabel = opts.stateName ?? "its state";

  const prompt = `Classify this news article for ${place} and extract structured data.

Article: "${title}"${opts.summary ? `\nSummary: ${opts.summary.slice(0, 300)}` : ""}
Source: ${source}
Article date: ${articleDate}
Today: ${today}

DISTRICT RULE: set "isAboutDistrict" to true ONLY if the article is about ${districtName} itself, or is ${stateLabel}-wide or India-wide news that directly applies to people living in ${districtName} (e.g. a statewide exam or scheme). Set it to false if it is about a different district, city or state (a court, region or company that merely shares a name does not count).

CRITICAL DATE RULE: This article is ${ageDays} day(s) old.
- If the article reports an event that ALREADY HAPPENED more than 2 days ago → set module to "news", confidence ≤ 0.4, NO alerts/actions.
- If the event is CURRENT or UPCOMING → classify normally and create appropriate actions.
- Never create alerts for past incidents (crimes, accidents, disasters from >2 days ago).

Classify into one of these modules:
leaders, infrastructure, budget, water, crops, weather, police, elections,
education, health, transport, schemes, housing, power, courts, industries,
jjm, gram-panchayat, alerts, sugar-factory, soil, population, news, exams, staffing

Return ONLY valid JSON (no markdown):
{
  "targetModule": "alerts",
  "moduleAction": "Security restrictions at Melkote event",
  "confidence": 0.92,
  "isAboutDistrict": true,
  "extractedData": {}
}

Module-specific extractedData fields:
- alerts: {"alertType":"security","alertTitle":"...","alertDescription":"...","location":"...","severity":"warning","startDate":"2026-03-28","endDate":"2026-03-29"}
- infrastructure: {"projectName":"...","budgetCrores":120,"status":"Announced","category":"Road","progressPct":0}
- police: {"crimeCategory":"theft","count":15,"description":"..."}
- schemes: {"schemeName":"PM Kisan","beneficiaryCount":5000}
- leaders: {"personName":"...","role":"District Collector","party":null,"tier":2}
- health: {"alertTitle":"...","description":"...","severity":"info"}
- water: {"damName":"KRS","storagePct":72,"waterLevel":110.5,"inflow":1200,"outflow":800}
- power: {"area":"Mandya city","type":"Scheduled","reason":"...","startTime":"2026-03-29T06:00","endTime":"2026-03-29T09:00"}
- elections: {"alertTitle":"...","description":"..."}
- exams: {"examTitle":"...","department":"...","vacancies":500,"status":"open","applyUrl":"https://..."}
- staffing: {"module":"health|police|schools","department":"Primary Health Centre","roleName":"Doctors","sanctionedPosts":10,"workingStrength":8,"vacantPosts":2}

Use "news" module if it doesn't clearly fit another. confidence = how certain you are (0-1).`;

  try {
    const { data: parsed, ...response } = await callAIJSON<{
      targetModule?: unknown;
      moduleAction?: unknown;
      confidence?: unknown;
      isAboutDistrict?: unknown;
      extractedData?: unknown;
    }>({
      systemPrompt: "You are a news classifier. Return ONLY valid JSON. No markdown, no explanation.",
      userPrompt: prompt,
      purpose: "news-analysis",
      jsonShape: "object",
      maxTokens: 1024,
      temperature: 0.1,
      timeoutMs: 25_000,
      deadlineAt: opts.deadlineAt,
    });
    const extracted = parsed.extractedData;
    return {
      targetModule: typeof parsed.targetModule === "string" && parsed.targetModule ? parsed.targetModule : "news",
      moduleAction: typeof parsed.moduleAction === "string" ? parsed.moduleAction : "",
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      extractedData: extracted && typeof extracted === "object" && !Array.isArray(extracted) ? (extracted as Record<string, unknown>) : {},
      // Only an explicit true counts; a missing answer is treated as "not about this district".
      isAboutDistrict: parsed.isAboutDistrict === true,
      provider: response.provider,
      model: response.model,
    };
  } catch (err) {
    console.error(
      `[NewsAction] AI classification failed for "${title.slice(0, 60)}":`,
      err instanceof Error ? err.message.slice(0, 300) : err,
    );
    return null;
  }
}

// ── Execute DB mutation based on module ──────────────────────
// What may happen is decided by decideNewsAction() (src/lib/news-action-rules.ts):
// skip / drop (generic "news", police items that are not crimes) / queue for
// admin review (every leaders, police, power and schemes item — news never
// writes Leader, CrimeStat, PowerOutage or Scheme rows — and anything below
// 0.85) / execute.
export async function executeNewsAction(
  classification: NewsClassification
): Promise<void> {
  const { districtId, targetModule, extractedData, articleTitle, articleUrl, confidence } = classification;
  const decision = decideNewsAction(classification);
  const article = {
    title: articleTitle,
    url: articleUrl,
    publishedAt: classification.articlePublishedAt,
    source: classification.articleSource ?? null,
  };

  if (decision.kind === "skip" || decision.kind === "drop") {
    console.log(`[NewsAction] ${decision.kind === "skip" ? "Skip" : "Drop"} (${decision.reason}): ${articleTitle.slice(0, 60)}`);
    return;
  }

  // Mid confidence, or a review-only module: queue for admin review
  if (decision.kind === "queue") {
    await prisma.newsActionQueue.create({
      data: {
        districtId,
        dataType: targetModule,
        extractedData: extractedData as unknown as Prisma.InputJsonValue,
        sourceUrl: articleUrl,
        headline: articleTitle,
        confidence,
        status: "pending",
      },
    });
    console.log(`[NewsAction] Queued review: ${targetModule} — ${articleTitle.slice(0, 60)}`);
    return;
  }

  // High confidence: auto-execute
  try {
    switch (targetModule) {
      case "alerts":
      case "health":
      case "elections": {
        // Sept 2026 audit: news never writes LocalAlert — a news story is not
        // an official warning. Every health or election story used to become
        // a "warning in force" (an advertorial for a scan centre, "Organ
        // donation saves lives", "SIR deadline extended", political
        // allegations, "Chief Minister Mamata Banerjee" months after she left
        // office, the same incident twice under two headlines), and the
        // overview counted them under "Warnings now". Official warnings come
        // only from NDMA SACHET (src/scraper/jobs/alerts.ts; the alerts API
        // shows OFFICIAL_ALERTS only). The story stays on the news page.
        console.log(`[NewsAction] News is not an official warning — no LocalAlert: ${articleTitle.slice(0, 60)}`);

        // For elections: surface ECI-schedule-style headlines into UpdateLog
        // so a human can confirm before we mutate ElectionEvent. We
        // intentionally do NOT auto-write polling/result dates from a
        // single article — wrong schedule data is worse than missing
        // schedule data when voting is days away.
        if (targetModule === "elections") {
          const looksScheduleAnnouncement = /\b(eci|election commission)\b.*\b(announce|schedule|notif)/i.test(articleTitle)
            || /\b(polling|voting)\s+(on|date|schedule)\b/i.test(articleTitle)
            || /\b(result|counting)\s+(on|date)\b/i.test(articleTitle);
          if (looksScheduleAnnouncement) {
            const dn = (await prisma.district.findUnique({ where: { id: districtId }, select: { name: true } }))?.name ?? "";
            await logUpdate({
              source: "scraper", actorLabel: "news-action-engine",
              tableName: "ElectionEvent", recordId: "pending-review",
              action: "update",
              districtId, districtName: dn, moduleName: "elections",
              description: `Election schedule headline flagged for review: ${articleTitle}`,
              recordCount: 1, details: { articleUrl, reason: "auto-update of polling/result dates is gated behind manual review" },
            });
          }
        }
        break;
      }

      case "infrastructure": {
        // News-driven infra sync: extract → verify → fuzzy upsert + timeline entry.
        // Non-fatal on failure — the NewsItem still persists via the outer pipeline.
        if (infraExtractionsThisRun >= EXTRACTION_CAPS.infrastructure) {
          console.log(
            `[NewsAction] infra: per-cron cap of ${EXTRACTION_CAPS.infrastructure} reached — skipping "${articleTitle.slice(0, 60)}"`
          );
          break;
        }
        infraExtractionsThisRun++;
        try {
          const result = await extractVerifyAndSyncInfra(article, districtId);
          if (!result) {
            console.log(`[NewsAction] infra: skipped (no projectName / low confidence / verify fail): ${articleTitle.slice(0, 60)}`);
          } else {
            console.log(
              `[NewsAction] ✅ Infra sync: created ${result.created}, updated ${result.updatedProjects}, ` +
              `timeline +${result.timelineCreated}, deduped ${result.duplicatesSkipped} across ${result.projectsTouched} districts`
            );
          }
        } catch (err) {
          console.error(
            "[NewsAction] infra sync failed:",
            err instanceof Error ? err.message : err
          );
        }
        break;
      }

      // "leaders", "police", "power" and "schemes" never reach this switch:
      // they are review-only (decideNewsAction queues them), so no news
      // article can write a Leader, CrimeStat, PowerOutage or Scheme row.
      // (Sept 2026 audit: a headline's beneficiary figure — matched to a
      // scheme by "name contains its first 3 words", often a national
      // number — replaced the district's count and its source.)

      case "exams": {
        // News-driven exam sync — extract structured metadata then upsert.
        // Failure is non-fatal: the NewsItem still persists via the outer pipeline.
        try {
          const extraction = await extractExamFromNews(article);
          if (!extraction) {
            console.log(`[NewsAction] exams: extraction returned null for "${articleTitle.slice(0, 60)}"`);
            break;
          }
          const result = await syncExamFromNews(extraction, article, districtId);
          console.log(
            `[NewsAction] ✅ Exam sync: ${extraction.shortName} → ` +
            `created ${result.created}, updated ${result.updated}, skipped ${result.skipped} ` +
            `across ${result.affectedDistricts} districts (scope=${extraction.scope})`
          );
        } catch (err) {
          console.error(
            "[NewsAction] exam sync failed:",
            err instanceof Error ? err.message : err
          );
        }
        break;
      }

      case "staffing": {
        // Sept 2026 audit: numbers in news stories are not a district's
        // sanctioned strength (Kolkata got 2,73,000 all-India CAPF posts,
        // Hyderabad "0 of 19,000 police working"). Staffing is written only
        // from a department's own figures now, never from a headline.
        console.log(`[NewsAction] staffing from news is not written (not official district figures): "${articleTitle.slice(0, 60)}"`);
        break;
      }

      default:
        console.log(`[NewsAction] No handler for ${targetModule}, skipping`);
    }
  } catch (err) {
    console.error(`[NewsAction] Error executing ${targetModule}:`, err);
  }
}

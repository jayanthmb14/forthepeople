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
import { PARTY_COLORS } from "./constants/party-colors";

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

// Modules where a news article must NEVER write straight to the page.
// The Sept 2026 audit found the auto-applied rows were wrong: "Prime
// Minister of India" stored as a leader's name, any number in a headline
// stored as an NCRB crime count, "Factories go fully solar" stored as a
// power outage. These always go to the admin review queue now.
const REVIEW_ONLY_MODULES = new Set(["police", "leaders", "power"]);

// ── Execute DB mutation based on module ──────────────────────
export async function executeNewsAction(
  classification: NewsClassification
): Promise<void> {
  const { districtId, targetModule, extractedData, articleTitle, articleUrl, confidence } = classification;

  // Not about this district (or the classifier did not say): never act on it.
  if (classification.isAboutDistrict !== true) {
    console.log(`[NewsAction] Skip (not about this district): ${articleTitle.slice(0, 60)}`);
    return;
  }

  // Below threshold: skip
  if (confidence < 0.60) {
    console.log(`[NewsAction] Skip (low confidence ${confidence.toFixed(2)}): ${articleTitle.slice(0, 60)}`);
    return;
  }

  // Mid confidence, or a review-only module: queue for admin review
  if (confidence < 0.85 || REVIEW_ONLY_MODULES.has(targetModule)) {
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
        const data = extractedData as Record<string, string>;
        const alertType = targetModule === "health" ? "health_advisory"
          : targetModule === "elections" ? "election"
          : (data.alertType ?? "general");
        const alertTitle = data.alertTitle ?? articleTitle;

        // Dedup check: is there already an active alert with the same title
        // in this district? Same incident often gets reported by multiple
        // outlets — don't create one LocalAlert per outlet.
        const existingAlert = await prisma.localAlert.findFirst({
          where: {
            districtId,
            title: { equals: alertTitle, mode: "insensitive" },
            active: true,
          },
        });
        if (existingAlert) {
          await prisma.localAlert.update({
            where: { id: existingAlert.id },
            data: { sourceUrl: articleUrl, updatedAt: new Date() },
          });
          console.log(`[NewsAction] ⏭️  Skipped duplicate LocalAlert (refreshed source): "${alertTitle.slice(0, 60)}"`);
          break;
        }

        await prisma.localAlert.create({
          data: {
            districtId,
            type: alertType,
            title: alertTitle,
            description: data.alertDescription ?? data.description ?? `Based on news: ${articleTitle}`,
            location: data.location ?? null,
            severity: (data.severity ?? "info") as string,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            active: true,
            sourceUrl: articleUrl,
            autoGenerated: true,
          },
        });
        console.log(`[NewsAction] ✅ Created LocalAlert: ${alertType} for ${targetModule}`);

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
          const result = await extractVerifyAndSyncInfra(
            { title: articleTitle, url: articleUrl, publishedAt: new Date() },
            districtId
          );
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

      case "police": {
        const data = extractedData as Record<string, unknown>;
        if (data.crimeCategory && data.count) {
          const year = new Date().getFullYear();
          const existing = await prisma.crimeStat.findFirst({
            where: { districtId, year, category: data.crimeCategory as string },
          });
          if (existing) {
            await prisma.crimeStat.update({
              where: { id: existing.id },
              data: { count: data.count as number, source: articleUrl },
            });
          } else {
            await prisma.crimeStat.create({
              data: {
                districtId,
                year,
                category: data.crimeCategory as string,
                count: data.count as number,
                source: articleUrl,
              },
            });
          }
          console.log(`[NewsAction] ✅ Updated CrimeStat: ${data.crimeCategory}`);
        }
        break;
      }

      case "schemes": {
        const data = extractedData as Record<string, unknown>;
        if (data.schemeName) {
          const namePrefix = (data.schemeName as string).split(" ").slice(0, 3).join(" ");
          const scheme = await prisma.scheme.findFirst({
            where: {
              districtId,
              name: { contains: namePrefix, mode: "insensitive" },
            },
          });
          if (scheme && data.beneficiaryCount) {
            await prisma.scheme.update({
              where: { id: scheme.id },
              data: {
                beneficiaryCount: data.beneficiaryCount as number,
                source: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Updated Scheme: ${scheme.name}`);
          }
        }
        break;
      }

      case "leaders": {
        const data = extractedData as Record<string, unknown>;
        if (data.personName && data.role) {
          const name = (data.personName as string).trim();
          const role = (data.role as string).trim();
          const tier = (data.tier as number) ?? 3;
          const party = (data.party as string) ?? null;
          const districtName = (await prisma.district.findUnique({ where: { id: districtId }, select: { name: true } }))?.name ?? "";
          if (party && !PARTY_COLORS[party] && !Object.keys(PARTY_COLORS).some((k) => k.toUpperCase() === party.toUpperCase())) {
            console.warn(`[leadership] Unknown party detected: '${party}'. Using default colors. Add to party-colors.ts for branded colors.`);
          }

          // Skip if the name is clearly just a title/role echoed as a name
          // (e.g. AI extracts personName="Prime Minister", role="Prime Minister").
          const nameWords = name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
          const roleWords = role.toLowerCase().replace(/[^a-z\s]/g, "").trim();
          if (nameWords === roleWords || nameWords.length < 3) {
            console.log(`[NewsAction] ⏭️  Skipped: name "${name}" looks like a role echo, not a person name`);
            break;
          }

          // Skip duplicates: check if this person already exists for this district.
          // 1. Exact name+role match (case-insensitive)
          // 2. Same name at same tier (catches "Prime Minister" vs "Prime Minister of India")
          // 3. Name contained in existing name or vice versa (catches "Modi" vs "Narendra Modi")
          const existingByNameRole = await prisma.leader.findFirst({
            where: {
              districtId,
              name: { equals: name, mode: "insensitive" },
              role: { equals: role, mode: "insensitive" },
            },
          });
          if (existingByNameRole) {
            await prisma.leader.update({
              where: { id: existingByNameRole.id },
              data: { lastVerifiedAt: new Date(), active: true },
            });
            console.log(`[NewsAction] ⏭️  Skipped duplicate Leader (exact match, refreshed): ${name} as ${role}`);
            break;
          }

          // Fuzzy match: same person name already exists at this tier in this district?
          // This catches "Narendra Modi / Prime Minister / BJP" vs
          // "Narendra Modi / Prime Minister of India / Bharatiya Janata Party"
          const existingByName = await prisma.leader.findFirst({
            where: {
              districtId,
              name: { equals: name, mode: "insensitive" },
              tier,
              active: true,
            },
          });
          if (existingByName) {
            // Same person, different role text — update the existing record's
            // verification date but don't create a new entry.
            await prisma.leader.update({
              where: { id: existingByName.id },
              data: { lastVerifiedAt: new Date() },
            });
            console.log(`[NewsAction] ⏭️  Skipped duplicate Leader (same name+tier, role variant "${role}" vs "${existingByName.role}"): ${name}`);
            break;
          }

          // For unique-officeholder roles (CM, Governor, Collector,
          // Commissioner, Mayor, etc.), mark the previous holder of the
          // SAME role inactive — never delete, so we preserve history.
          const UNIQUE_ROLE_RE = /^(chief minister|governor|lieutenant governor|deputy chief minister|chief secretary|district collector|deputy commissioner|district magistrate|mayor|commissioner of police|managing director|chairman|vice chairman|chief justice|principal sessions judge)/i;
          let supersededName: string | null = null;
          if (UNIQUE_ROLE_RE.test(role)) {
            const supersedeWhere = {
              districtId,
              role: { equals: role, mode: "insensitive" as const },
              active: true,
              NOT: { name: { equals: name, mode: "insensitive" as const } },
            };
            const superseded = await prisma.leader.findMany({ where: supersedeWhere, select: { id: true, name: true } });
            if (superseded.length > 0) {
              await prisma.leader.updateMany({ where: { id: { in: superseded.map((s) => s.id) } }, data: { active: false } });
              supersededName = superseded.map((s) => s.name).join(", ");
              console.log(`[NewsAction] 📜 Marked ${superseded.length} previous "${role}" holder(s) inactive: ${supersededName}`);
              for (const s of superseded) {
                await logUpdate({
                  source: "scraper", actorLabel: "news-action-engine",
                  tableName: "Leader", recordId: s.id, action: "update",
                  districtId, districtName, moduleName: "leadership",
                  description: `Leader marked inactive: ${s.name} (${role}) — replaced by ${name} per news report.`,
                  recordCount: 1, details: { reason: "superseded", newHolder: name, articleUrl },
                });
              }
            }
          }

          const created = await prisma.leader.create({
            data: {
              districtId, name, role, tier, party,
              since: new Date().getFullYear().toString(),
              source: articleUrl,
              lastVerifiedAt: new Date(),
              active: true,
            },
          });
          console.log(`[NewsAction] ✅ Added Leader: ${name} as ${role}`);
          await logUpdate({
            source: "scraper", actorLabel: "news-action-engine",
            tableName: "Leader", recordId: created.id, action: "create",
            districtId, districtName, moduleName: "leadership",
            description: supersededName
              ? `New ${role}: ${name}${party ? ` (${party})` : ""} replacing ${supersededName}.`
              : `New leader appointed: ${name}${party ? ` (${party})` : ""} as ${role}.`,
            recordCount: 1, details: { tier, articleUrl },
          });
        }
        break;
      }

      case "power": {
        const data = extractedData as Record<string, unknown>;
        if (data.area) {
          await prisma.powerOutage.create({
            data: {
              districtId,
              area: data.area as string,
              type: (data.type as string) ?? "Unscheduled",
              reason: (data.reason as string) ?? articleTitle,
              startTime: data.startTime ? new Date(data.startTime as string) : new Date(),
              endTime: data.endTime ? new Date(data.endTime as string) : null,
              source: articleUrl,
              active: true,
            },
          });
          console.log(`[NewsAction] ✅ Created PowerOutage: ${data.area}`);
        }
        break;
      }

      case "exams": {
        // News-driven exam sync — extract structured metadata then upsert.
        // Failure is non-fatal: the NewsItem still persists via the outer pipeline.
        try {
          const extraction = await extractExamFromNews({
            title: articleTitle,
            url: articleUrl,
            publishedAt: new Date(),
          });
          if (!extraction) {
            console.log(`[NewsAction] exams: extraction returned null for "${articleTitle.slice(0, 60)}"`);
            break;
          }
          const result = await syncExamFromNews(
            extraction,
            { title: articleTitle, url: articleUrl, publishedAt: new Date() },
            districtId
          );
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
        const data = extractedData as Record<string, unknown>;
        if (
          data.module &&
          data.department &&
          data.roleName &&
          typeof data.sanctionedPosts === "number" &&
          typeof data.workingStrength === "number"
        ) {
          const vacantPosts = Math.max(0, (data.sanctionedPosts as number) - (data.workingStrength as number));
          const existing = await prisma.departmentStaffing.findFirst({
            where: {
              districtId,
              module: data.module as string,
              department: data.department as string,
              roleName: data.roleName as string,
            },
          });
          if (existing) {
            await prisma.departmentStaffing.update({
              where: { id: existing.id },
              data: {
                sanctionedPosts: data.sanctionedPosts as number,
                workingStrength: data.workingStrength as number,
                vacantPosts,
                asOfDate: new Date(),
                sourceUrl: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Updated DepartmentStaffing: ${data.module}/${data.roleName}`);
          } else {
            await prisma.departmentStaffing.create({
              data: {
                districtId,
                module: data.module as string,
                department: data.department as string,
                roleName: data.roleName as string,
                sanctionedPosts: data.sanctionedPosts as number,
                workingStrength: data.workingStrength as number,
                vacantPosts,
                asOfDate: new Date(),
                sourceUrl: articleUrl,
              },
            });
            console.log(`[NewsAction] ✅ Created DepartmentStaffing: ${data.module}/${data.roleName}`);
          }
        }
        break;
      }

      default:
        console.log(`[NewsAction] No handler for ${targetModule}, skipping`);
    }
  } catch (err) {
    console.error(`[NewsAction] Error executing ${targetModule}:`, err);
  }
}

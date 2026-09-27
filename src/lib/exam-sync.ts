/**
 * ForThePeople.in — News-driven GovernmentExam sync
 *
 * Flow:
 *   NewsItem (classified as module="exams") → extractExamFromNews(AI)
 *     → syncExamFromNews → upsert across affected districts (NATIONAL
 *     exams fan out to every active district; STATE exams stay in their
 *     state) → logUpdate + Redis cache bust.
 *
 * Philosophy:
 *   - Never fabricate dates — AI must return null when the article is
 *     silent on a field. The sync side mirrors that: null values never
 *     overwrite existing concrete ones.
 *   - Status never downgrades (APPLICATIONS_OPEN → NOTIFICATION_OUT is
 *     rejected; the reverse is accepted).
 *   - Legacy records (seed-sourced, lowercase status) are preserved; the
 *     sync promotes them to the new status scheme when news confirms.
 */

import { Prisma } from "@/generated/prisma";
import { prisma } from "./db";
import { callAIJSON } from "./ai-provider";
import { cacheKey, cacheSet } from "./cache";
import { logUpdate } from "./update-log";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ExamStatus =
  | "NOTIFICATION_OUT"
  | "APPLICATIONS_OPEN"
  | "APPLICATIONS_CLOSED"
  | "ADMIT_CARD_OUT"
  | "EXAM_SCHEDULED"
  | "RESULT_PENDING"
  | "RESULT_OUT"
  | "COMPLETED";

export type ExamCategory =
  | "CENTRAL"
  | "STATE_PSC"
  | "BANKING"
  | "RAILWAY"
  | "DEFENCE"
  | "TEACHING"
  | "OTHER";

export type ExamScope = "NATIONAL" | "STATE";

export interface ExamExtraction {
  examName: string;
  shortName: string;
  organizingBody: string;
  category: ExamCategory;
  status: ExamStatus;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  resultDate: string | null;
  notificationDate: string | null;
  applyUrl: string | null;
  notificationUrl: string | null;
  vacancies: number | null;
  scope: ExamScope;
  stateName: string | null; // for STATE scope
}

export interface NewsArticleRef {
  title: string;
  url: string;
  publishedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// Status ordering (prevents downgrade)
// ═══════════════════════════════════════════════════════════

const STATUS_ORDER: Record<string, number> = {
  // Legacy lowercase
  upcoming: 0,
  open: 3,
  closed: 4,
  results: 7,
  // New uppercase
  NOTIFICATION_OUT: 1,
  APPLICATIONS_OPEN: 3,
  APPLICATIONS_CLOSED: 4,
  ADMIT_CARD_OUT: 5,
  EXAM_SCHEDULED: 5,
  RESULT_PENDING: 6,
  RESULT_OUT: 7,
  COMPLETED: 8,
};

function canonicalStatusRank(s: string | null | undefined): number {
  if (!s) return -1;
  return STATUS_ORDER[s] ?? -1;
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ═══════════════════════════════════════════════════════════
// AI extraction — never fabricate
// ═══════════════════════════════════════════════════════════

const EXTRACTION_SYSTEM_PROMPT =
  "You extract structured exam metadata from Indian government-exam news articles. " +
  "Return ONLY valid JSON — no markdown, no commentary. Every field you cannot confirm from " +
  "the article text must be null. Do NOT guess dates, vacancies, or URLs. Do NOT hallucinate.";

function buildExtractionPrompt(title: string, source: string, publishedAt: Date): string {
  const today = new Date().toISOString().split("T")[0];
  return `Article title: "${title}"
Source: ${source}
Article published: ${publishedAt.toISOString().split("T")[0]}
Today: ${today}

Extract the exam metadata. Return JSON in this exact shape:

{
  "examName": "Full formal name, e.g. 'UPSC Civil Services Examination 2026'",
  "shortName": "Canonical short name, e.g. 'UPSC CSE 2026' — keep year if mentioned",
  "organizingBody": "UPSC | SSC | IBPS | RRB | MPSC | KPSC | TSPSC | UPPSC | etc.",
  "category": "CENTRAL | STATE_PSC | BANKING | RAILWAY | DEFENCE | TEACHING | OTHER",
  "status": "NOTIFICATION_OUT | APPLICATIONS_OPEN | APPLICATIONS_CLOSED | ADMIT_CARD_OUT | EXAM_SCHEDULED | RESULT_PENDING | RESULT_OUT | COMPLETED",
  "applicationStartDate": "YYYY-MM-DD or null",
  "applicationEndDate": "YYYY-MM-DD or null",
  "admitCardDate": "YYYY-MM-DD or null",
  "examDate": "YYYY-MM-DD or null",
  "resultDate": "YYYY-MM-DD or null",
  "notificationDate": "YYYY-MM-DD or null",
  "applyUrl": "official application URL from the article, or null",
  "notificationUrl": "official notification PDF/page URL, or null",
  "vacancies": "number (total posts mentioned) or null",
  "scope": "NATIONAL | STATE",
  "stateName": "If scope=STATE, the state name; else null"
}

Rules:
- If the article is vague or not actually about a specific exam, return {"examName": ""} and stop.
- Never invent a date. Missing date → null.
- NATIONAL = UPSC/SSC/IBPS/RRB/IB/DRDO/ISRO/CDS/NDA/AFCAT. STATE_PSC / state teacher / state police are STATE.
- applyUrl must point to the official portal (upsconline.nic.in, ssc.nic.in, ibps.in, rrbcdg.gov.in, <state>.gov.in). Not the news article URL.
- Respond with the JSON only.`;
}

/**
 * Extracts exam metadata from a news article. Returns null on failure
 * (parse error, AI error, or examName empty — article isn't about a
 * specific exam). Never throws.
 */
export async function extractExamFromNews(
  article: NewsArticleRef
): Promise<ExamExtraction | null> {
  let parsed: Partial<ExamExtraction>;
  try {
    const { data } = await callAIJSON<Partial<ExamExtraction>>({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userPrompt: buildExtractionPrompt(article.title, article.url, article.publishedAt),
      purpose: "news-analysis", // free tier
      jsonShape: "object",
      maxTokens: 1024,
      temperature: 0,
      timeoutMs: 30_000,
    });
    parsed = data;
  } catch (err) {
    console.error("[exam-sync] extract failed:", err instanceof Error ? err.message : err);
    return null;
  }

  if (!parsed.examName || typeof parsed.examName !== "string" || parsed.examName.trim().length < 3) {
    return null;
  }

  // Normalize shape with defaults. Never coerce null → today or similar.
  const scope: ExamScope = parsed.scope === "STATE" ? "STATE" : "NATIONAL";
  return {
    examName: parsed.examName.trim(),
    shortName: (parsed.shortName ?? parsed.examName)!.toString().trim(),
    organizingBody: (parsed.organizingBody ?? "").toString().trim() || "Unknown",
    category: (parsed.category as ExamCategory) ?? "OTHER",
    // "Applications open" needs a closing date from the notification; without
    // one the official collector would flip it back every day (it only marks
    // an exam open between a published opening and closing date).
    status:
      parsed.status === "APPLICATIONS_OPEN" && !parsed.applicationEndDate
        ? "NOTIFICATION_OUT"
        : ((parsed.status as ExamStatus) ?? "NOTIFICATION_OUT"),
    applicationStartDate: parsed.applicationStartDate ?? null,
    applicationEndDate: parsed.applicationEndDate ?? null,
    admitCardDate: parsed.admitCardDate ?? null,
    examDate: parsed.examDate ?? null,
    resultDate: parsed.resultDate ?? null,
    notificationDate: parsed.notificationDate ?? null,
    applyUrl: parsed.applyUrl ?? null,
    notificationUrl: parsed.notificationUrl ?? null,
    vacancies: typeof parsed.vacancies === "number" ? parsed.vacancies : null,
    scope,
    stateName: parsed.stateName ?? null,
  };
}

// ═══════════════════════════════════════════════════════════
// Upsert: find target districts, then create-or-update
// ═══════════════════════════════════════════════════════════

async function findTargetDistricts(extraction: ExamExtraction): Promise<Array<{ id: string; stateId: string | null; stateSlug: string | null; districtSlug: string }>> {
  if (extraction.scope === "NATIONAL") {
    // Every active district
    const rows = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, stateId: true, state: { select: { slug: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      stateId: r.stateId,
      stateSlug: r.state?.slug ?? null,
      districtSlug: r.slug,
    }));
  }
  // STATE scope — resolve state by name (case-insensitive)
  if (!extraction.stateName) return [];
  const state = await prisma.state.findFirst({
    where: { name: { equals: extraction.stateName, mode: "insensitive" } },
    select: { id: true, slug: true },
  });
  if (!state) return [];
  const rows = await prisma.district.findMany({
    where: { stateId: state.id, active: true },
    select: { id: true, slug: true, stateId: true },
  });
  return rows.map((r) => ({
    id: r.id,
    stateId: r.stateId,
    stateSlug: state.slug,
    districtSlug: r.slug,
  }));
}

function mergeSourceUrls(existing: unknown, nextUrl: string): string[] {
  const arr = Array.isArray(existing) ? (existing as unknown[]).filter((v): v is string => typeof v === "string") : [];
  if (!arr.includes(nextUrl)) arr.push(nextUrl);
  // keep last 10 unique — prevent the JSON column ballooning
  return arr.slice(-10);
}

export interface SyncResult {
  affectedDistricts: number;
  created: number;
  updated: number;
  skipped: number;
}

export async function syncExamFromNews(
  extraction: ExamExtraction,
  article: NewsArticleRef,
  sourceDistrictId: string
): Promise<SyncResult> {
  const targets = await findTargetDistricts(extraction);
  if (targets.length === 0) {
    // Fall back to the article's own district so we still persist one row
    const fallback = await prisma.district.findUnique({
      where: { id: sourceDistrictId },
      select: { id: true, slug: true, stateId: true, state: { select: { slug: true } } },
    });
    if (!fallback) return { affectedDistricts: 0, created: 0, updated: 0, skipped: 1 };
    targets.push({
      id: fallback.id,
      stateId: fallback.stateId,
      stateSlug: fallback.state?.slug ?? null,
      districtSlug: fallback.slug,
    });
  }

  const now = new Date();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const appStart = parseDate(extraction.applicationStartDate);
  const appEnd = parseDate(extraction.applicationEndDate);
  const admitCard = parseDate(extraction.admitCardDate);
  const examDate = parseDate(extraction.examDate);
  const resultDate = parseDate(extraction.resultDate);
  const notifDate = parseDate(extraction.notificationDate);

  for (const t of targets) {
    // Fuzzy match by shortName OR by first 3 words of examName
    const namePrefix = extraction.examName.split(/\s+/).slice(0, 3).join(" ");
    const existing = await prisma.governmentExam.findFirst({
      where: {
        districtId: t.id,
        OR: [
          { shortName: { equals: extraction.shortName, mode: "insensitive" } },
          { title: { contains: extraction.shortName, mode: "insensitive" } },
          { title: { contains: namePrefix, mode: "insensitive" } },
        ],
      },
    });

    if (!existing) {
      await prisma.governmentExam.create({
        data: {
          level: extraction.scope === "NATIONAL" ? "national" : "state",
          stateId: t.stateId,
          districtId: t.id,
          title: extraction.examName,
          shortName: extraction.shortName,
          department: extraction.organizingBody,
          organizingBody: extraction.organizingBody,
          category: extraction.category,
          scope: extraction.scope,
          status: extraction.status,
          vacancies: extraction.vacancies,
          applyUrl: extraction.applyUrl,
          notificationUrl: extraction.notificationUrl,
          notificationDate: notifDate,
          announcedDate: notifDate ?? now,
          startDate: appStart,
          endDate: appEnd,
          admitCardDate: admitCard,
          examDate,
          resultDate,
          sourceUrls: [article.url] as Prisma.InputJsonValue,
          lastVerifiedAt: now,
          needsVerification: false,
        },
      });
      created++;
      continue;
    }

    // Status never downgrades
    const incomingRank = canonicalStatusRank(extraction.status);
    const existingRank = canonicalStatusRank(existing.status);
    const statusUpdate = incomingRank >= existingRank ? { status: extraction.status } : {};

    const patch: Prisma.GovernmentExamUpdateInput = {
      ...statusUpdate,
      lastVerifiedAt: now,
      needsVerification: false,
      sourceUrls: mergeSourceUrls(existing.sourceUrls, article.url) as Prisma.InputJsonValue,
    };

    // Fill-only: null values never overwrite concrete existing data
    if (!existing.shortName && extraction.shortName) patch.shortName = extraction.shortName;
    if (!existing.organizingBody && extraction.organizingBody) patch.organizingBody = extraction.organizingBody;
    if (!existing.category && extraction.category) patch.category = extraction.category;
    if (!existing.scope && extraction.scope) patch.scope = extraction.scope;
    if (!existing.applyUrl && extraction.applyUrl) patch.applyUrl = extraction.applyUrl;
    if (!existing.notificationUrl && extraction.notificationUrl) patch.notificationUrl = extraction.notificationUrl;
    if (!existing.vacancies && extraction.vacancies != null) patch.vacancies = extraction.vacancies;
    if (!existing.notificationDate && notifDate) patch.notificationDate = notifDate;
    if (!existing.startDate && appStart) patch.startDate = appStart;
    if (!existing.endDate && appEnd) patch.endDate = appEnd;
    if (!existing.admitCardDate && admitCard) patch.admitCardDate = admitCard;
    if (!existing.examDate && examDate) patch.examDate = examDate;
    if (!existing.resultDate && resultDate) patch.resultDate = resultDate;

    // Always set a short name if we have one and the existing is empty
    const touched = Object.keys(patch).length > 3; // >3 = more than just lastVerifiedAt/needsVerification/sourceUrls

    await prisma.governmentExam.update({
      where: { id: existing.id },
      data: patch,
    });

    if (touched) updated++;
    else skipped++;
  }

  // Cache bust for every affected district's exams module
  for (const t of targets) {
    try {
      await cacheSet(cacheKey(t.districtSlug, "exams"), null, 1);
    } catch {
      /* cache optional */
    }
  }

  // One UpdateLog row per affected district
  for (const t of targets) {
    await logUpdate({
      source: "scraper",
      actorLabel: "news-cron",
      tableName: "GovernmentExam",
      recordId: `${t.id}:${extraction.shortName}`,
      action: "update",
      districtId: t.id,
      moduleName: "exams",
      description: `${extraction.shortName}: ${extraction.status}`,
      recordCount: 1,
      details: {
        scope: extraction.scope,
        organizingBody: extraction.organizingBody,
        applyUrl: extraction.applyUrl,
        source: article.url,
      },
    });
  }

  return { affectedDistricts: targets.length, created, updated, skipped };
}

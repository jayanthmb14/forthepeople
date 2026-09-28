/**
 * ForThePeople.in — News-driven GovernmentExam sync
 *
 * Flow:
 *   NewsItem (classified as module="exams") → extractExamFromNews(AI)
 *     → syncExamFromNews → one row per exam per place → logUpdate +
 *     Redis cache bust for every district that shows it.
 *
 * Where a row lives (Sept 2026 — src/lib/dedupe/exam-rules.ts):
 *   - NATIONAL exam → ONE row (districtId null, stateId null). Every
 *     district page reads it. (Until Sept 2026 it was copied onto every
 *     active district — ten copies of "NEET 2026" per exam.)
 *   - STATE exam    → one row per state (stateId set, districtId null).
 *   - DISTRICT exam → one row for that district (a city corporation, a
 *     district court).
 * An existing row is found by its canonical exam key (src/lib/dedupe/keys.ts:
 * "NEET 2026" = "NEET (UG) 2026" = "NEET UG 2026"), never by substring.
 *
 * Philosophy:
 *   - Only government / statutory organisers (classifyExamBody). A private
 *     university's admission test or a company's hiring is not stored.
 *   - Never fabricate dates — AI must return null when the article is
 *     silent on a field. The sync side mirrors that: null values never
 *     overwrite existing concrete ones.
 *   - Status is written in the canonical words and never downgrades
 *     (APPLICATIONS_OPEN → NOTIFICATION_OUT is rejected; the reverse is
 *     accepted). Legacy words ("upcoming", "declared") are normalised.
 *   - A news mention never CONFIRMS an exam, and a link is kept only when
 *     it is official and written in the article text (src/lib/exam-news.ts).
 */

import { Prisma } from "@/generated/prisma";
import { prisma } from "./db";
import { AIDeadlineError, callAIJSON } from "./ai-provider";
import { cacheKey, cacheSet } from "./cache";
import { logUpdate } from "./update-log";
import {
  KNOWN_EXAM_BODIES,
  canonicalExamStatus,
  examBody,
  sameExam,
  type CanonicalExamStatus,
} from "./dedupe/keys";
import {
  classifyExamBody,
  examBucket,
  examPlacement,
  pickBestExam,
  type ExamPlacement,
  type ExamScope,
} from "./dedupe/exam-rules";
import { examUpdateFromNews, newExamFromNews, officialExamUrlFromArticle, type ExamNewsFacts } from "./exam-news";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

/** Canonical statuses (src/lib/dedupe/keys.ts); "UNVERIFIED" = dates not confirmed. */
export type ExamStatus = CanonicalExamStatus;

export type ExamCategory =
  | "CENTRAL"
  | "STATE_PSC"
  | "BANKING"
  | "RAILWAY"
  | "DEFENCE"
  | "TEACHING"
  | "OTHER";

export type { ExamScope };

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
  stateName: string | null; // for STATE / DISTRICT scope
}

export interface NewsArticleRef {
  title: string;
  url: string;
  publishedAt: Date;
  /** The outlet's name; the prompt names it instead of the article URL. */
  source?: string | null;
  /** The feed's summary, when it says more than the headline. */
  summary?: string | null;
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

function buildExtractionPrompt(article: NewsArticleRef): string {
  const today = new Date().toISOString().split("T")[0];
  // The outlet's name, never the article URL: the model copied the Google
  // News link into applyUrl (Sept 2026 review).
  return `Article title: "${article.title}"${article.summary ? `\nArticle summary: "${article.summary.slice(0, 300)}"` : ""}
Source: ${article.source?.trim() || "a news outlet"}
Article published: ${article.publishedAt.toISOString().split("T")[0]}
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
  "applyUrl": "application URL written in the article text above, or null",
  "notificationUrl": "notification PDF/page URL written in the article text above, or null",
  "vacancies": "number (total posts mentioned) or null",
  "scope": "NATIONAL | STATE | DISTRICT",
  "stateName": "If scope=STATE or DISTRICT, the state name; else null"
}

Rules:
- If the article is vague or not actually about a specific exam, return {"examName": ""} and stop.
- Never invent a date. Missing date → null.
- NATIONAL = UPSC/SSC/IBPS/RRB/IB/DRDO/ISRO/CDS/NDA/AFCAT/NTA (NEET, JEE, CUET)/CBSE. STATE_PSC / state teacher / state police / state school boards are STATE. DISTRICT = recruitment for ONE city or district body only (a municipal corporation, a district court, a zilla panchayat).
- organizingBody must be the body that conducts the exam (NEET UG is conducted by NTA). If the organiser is a private university, college, consortium or company, return {"examName": ""} — only government exams are tracked.
- applyUrl / notificationUrl: copy a URL only if it is written in the article text above and is an official site. Never a portal you know or guess, never a news link — otherwise null.
- Respond with the JSON only.`;
}

/**
 * Extracts exam metadata from a news article. Returns null on failure
 * (parse error, AI error, or examName empty — article isn't about a
 * specific exam). Never throws.
 */
export async function extractExamFromNews(
  article: NewsArticleRef,
  /** deadlineAt: epoch ms after which no AI call starts (the news cron's time budget). */
  opts: { deadlineAt?: number } = {},
): Promise<ExamExtraction | null> {
  let parsed: Partial<ExamExtraction>;
  try {
    const { data } = await callAIJSON<Partial<ExamExtraction>>({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userPrompt: buildExtractionPrompt(article),
      purpose: "news-analysis", // free tier
      jsonShape: "object",
      maxTokens: 1024,
      temperature: 0,
      timeoutMs: 30_000,
      deadlineAt: opts.deadlineAt,
    });
    parsed = data;
  } catch (err) {
    if (err instanceof AIDeadlineError) console.log("[exam-sync] extract skipped: no time left in the run");
    else console.error("[exam-sync] extract failed:", err instanceof Error ? err.message : err);
    return null;
  }

  if (!parsed.examName || typeof parsed.examName !== "string" || parsed.examName.trim().length < 3) {
    return null;
  }

  // Normalize shape with defaults. Never coerce null → today or similar.
  const scope: ExamScope = parsed.scope === "STATE" ? "STATE" : parsed.scope === "DISTRICT" ? "DISTRICT" : "NATIONAL";
  const status = canonicalExamStatus(parsed.status ?? null, parsed.examName);
  // Links only when official AND written in the text the model was given.
  const articleText = `${article.title} ${article.summary ?? ""}`;
  return {
    examName: parsed.examName.trim(),
    shortName: (parsed.shortName ?? parsed.examName)!.toString().trim(),
    organizingBody: (parsed.organizingBody ?? "").toString().trim() || "Unknown",
    category: (parsed.category as ExamCategory) ?? "OTHER",
    // "Applications open" needs a closing date from the notification; without
    // one the official collector would flip it back every day (it only marks
    // an exam open between a published opening and closing date).
    status: status === "APPLICATIONS_OPEN" && !parsed.applicationEndDate ? "NOTIFICATION_OUT" : status,
    applicationStartDate: parsed.applicationStartDate ?? null,
    applicationEndDate: parsed.applicationEndDate ?? null,
    admitCardDate: parsed.admitCardDate ?? null,
    examDate: parsed.examDate ?? null,
    resultDate: parsed.resultDate ?? null,
    notificationDate: parsed.notificationDate ?? null,
    applyUrl: officialExamUrlFromArticle(parsed.applyUrl, articleText),
    notificationUrl: officialExamUrlFromArticle(parsed.notificationUrl, articleText),
    vacancies: typeof parsed.vacancies === "number" ? parsed.vacancies : null,
    scope,
    stateName: parsed.stateName ?? null,
  };
}

// ═══════════════════════════════════════════════════════════
// Upsert: one row per exam per place
// ═══════════════════════════════════════════════════════════

interface Place {
  placement: ExamPlacement;
  /** Districts whose page shows this exam (cache bust + update log). */
  districts: Array<{ id: string; slug: string }>;
}

async function resolvePlace(extraction: ExamExtraction, sourceDistrictId: string): Promise<Place | null> {
  const src = await prisma.district.findUnique({
    where: { id: sourceDistrictId },
    select: { id: true, slug: true, stateId: true },
  });
  if (extraction.scope === "NATIONAL") {
    const districts = await prisma.district.findMany({ where: { active: true }, select: { id: true, slug: true } });
    return { placement: examPlacement("NATIONAL", null, null), districts };
  }
  // STATE / DISTRICT: the named state, else the article's own state.
  let stateId = src?.stateId ?? null;
  if (extraction.stateName) {
    const named = await prisma.state.findFirst({
      where: { name: { equals: extraction.stateName, mode: "insensitive" } },
      select: { id: true },
    });
    if (named) stateId = named.id;
  }
  if (!stateId) return null;
  if (extraction.scope === "DISTRICT") {
    // A district exam belongs to the article's district, and only when that district is in the named state.
    if (!src || src.stateId !== stateId) return null;
    return { placement: examPlacement("DISTRICT", stateId, src.id), districts: [{ id: src.id, slug: src.slug }] };
  }
  const districts = await prisma.district.findMany({ where: { stateId, active: true }, select: { id: true, slug: true } });
  return { placement: examPlacement("STATE", stateId, null), districts };
}

/** Rows that could be this exam: everything stored in the same place (national list / one state / one district). */
async function rowsInPlace(p: ExamPlacement) {
  const where: Prisma.GovernmentExamWhereInput =
    p.scope === "NATIONAL"
      ? { OR: [{ level: "national" }, { scope: "NATIONAL", stateId: null }] }
      : p.scope === "STATE"
        ? { stateId: p.stateId, OR: [{ level: "state" }, { scope: "STATE" }] }
        : { districtId: p.districtId, level: "district" };
  const rows = await prisma.governmentExam.findMany({ where, take: 2000 });
  const bucket = examBucket(p);
  return rows.filter((r) => examBucket(r) === bucket);
}


export interface SyncResult {
  affectedDistricts: number;
  created: number;
  updated: number;
  skipped: number;
  /** Why nothing was written, when nothing was. */
  rejected?: "non-government" | "no-place";
}

export async function syncExamFromNews(
  extraction: ExamExtraction,
  article: NewsArticleRef,
  sourceDistrictId: string
): Promise<SyncResult> {
  const identity = { title: extraction.examName, shortName: extraction.shortName, organizingBody: extraction.organizingBody };

  // Rule 1: only exams run by a government or statutory body.
  const bodyClass = classifyExamBody(identity);
  if (bodyClass !== "government") {
    console.log(`[exam-sync] skipped (${bodyClass} organiser "${extraction.organizingBody}"): ${extraction.examName.slice(0, 80)}`);
    return { affectedDistricts: 0, created: 0, updated: 0, skipped: 1, rejected: "non-government" };
  }

  const place = await resolvePlace(extraction, sourceDistrictId);
  if (!place) return { affectedDistricts: 0, created: 0, updated: 0, skipped: 1, rejected: "no-place" };
  const { placement } = place;

  const official = KNOWN_EXAM_BODIES[examBody(identity)];
  const organizingBody = official?.organizingBody ?? extraction.organizingBody;
  const facts: ExamNewsFacts = {
    examName: extraction.examName,
    shortName: extraction.shortName,
    category: extraction.category,
    status: extraction.status,
    organizingBody,
    officialBody: official ?? null,
    vacancies: extraction.vacancies,
    applyUrl: extraction.applyUrl,
    notificationUrl: extraction.notificationUrl,
    notificationDate: parseDate(extraction.notificationDate),
    startDate: parseDate(extraction.applicationStartDate),
    endDate: parseDate(extraction.applicationEndDate),
    admitCardDate: parseDate(extraction.admitCardDate),
    examDate: parseDate(extraction.examDate),
    resultDate: parseDate(extraction.resultDate),
  };

  // Same exam = shares a canonical key, in the same place. Extra copies
  // (legacy per-district rows) are merged by the duplicate guard.
  const matches = (await rowsInPlace(placement)).filter((r) => sameExam(r, identity));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let recordId: string;

  if (matches.length === 0) {
    // Waits for the official collector's check (needsVerification, no lastVerifiedAt).
    const row = await prisma.governmentExam.create({
      data: {
        ...placement,
        ...newExamFromNews(facts, article.url),
      },
      select: { id: true },
    });
    recordId = row.id;
    created++;
  } else {
    const existing = pickBestExam(matches);
    recordId = existing.id;
    if (matches.length > 1) {
      console.log(`[exam-sync] ${matches.length} stored copies of "${extraction.shortName}" — the duplicate guard merges them`);
    }

    // Status forward only, fill-only facts, the URL appended; never "confirmed" by news.
    const update = examUpdateFromNews(existing, facts, article.url);
    await prisma.governmentExam.update({
      where: { id: existing.id },
      data: update.patch as Prisma.GovernmentExamUncheckedUpdateInput,
    });
    if (update.facts > 0 || update.moved) updated++;
    else skipped++;
  }

  // Cache bust for every district page that shows this exam
  for (const d of place.districts) {
    try {
      await cacheSet(cacheKey(d.slug, "exams"), null, 1);
    } catch {
      /* cache optional */
    }
  }

  // One UpdateLog row per district that shows it (the public change feed) —
  // only when something was created or changed. A mention that changed no
  // fact is not an update (for a national exam it logged one row for every
  // district on every news mention).
  if (created === 0 && updated === 0) return { affectedDistricts: place.districts.length, created, updated, skipped };
  for (const d of place.districts) {
    await logUpdate({
      source: "scraper",
      actorLabel: "news-cron",
      tableName: "GovernmentExam",
      recordId,
      action: created ? "create" : "update",
      districtId: d.id,
      moduleName: "exams",
      description: `${extraction.shortName}: ${extraction.status}`,
      recordCount: 1,
      details: {
        scope: placement.scope,
        organizingBody,
        applyUrl: extraction.applyUrl,
        source: article.url,
      },
    });
  }

  return { affectedDistricts: place.districts.length, created, updated, skipped };
}

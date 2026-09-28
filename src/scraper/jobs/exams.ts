/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Government exams — from the commissions' own sites only
// Schedule: daily, as the first pass of /api/cron/update-exams.
//
// Sept 2026 (v5): this file used to ship HARD-CODED exam lists (UPSC CSE,
// SSC CGL "open, 18,000 posts", KSP, KEA KAS …) with invented vacancies
// and dates, linked to dead hosts (upscrecruitment.gov.in, ssc.nic.in),
// and scraped kpsc.karnataka.gov.in (does not resolve). All of that is
// gone. Exams are now created or updated only from:
//   - UPSC's "Active Examinations" page and each exam's own page
//     (notice PDF, notification date, last date, exam date, admit card,
//     results), and
//   - SSC's live-exams feed (the JSON ssc.gov.in loads: application
//     start/end dates, fee, age limits).
// Parsers and the status rule: src/scraper/lib/exam-sources.ts. An exam
// is marked "APPLICATIONS_OPEN" only between an opening date and a
// closing date that the source itself published.
//
// State commissions (KPSC etc.) are not automated yet: kpsc.kar.nic.in
// answers with a malformed HTTP header. News-driven updates stay in
// src/lib/exam-sync.ts.
//
// An exam is matched to its stored row by the canonical exam key
// (src/lib/dedupe/keys.ts), so "SSC CPO 2026" from the news and SSC's
// "Sub-Inspector in Delhi Police and CAPF Examination, 2026" are one row,
// stored once as a national row (districtId null).
// ═══════════════════════════════════════════════════════════
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import type { ScraperResult } from "../types";
import { canonicalExamStatus, examStatusRank, sameExam } from "@/lib/dedupe/keys";
import { correctPlacement, examBucket, pickBestExam } from "@/lib/dedupe/exam-rules";
import {
  SSC_LIVE_EXAMS_URL,
  UPSC_ACTIVE_EXAMS_URL,
  isCurrentExamTitle,
  officialExamStatus,
  parseSscLiveExams,
  parseUpscActiveList,
  parseUpscExamPage,
  type OfficialExam,
} from "../lib/exam-sources";
import { fetchSource } from "../lib/source-fetch";

// Names ForThePeople.in honestly; kept as it was (a new user agent would
// need a check against upsc.gov.in first).
const BROWSER_UA =
  "Mozilla/5.0 (compatible; ForThePeople.in/1.0; +https://forthepeople.in) AppleWebKit/537.36 (KHTML, like Gecko)";
const FETCH_TIMEOUT_MS = 12_000;
/** Exams whose exam date is further back than this are not refreshed. */
const STALE_EXAM_DAYS = 180;

// Status order so an official update never moves an exam backwards:
// examStatusRank() in src/lib/dedupe/keys.ts (legacy words included).
const rank = (s: string | null | undefined) => examStatusRank(s);

/**
 * One official page through the shared polite fetcher (src/scraper/lib/
 * source-fetch.ts): one request every 2.5 s per host (Sept 2026: the UPSC
 * pass sent 4 pages at once), no retry (as before, so the pass stays inside
 * the cron's time budget), and no redirect following (upsc.gov.in answers
 * moved pages with a redirect to its home page). Throws on failure so the
 * caller logs it and writes nothing.
 */
async function getText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetchSource(url, {
    headers: { "User-Agent": BROWSER_UA, ...headers },
    redirect: "manual",
    timeoutMs: FETCH_TIMEOUT_MS,
    retries: 0,
  });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.error ?? `HTTP ${res.status}`}`);
  return res.text;
}

/** UPSC active exams with the facts from each exam's page. */
async function collectUpsc(log: (m: string) => void, deadlineMs: number): Promise<OfficialExam[]> {
  const list = parseUpscActiveList(await getText(UPSC_ACTIVE_EXAMS_URL));
  const now = new Date();
  const current = list.filter((x) => isCurrentExamTitle(x.title, now));
  log(`UPSC: ${list.length} active exams listed, ${current.length} current`);

  // One page at a time (the fetcher keeps 2.5 s between upsc.gov.in
  // requests); what the time budget does not reach is read tomorrow.
  const out: OfficialExam[] = [];
  for (let i = 0; i < current.length; i++) {
    if (Date.now() > deadlineMs) {
      log(`UPSC: time budget reached, ${current.length - i} exam page(s) left for tomorrow`);
      break;
    }
    const x = current[i];
    try {
      out.push(parseUpscExamPage(await getText(x.url), x.url, x.title));
    } catch (err) {
      log(`UPSC: "${x.title}" page failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return out;
}

/** SSC exams taking applications now (SSC's own feed). */
async function collectSsc(): Promise<OfficialExam[]> {
  const body = await getText(SSC_LIVE_EXAMS_URL, { Referer: "https://ssc.gov.in/", Accept: "application/json" });
  return parseSscLiveExams(JSON.parse(body));
}

export interface OfficialExamsResult extends ScraperResult {
  /** Per-source outcome, for the run log. */
  sources: Array<{ source: string; ok: boolean; exams: number; error?: string }>;
}

/** Write one official exam: update every national row for it, or create one. */
async function upsertOfficialExam(e: OfficialExam, nowMs: number): Promise<"created" | "updated" | "unchanged"> {
  const status = officialExamStatus(e, nowMs);
  const identity = { title: e.title, shortName: e.shortName, organizingBody: e.body };
  const national = await prisma.governmentExam.findMany({
    where: { OR: [{ level: "national" }, { scope: "NATIONAL", stateId: null }] },
    take: 2000,
  });
  const existing = national.filter((r) => examBucket(r) === "N" && sameExam(r, identity));

  const official = {
    title: e.title,
    shortName: e.shortName,
    department: e.department,
    organizingBody: e.body,
    category: "CENTRAL",
    scope: "NATIONAL",
    applyUrl: e.pageUrl,
    lastVerifiedAt: new Date(nowMs),
    needsVerification: false,
  };
  // Dates and links only when the source published them (never cleared).
  const published: {
    notificationUrl?: string;
    notificationDate?: Date;
    startDate?: Date;
    endDate?: Date;
    examDate?: Date;
    admitCardDate?: Date;
    resultDate?: Date;
    ageLimit?: string;
    applicationFee?: string;
  } = {};
  if (e.notificationUrl) published.notificationUrl = e.notificationUrl;
  if (e.notificationDate) published.notificationDate = e.notificationDate;
  if (e.startDate) published.startDate = e.startDate;
  if (e.endDate) published.endDate = e.endDate;
  if (e.examDate) published.examDate = e.examDate;
  if (e.admitCardDate) published.admitCardDate = e.admitCardDate;
  if (e.resultDate) published.resultDate = e.resultDate;
  if (e.ageLimit) published.ageLimit = e.ageLimit;
  if (e.applicationFee) published.applicationFee = e.applicationFee;

  if (existing.length === 0) {
    await prisma.governmentExam.create({
      data: {
        level: "national",
        stateId: null,
        districtId: null,
        ...official,
        ...published,
        status: status ?? "NOTIFICATION_OUT",
        announcedDate: e.notificationDate ?? e.startDate ?? null,
        sourceUrls: [e.pageUrl] as Prisma.InputJsonValue,
      },
    });
    return "created";
  }

  // Every stored copy gets the official facts; the best one also becomes
  // the single national row (a legacy per-district copy loses its district).
  // The duplicate guard merges the other copies into it.
  const best = pickBestExam(existing);
  for (const row of existing) {
    const urls = Array.isArray(row.sourceUrls) ? (row.sourceUrls as unknown[]).filter((u): u is string => typeof u === "string") : [];
    const current = canonicalExamStatus(row.status, row.title);
    const statusPatch =
      status && (rank(status) >= rank(current) || rank(current) < 0) ? { status } : current !== row.status ? { status: current } : {};
    const fix = correctPlacement(row);
    await prisma.governmentExam.update({
      where: { id: row.id },
      data: {
        ...official,
        ...published,
        ...statusPatch,
        ...(row.id === best.id && fix.misplaced ? fix.placement : {}),
        sourceUrls: (urls.includes(e.pageUrl) ? urls : [...urls, e.pageUrl]) as Prisma.InputJsonValue,
      },
    });
  }
  return "updated";
}

/**
 * Collect UPSC + SSC exams and write them as national GovernmentExam rows.
 * A source that fails is reported; the other still runs.
 */
export async function collectOfficialExams(
  log: (m: string) => void,
  opts: { deadlineMs?: number } = {},
): Promise<OfficialExamsResult> {
  const deadlineMs = opts.deadlineMs ?? Date.now() + 60_000;
  const sources: OfficialExamsResult["sources"] = [];
  const exams: OfficialExam[] = [];

  for (const [source, run] of [
    ["upsc.gov.in", () => collectUpsc(log, deadlineMs)],
    ["ssc.gov.in", collectSsc],
  ] as const) {
    try {
      const got = await run();
      exams.push(...got);
      sources.push({ source, ok: true, exams: got.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`${source}: ${msg}`);
      sources.push({ source, ok: false, exams: 0, error: msg });
    }
  }

  const nowMs = Date.now();
  let created = 0;
  let updated = 0;
  for (const e of exams) {
    if (e.examDate && nowMs - e.examDate.getTime() > STALE_EXAM_DAYS * 86_400_000 && !e.resultOut) continue;
    try {
      const r = await upsertOfficialExam(e, nowMs);
      if (r === "created") created++;
      else if (r === "updated") updated++;
    } catch (err) {
      log(`write failed for "${e.shortName}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const failed = sources.filter((s) => !s.ok);
  log(`official exams: ${created} new, ${updated} updated (${sources.map((s) => `${s.source} ${s.ok ? s.exams : "failed"}`).join(", ")})`);
  return {
    success: failed.length < sources.length,
    recordsNew: created,
    recordsUpdated: updated,
    error: failed.length ? failed.map((s) => `${s.source}: ${s.error}`).join("; ") : undefined,
    sources,
  };
}

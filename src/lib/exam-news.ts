/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Exam rows written from the news — PURE rules (no DB), unit-tested in
// tests/exam-news.test.ts. src/lib/exam-sync.ts does the reading and
// writing; this file decides WHAT it writes.
//
// Why (Sept 2026 review): the extractor sees a headline and at most the
// feed's short summary, yet it returned "official" links — the Google
// News article URL copied from the prompt (NEET UG 2026's applyUrl) or a
// portal guessed from the prompt's example list (https://ibps.in). And
// every news mention stamped the row lastVerifiedAt = now and
// needsVerification = false, so the exam page showed it as confirmed
// (countdown, "open", Apply button) and the overview's "Next exam"
// trusted its dates. Now:
//   - a link is kept only when it is official (isOfficialUrl) AND written
//     in the article text the model was given — a headline-only
//     extraction stores no link;
//   - a news mention never confirms an exam: only the official collector
//     (src/scraper/jobs/exams.ts) sets lastVerifiedAt and clears
//     needsVerification. A row the news creates waits for that check;
//   - no date is invented: "announced" is the published notification
//     (or opening) date, as the official collector writes it — never the
//     day the news was read.
// ═══════════════════════════════════════════════════════════
import { isOfficialUrl } from "@/components/community/examTimeline";
import { canonicalExamStatus, examStatusRank, type CanonicalExamStatus } from "./dedupe/keys";
import { correctPlacement, urlList, type ExamLocation } from "./dedupe/exam-rules";

/** Lower-case, no scheme, no "www.", no trailing slash: how a link is looked for in the text. */
function bareUrl(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

/**
 * The link, when it is an official one (a government domain or a named
 * recruiter's own site) AND it is written in the article text the model
 * saw; otherwise null. The news article's own URL, a portal the model
 * knows or guesses, or anything not in the text never becomes an exam's
 * apply or notification link.
 */
export function officialExamUrlFromArticle(url: unknown, articleText: string): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  if (!isOfficialUrl(url)) return null;
  const key = bareUrl(url);
  if (key.length < 4) return null;
  const text = articleText.toLowerCase().replace(/https?:\/\//g, "").replace(/\bwww\./g, "");
  return text.includes(key) ? url.trim() : null;
}

/** The facts one news article gave about an exam (dates parsed, organiser resolved). */
export interface ExamNewsFacts {
  examName: string;
  shortName: string;
  category: string;
  status: CanonicalExamStatus;
  /** The organiser as stored: the known body's name when there is one. */
  organizingBody: string;
  /** Set when the organiser is a known body (KNOWN_EXAM_BODIES): its official name and department. */
  officialBody: { organizingBody: string; department: string } | null;
  vacancies: number | null;
  applyUrl: string | null;
  notificationUrl: string | null;
  notificationDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  admitCardDate: Date | null;
  examDate: Date | null;
  resultDate: Date | null;
}

/** News URLs that mentioned the exam: append, keep the last 10 (the JSON column must not balloon). */
export function mergeSourceUrls(existing: unknown, nextUrl: string): string[] {
  const arr = urlList(existing);
  if (!arr.includes(nextUrl)) arr.push(nextUrl);
  return arr.slice(-10);
}

/** Columns of a new exam row found only in the news (the caller adds its placement). */
export function newExamFromNews(f: ExamNewsFacts, sourceUrl: string) {
  return {
    title: f.examName,
    shortName: f.shortName,
    department: f.officialBody?.department ?? f.organizingBody,
    organizingBody: f.organizingBody,
    category: f.category,
    status: f.status,
    vacancies: f.vacancies,
    applyUrl: f.applyUrl,
    notificationUrl: f.notificationUrl,
    notificationDate: f.notificationDate,
    // As the official collector writes it; null when the news gave neither date.
    announcedDate: f.notificationDate ?? f.startDate ?? null,
    startDate: f.startDate,
    endDate: f.endDate,
    admitCardDate: f.admitCardDate,
    examDate: f.examDate,
    resultDate: f.resultDate,
    sourceUrls: [sourceUrl],
    // Not confirmed: the official collector checks it (lastVerifiedAt stays empty).
    needsVerification: true,
  };
}

/** The stored columns a news update reads. */
export interface StoredExamForNews extends ExamLocation {
  title: string;
  status: string;
  shortName: string | null;
  organizingBody: string | null;
  category: string | null;
  applyUrl: string | null;
  notificationUrl: string | null;
  vacancies: number | null;
  notificationDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  admitCardDate: Date | null;
  examDate: Date | null;
  resultDate: Date | null;
  sourceUrls: unknown;
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (typeof v === "string" && /^unknown$/i.test(v));

/**
 * The update a news mention makes to a stored exam: its URL is appended to
 * sourceUrls; status only moves forward (a legacy word is rewritten in the
 * canonical set); a misplaced legacy copy gets its place's columns; every
 * other field is fill-only (a null never overwrites a stored value). It
 * never touches lastVerifiedAt / needsVerification. `facts` counts the
 * facts it changed; `moved` says the placement was corrected.
 */
export function examUpdateFromNews(
  existing: StoredExamForNews,
  f: ExamNewsFacts,
  sourceUrl: string,
): { patch: Record<string, unknown>; facts: number; moved: boolean } {
  const currentStatus = canonicalExamStatus(existing.status, existing.title);
  const nextStatus = examStatusRank(f.status) >= examStatusRank(currentStatus) ? f.status : currentStatus;

  const patch: Record<string, unknown> = { sourceUrls: mergeSourceUrls(existing.sourceUrls, sourceUrl) };
  let facts = 0;
  if (existing.status !== nextStatus) {
    patch.status = nextStatus;
    facts++;
  }
  // A legacy per-district copy found here becomes the one row for its place.
  const fix = correctPlacement(existing);
  if (fix.misplaced) Object.assign(patch, fix.placement);

  const fill = (key: string, has: unknown, value: unknown) => {
    if (isEmpty(has) && value !== null && value !== undefined) {
      patch[key] = value;
      facts++;
    }
  };
  fill("shortName", existing.shortName, f.shortName);
  fill("organizingBody", existing.organizingBody, f.organizingBody === "Unknown" ? null : f.organizingBody);
  fill("category", existing.category, f.category);
  fill("applyUrl", existing.applyUrl, f.applyUrl);
  fill("notificationUrl", existing.notificationUrl, f.notificationUrl);
  fill("vacancies", existing.vacancies, f.vacancies);
  fill("notificationDate", existing.notificationDate, f.notificationDate);
  fill("startDate", existing.startDate, f.startDate);
  fill("endDate", existing.endDate, f.endDate);
  fill("admitCardDate", existing.admitCardDate, f.admitCardDate);
  fill("examDate", existing.examDate, f.examDate);
  fill("resultDate", existing.resultDate, f.resultDate);
  if (f.officialBody && existing.organizingBody !== f.officialBody.organizingBody) {
    patch.organizingBody = f.officialBody.organizingBody;
    patch.department = f.officialBody.department;
  }
  return { patch, facts, moved: fix.misplaced };
}

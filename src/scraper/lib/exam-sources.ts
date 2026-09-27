/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Official exam sources — parsers + status rule (pure, no DB/network)
//
//  UPSC  https://www.upsc.gov.in/examinations/active-exams  (list; the
//        bare upsc.gov.in host redirects to the home page, so use www)
//        → one page per exam, in one of two shapes:
//          a) notification stage: a table with "Date of Notification",
//             "Date of Commencement of Examination", "Last Date for
//             Receipt of Applications" and the notice PDF;
//          b) later stages: a "Document Type / Document / Date of Upload"
//             table (e-Admit Card, Time Table, Question Paper, Result …).
//  SSC   https://ssc.gov.in/api/admin/5.1/liveExams  (the JSON the
//        ssc.gov.in site itself loads: exams taking applications now,
//        with application start/end dates, fee and age limits).
//
// Status rule (officialExamStatus): an exam is "APPLICATIONS_OPEN" only
// when the source gives BOTH an opening date (application start or
// notification date) and a closing date, and today is between them.
// Nothing is guessed from a title or from a typical calendar.
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";

export const UPSC_BASE = "https://www.upsc.gov.in";
export const UPSC_ACTIVE_EXAMS_URL = `${UPSC_BASE}/examinations/active-exams`;
export const SSC_HOME = "https://ssc.gov.in";
export const SSC_LIVE_EXAMS_URL = `${SSC_HOME}/api/admin/5.1/liveExams`;

export interface OfficialExam {
  body: "UPSC" | "SSC";
  department: string;
  title: string;
  /** Stable identity used for upserts: "<BODY> <official title>". */
  shortName: string;
  /** The official page for this exam (stored as applyUrl). */
  pageUrl: string;
  /** Official notice PDF, when the source links one. */
  notificationUrl: string | null;
  notificationDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  examDate: Date | null;
  admitCardDate: Date | null;
  resultDate: Date | null;
  /** The source shows the exam has been held (question paper / answer key published). */
  examHeld: boolean;
  /** The source has published a result. */
  resultOut: boolean;
  ageLimit: string | null;
  applicationFee: string | null;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Every four-digit year (1990–2099) in a title. */
export function yearsInTitle(title: string): number[] {
  return (title.match(/\b(19[9]\d|20\d\d)\b/g) ?? []).map(Number);
}

/** "2026-10-06T18:00:00+05:30" or "2026-09-10" (read as IST midnight) → Date, or null. */
export function parseOfficialDate(s: unknown): Date | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const v = s.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00+05:30` : v;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ── UPSC ──────────────────────────────────────────────────────

/** Active-exams list page → [{ title, url }] (absolute official URLs). */
export function parseUpscActiveList(html: string): Array<{ title: string; url: string }> {
  const $ = cheerio.load(html);
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  $(".view-content .views-field-field-exam-name a").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const title = clean($(a).text());
    if (!href || !title || !/^\/examinations\//.test(href)) return;
    const url = `${UPSC_BASE}${href}`;
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ title, url });
  });
  return out;
}

/** One UPSC exam page → the official facts on it. */
export function parseUpscExamPage(html: string, pageUrl: string, fallbackTitle: string): OfficialExam {
  const $ = cheerio.load(html);
  const title = clean($("h1.heading1").first().text()) || fallbackTitle;
  const exam: OfficialExam = {
    body: "UPSC",
    department: "Union Public Service Commission",
    title,
    shortName: `UPSC ${title}`,
    pageUrl,
    notificationUrl: null,
    notificationDate: null,
    startDate: null,
    endDate: null,
    examDate: null,
    admitCardDate: null,
    resultDate: null,
    examHeld: false,
    resultOut: false,
    ageLimit: null,
    applicationFee: null,
  };

  const dateIn = (el: Parameters<typeof $>[0]) =>
    parseOfficialDate($(el).find(".date-display-single").first().attr("content"));

  // a) Notification-stage table: label cell (th) + value cell (th or td).
  $("table.views-table tr").each((_, tr) => {
    const cells = $(tr).children("th, td");
    if (cells.length < 2) return;
    const label = clean($(cells[0]).text()).toLowerCase();
    const value = cells[1];
    if (label.startsWith("date of notification")) exam.notificationDate = dateIn(value);
    else if (label.startsWith("date of commencement of examination")) exam.examDate = dateIn(value);
    else if (label.startsWith("last date for receipt of applications")) exam.endDate = dateIn(value);
    else if (label.startsWith("download notification")) {
      const pdf = $(value).find("a[href$='.pdf']").first().attr("href");
      if (pdf) exam.notificationUrl = new URL(pdf, UPSC_BASE).toString();
    }
  });

  // b) Documents table: what has been published so far.
  $("td.views-field-field-exam-doc-type").each((_, td) => {
    const kind = clean($(td).text()).toLowerCase();
    const row = $(td).closest("tr");
    const uploaded = parseOfficialDate(row.find(".date-display-single").first().attr("content"));
    const pdf = row.find("a[href$='.pdf']").first().attr("href");
    if (/admit card/.test(kind)) {
      exam.admitCardDate = exam.admitCardDate ?? uploaded;
    } else if (/question paper|answer key/.test(kind)) {
      exam.examHeld = true;
    } else if (/result|marks/.test(kind)) {
      exam.resultOut = true;
      exam.examHeld = true;
      if (uploaded && (!exam.resultDate || uploaded > exam.resultDate)) exam.resultDate = uploaded;
    } else if (/\bnotification\b/.test(kind) && pdf && !exam.notificationUrl) {
      // Only the exam notification itself — an "Important Notice" is something else.
      exam.notificationUrl = new URL(pdf, UPSC_BASE).toString();
    }
  });

  return exam;
}

// ── SSC ───────────────────────────────────────────────────────

interface SscLiveExam {
  examName?: unknown;
  examYear?: unknown;
  applicationStartDate?: unknown;
  applicationEndDate?: unknown;
  examDate?: unknown;
  admitCardStartDate?: unknown;
  fee?: unknown;
  minAge?: unknown;
  maxAge?: unknown;
  isActive?: unknown;
  examNames?: { examName?: unknown };
  attachments?: Array<{ path?: unknown; url?: unknown; fileName?: unknown }>;
}

/** SSC liveExams JSON → exams taking applications (per SSC's own site). */
export function parseSscLiveExams(json: unknown): OfficialExam[] {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const out: OfficialExam[] = [];
  for (const raw of data as SscLiveExam[]) {
    if (raw.isActive === false) continue;
    const titleRaw = typeof raw.examNames?.examName === "string" ? raw.examNames.examName : raw.examName;
    if (typeof titleRaw !== "string" || !titleRaw.trim()) continue;
    const title = clean(titleRaw);
    const minAge = typeof raw.minAge === "number" ? raw.minAge : null;
    const maxAge = typeof raw.maxAge === "number" ? raw.maxAge : null;
    const fee = typeof raw.fee === "string" || typeof raw.fee === "number" ? String(raw.fee).trim() : "";
    const pdf = (raw.attachments ?? [])
      .map((a) => (typeof a.url === "string" ? a.url : typeof a.path === "string" ? a.path : ""))
      .find((p) => /\.pdf($|\?)/i.test(p));
    out.push({
      body: "SSC",
      department: "Staff Selection Commission",
      title,
      shortName: `SSC ${title}`,
      pageUrl: SSC_HOME,
      notificationUrl: pdf ? new URL(pdf, SSC_HOME).toString() : null,
      notificationDate: null,
      startDate: parseOfficialDate(raw.applicationStartDate),
      endDate: parseOfficialDate(raw.applicationEndDate),
      examDate: parseOfficialDate(raw.examDate),
      admitCardDate: parseOfficialDate(raw.admitCardStartDate),
      resultDate: null,
      examHeld: false,
      resultOut: false,
      ageLimit: minAge !== null && maxAge !== null ? `${minAge}–${maxAge} years` : null,
      applicationFee: /^\d+$/.test(fee) ? `₹${fee}` : null,
    });
  }
  return out;
}

// ── Status ────────────────────────────────────────────────────

/**
 * The status the official facts support, or null when they support none.
 * Uses the new status words (see exam-sync.ts): NOTIFICATION_OUT,
 * APPLICATIONS_OPEN, APPLICATIONS_CLOSED, ADMIT_CARD_OUT, EXAM_SCHEDULED,
 * RESULT_PENDING, RESULT_OUT.
 */
export function officialExamStatus(e: OfficialExam, nowMs: number): string | null {
  const t = (d: Date | null) => (d ? d.getTime() : null);
  const opens = t(e.startDate) ?? t(e.notificationDate);
  const closes = t(e.endDate);
  const exam = t(e.examDate);
  const admit = t(e.admitCardDate);

  if (e.resultOut) return "RESULT_OUT";
  if (e.examHeld || (exam !== null && exam <= nowMs)) return "RESULT_PENDING";
  if (opens !== null && closes !== null && opens <= nowMs && nowMs <= closes) return "APPLICATIONS_OPEN";
  if (admit !== null && admit <= nowMs) return "ADMIT_CARD_OUT";
  if (closes !== null && closes < nowMs) return exam !== null ? "EXAM_SCHEDULED" : "APPLICATIONS_CLOSED";
  if (opens !== null || e.notificationUrl) return "NOTIFICATION_OUT";
  return null;
}

/** Skip exams whose newest year in the title is older than last year. */
export function isCurrentExamTitle(title: string, now: Date): boolean {
  const years = yearsInTitle(title);
  if (years.length === 0) return true;
  return Math.max(...years) >= now.getUTCFullYear() - 1;
}

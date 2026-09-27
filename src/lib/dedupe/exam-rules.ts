/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Government exams — who may run one, where a row lives, which copy wins
// (pure, no DB, unit-tested in tests/dedupe-exams.test.ts)
//
// Rules (Sept 2026):
//  1. Only exams run by a government or statutory body are stored:
//     UPSC, SSC, NTA, IBPS, RRB, state PSCs and subordinate-service boards,
//     school / pre-university boards, police and teacher recruitment boards,
//     municipal corporations, courts, PSUs … Private universities,
//     consortiums (COMEDK) and companies are not government exams.
//     classifyExamBody() is the ONE place this rule lives.
//  2. A NATIONAL exam is stored once (districtId null, stateId null); a
//     STATE exam once per state (stateId set, districtId null); only a
//     DISTRICT exam (one city's corporation, one district court) carries a
//     districtId. examPlacement() gives those columns.
//  3. Rows answering to the same canonical exam key (src/lib/dedupe/keys.ts)
//     in the same place are one exam: the best row is kept, the others fill
//     its gaps, the status is the furthest along (never downgrades).
// ═══════════════════════════════════════════════════════════
import {
  EXAM_STATUS_RANK,
  KNOWN_EXAM_BODIES,
  canonicalExamStatus,
  examBody,
  examKeys,
  foldText,
  type CanonicalExamStatus,
} from "./keys";

// ── 1. Government or not ────────────────────────────────────

/** Government / statutory bodies, their acronyms and government posts. Matched on folded text. */
const GOVERNMENT_RE = new RegExp(
  "\\b(" +
    [
      // central commissions, agencies, boards, banks, PSUs, forces
      "upsc", "ssc", "nta", "ibps", "rrb", "rrc", "sbi", "rbi", "nabard", "sidbi", "lic", "epfo", "esic",
      "isro", "drdo", "barc", "bsf", "crpf", "cisf", "itbp", "ssb", "fci", "cbse", "nios", "kvs", "nvs",
      "ctet", "nbems", "nbe", "aiims", "icmr", "csir", "ugc", "iit", "nit", "sgpgims", "tangedco", "mhada",
      "agniveer", "afcat", "cuet", "neet", "jee",
      // state commissions and boards
      "kea", "kseab", "kseeb", "dsssb", "hssc", "ossc", "ossb", "bssc", "upsssc", "uksssc", "jssc",
      "vyapam", "mpesb", "rsmssb", "gsssb", "tnusrb", "tslprb", "tsprb", "trb", "wbjeeb", "wbssc",
      "wbbpe", "wbbse", "wbchse", "msbshse", "kpsc", "keralapsc", "mpsc", "tnpsc", "tspsc", "tgpsc",
      "appsc", "uppsc", "wbpsc", "bpsc", "rpsc", "gpsc", "opsc", "mppsc", "hpsc", "hppsc", "ppsc", "jpsc",
      "cgpsc", "ukpsc", "apsc", "tet", "puc",
      // city corporations
      "bmc", "bbmp", "gcc", "kmc", "ghmc", "mcd", "ndmc", "pmc", "lmc", "gbmc",
      // phrases
      "public service commission", "service commission", "selection commission", "selection board",
      "subordinate services", "recruitment board", "recruitment cell", "police recruitment",
      "uniformed services", "examinations? authority", "examinations? board", "testing agency",
      "board of (?:secondary|higher secondary|intermediate|school|pre university)", "secondary education",
      "higher secondary", "pre university", "school education", "council of higher education",
      "high court", "district court", "district judiciary", "corporation", "jal board",
      "electricity board", "development authority", "metro rail", "institute of medical sciences",
      "indian institute of", "national institute of", "kendriya vidyalaya", "navodaya", "sainik",
      "government", "ministry", "department", "directorate", "commissionerate", "panchayat", "zilla",
      "police", "constable", "army", "navy", "air force", "coast guard", "defence", "railways?",
      "india post", "postal", "state bank", "reserve bank", "talathi", "patwari", "village accountant",
      "gram sevak", "anganwadi", "teachers? recruitment", "teachers? eligibility",
    ].join("|") +
    ")\\b",
);
/** Clear signs of a private organiser. */
const PRIVATE_RE = /\b(pvt|private|consortium|comedk|coaching|llp)\b/;
/** University / college exams (semester results, admission tests) — not government exams. */
const ACADEMIC_RE = /\b(universit(?:y|ies)|college|colleges|admission tests?|semester)\b/;

export type ExamBodyClass = "government" | "non-government" | "unknown";

function neutralise(text: string): string {
  return text
    .replace(/\bcommon university entrance test\b/g, "cuet")
    .replace(/\buniversity grants commission\b/g, "ugc")
    .replace(/\bcentral universities?\b/g, "central university government");
}

function classifyText(text: string): ExamBodyClass {
  const t = neutralise(foldText(text));
  if (!t || t === "unknown") return "unknown";
  if (PRIVATE_RE.test(t)) return "non-government";
  if (GOVERNMENT_RE.test(t)) return "government";
  if (ACADEMIC_RE.test(t)) return "non-government";
  return "unknown";
}

/**
 * Is this exam run by a government or statutory body? The organising body
 * decides when it is known; otherwise the exam's own name.
 *   "government"      → may be stored and shown
 *   "non-government"  → never stored; hidden if an old row exists
 *   "unknown"         → the sync does not store it (rule 1 needs a known body)
 */
export function classifyExamBody(e: { organizingBody?: string | null; title?: string | null; shortName?: string | null }): ExamBodyClass {
  const byBody = classifyText(e.organizingBody ?? "");
  if (byBody !== "unknown") return byBody;
  return classifyText(`${e.shortName ?? ""} ${e.title ?? ""}`);
}

/** True only for a known government / statutory organiser. */
export function isGovernmentExam(e: { organizingBody?: string | null; title?: string | null; shortName?: string | null }): boolean {
  return classifyExamBody(e) === "government";
}

// ── 2. Where a row lives ────────────────────────────────────

export type ExamScope = "NATIONAL" | "STATE" | "DISTRICT";

export interface ExamPlacement {
  level: "national" | "state" | "district";
  scope: ExamScope;
  stateId: string | null;
  districtId: string | null;
}

/** The columns a row of this scope must carry. */
export function examPlacement(scope: ExamScope, stateId: string | null, districtId: string | null): ExamPlacement {
  if (scope === "NATIONAL") return { level: "national", scope, stateId: null, districtId: null };
  if (scope === "STATE") return { level: "state", scope, stateId, districtId: null };
  return { level: "district", scope, stateId, districtId };
}

export interface ExamLocation {
  level: string | null;
  scope: string | null;
  stateId: string | null;
  districtId: string | null;
}

/**
 * What a stored row really is. `level` decides (it is what the pages have
 * always read): "national" → NATIONAL, "district" → DISTRICT, "state" →
 * STATE when it names a state. Old seed rows carry level "state" with the
 * column default scope "NATIONAL" — those are state exams.
 */
export function storedExamScope(r: ExamLocation): ExamScope {
  const level = (r.level ?? "").toLowerCase();
  const scope = (r.scope ?? "").toUpperCase();
  if (level === "national") return "NATIONAL";
  if (level === "district") return r.districtId ? "DISTRICT" : r.stateId ? "STATE" : "NATIONAL";
  if (level === "state") return r.stateId ? "STATE" : "NATIONAL";
  if (scope === "DISTRICT" && r.districtId) return "DISTRICT";
  if (scope === "STATE" && r.stateId) return "STATE";
  return "NATIONAL";
}

/** Rows in the same bucket are compared with each other: one national list, one per state, one per district. */
export function examBucket(r: ExamLocation): string {
  const scope = storedExamScope(r);
  if (scope === "NATIONAL") return "N";
  if (scope === "STATE") return `S:${r.stateId}`;
  return `D:${r.districtId}`;
}

/** The placement a stored row should have, and whether it differs from what is stored. */
export function correctPlacement(r: ExamLocation): { placement: ExamPlacement; misplaced: boolean } {
  const placement = examPlacement(storedExamScope(r), r.stateId, r.districtId);
  const misplaced =
    r.level !== placement.level ||
    (r.scope ?? "") !== placement.scope ||
    (r.stateId ?? null) !== placement.stateId ||
    (r.districtId ?? null) !== placement.districtId;
  return { placement, misplaced };
}

// ── 3. Which copy wins, and what it inherits ────────────────

export interface ExamRow extends ExamLocation {
  id: string;
  title: string;
  shortName: string | null;
  department: string;
  organizingBody: string | null;
  category: string | null;
  status: string;
  vacancies: number | null;
  qualification: string | null;
  ageLimit: string | null;
  applicationFee: string | null;
  selectionProcess: string | null;
  payScale: string | null;
  applyUrl: string | null;
  notificationUrl: string | null;
  syllabusUrl: string | null;
  announcedDate: Date | null;
  notificationDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  admitCardDate: Date | null;
  examDate: Date | null;
  resultDate: Date | null;
  sourceUrls: unknown;
  lastVerifiedAt: Date | null;
  needsVerification: boolean;
  updatedAt: Date;
}

/** Fields filled on the kept row from the others when it has none (never overwritten). */
export const EXAM_FILL_FIELDS = [
  "shortName", "organizingBody", "category", "vacancies", "qualification", "ageLimit", "applicationFee",
  "selectionProcess", "payScale", "applyUrl", "notificationUrl", "syllabusUrl", "announcedDate",
  "notificationDate", "startDate", "endDate", "admitCardDate", "examDate", "resultDate",
] as const satisfies ReadonlyArray<keyof ExamRow>;

const DATE_FIELDS = new Set(["announcedDate", "notificationDate", "startDate", "endDate", "admitCardDate", "examDate", "resultDate"]);

export function urlList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (typeof v === "string" && /^unknown$/i.test(v.trim()));

/** Higher = better row to keep: backed by a source, known body, more facts, more recently checked. */
export function examRowScore(r: ExamRow): number {
  let s = 0;
  if (urlList(r.sourceUrls).length > 0) s += 4;
  if (r.applyUrl || r.notificationUrl) s += 2;
  if (!isEmpty(r.organizingBody)) s += 2;
  for (const f of EXAM_FILL_FIELDS) if (!isEmpty(r[f])) s += 1;
  return s;
}

function compareRows(a: ExamRow, b: ExamRow): number {
  return (
    examRowScore(b) - examRowScore(a) ||
    (b.lastVerifiedAt?.getTime() ?? 0) - (a.lastVerifiedAt?.getTime() ?? 0) ||
    b.updatedAt.getTime() - a.updatedAt.getTime() ||
    Number(correctPlacement(a).misplaced) - Number(correctPlacement(b).misplaced) ||
    a.id.localeCompare(b.id)
  );
}

/** The row to keep from a group of the same exam. */
export function pickBestExam<T extends ExamRow>(rows: T[]): T {
  return [...rows].sort(compareRows)[0];
}

/** The furthest-along canonical status in a group (status never goes backwards). */
export function furthestStatus(rows: Array<Pick<ExamRow, "status" | "title">>): CanonicalExamStatus {
  let best: CanonicalExamStatus = "UNVERIFIED";
  for (const r of rows) {
    const s = canonicalExamStatus(r.status, r.title);
    if (EXAM_STATUS_RANK[s] > EXAM_STATUS_RANK[best]) best = s;
  }
  return best;
}

export interface ExamMergePlan {
  keepId: string;
  removeIds: string[];
  /** Column changes for the kept row (empty object = nothing to change). */
  patch: Record<string, unknown>;
  /** Facts the copies disagreed on (the kept row's value stays) — for the report. */
  conflicts: string[];
}

const show = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

/**
 * Merge a group of rows that are the same exam in the same place into one:
 * the best row stays (moved to its correct placement), empty fields are
 * filled from the others, source links are pooled, the status is the
 * furthest along, a well-known exam gets its official body (NEET UG → NTA).
 * A single row is "merged" too: that fixes its placement and status.
 */
export function planExamMerge(rows: ExamRow[]): ExamMergePlan {
  const sorted = [...rows].sort(compareRows);
  const keep = sorted[0];
  const others = sorted.slice(1);
  const patch: Record<string, unknown> = {};
  const conflicts: string[] = [];

  const { placement } = correctPlacement(keep);
  if (keep.level !== placement.level) patch.level = placement.level;
  if ((keep.scope ?? "") !== placement.scope) patch.scope = placement.scope;
  if ((keep.stateId ?? null) !== placement.stateId) patch.stateId = placement.stateId;
  if ((keep.districtId ?? null) !== placement.districtId) patch.districtId = placement.districtId;

  for (const f of EXAM_FILL_FIELDS) {
    const mine = keep[f];
    for (const o of others) {
      const theirs = o[f];
      if (isEmpty(theirs)) continue;
      if (isEmpty(mine) && !(f in patch)) {
        patch[f] = theirs;
      } else if (!isEmpty(mine) && DATE_FIELDS.has(f) && show(mine) !== show(theirs)) {
        conflicts.push(`${f}: kept ${show(mine)}, other copy ${show(theirs)}`);
      }
    }
  }

  const status = furthestStatus(sorted);
  if (keep.status !== status) patch.status = status;

  const urls = [...new Set(sorted.flatMap((r) => urlList(r.sourceUrls)))].slice(-10);
  if (urls.length !== urlList(keep.sourceUrls).length) patch.sourceUrls = urls;

  const latest = [...sorted].sort((a, b) => (b.lastVerifiedAt?.getTime() ?? 0) - (a.lastVerifiedAt?.getTime() ?? 0))[0];
  if (latest.lastVerifiedAt && latest.lastVerifiedAt.getTime() !== (keep.lastVerifiedAt?.getTime() ?? 0)) {
    patch.lastVerifiedAt = latest.lastVerifiedAt;
  }
  if (latest.lastVerifiedAt && latest.needsVerification !== keep.needsVerification) {
    patch.needsVerification = latest.needsVerification;
  }

  const body = examBody(keep);
  const official = KNOWN_EXAM_BODIES[body];
  const bodyNow = (patch.organizingBody as string | undefined) ?? keep.organizingBody;
  if (official && bodyNow !== official.organizingBody) {
    patch.organizingBody = official.organizingBody;
    if (keep.department !== official.department) patch.department = official.department;
  }

  return { keepId: keep.id, removeIds: others.map((r) => r.id), patch, conflicts: [...new Set(conflicts)] };
}

// ── Grouping (used by the read path and the guard) ──────────

/**
 * Group rows that are the same exam (union of shared canonical keys) — by
 * default only within the same bucket (national / one state / one district);
 * `acrossBuckets` also joins a national and a state row of the same exam
 * (a district page shows both lists together). Rows without a key stay alone.
 */
export function groupSameExams<T extends ExamRow>(rows: T[], opts: { acrossBuckets?: boolean } = {}): T[][] {
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const firstByKey = new Map<string, number>();
  rows.forEach((r, i) => {
    const bucket = opts.acrossBuckets ? "" : examBucket(r);
    for (const k of examKeys(r)) {
      const key = `${bucket}#${k}`;
      const j = firstByKey.get(key);
      if (j === undefined) firstByKey.set(key, i);
      else parent[find(i)] = find(j);
    }
  });
  const groups = new Map<number, T[]>();
  rows.forEach((r, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), r]);
  });
  return [...groups.values()];
}

/**
 * What a district page shows: its own district rows, its state's rows and
 * the national rows — one per exam (the best copy), never an exam from a
 * non-government organiser, statuses in the canonical words.
 */
export function examsForDisplay<T extends ExamRow>(rows: T[]): T[] {
  const shown: T[] = [];
  const government = rows.filter((r) => classifyExamBody(r) !== "non-government");
  for (const group of groupSameExams(government, { acrossBuckets: true })) {
    const best = pickBestExam(group);
    shown.push({ ...best, status: furthestStatus(group) });
  }
  return shown;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Duplicate guard — the backend removes its own duplicates
//
// Owner rule (Sept 2026): a duplicate on the site means the code that wrote
// it is wrong, and the backend must itself know how to remove duplicates.
// The writers now look up rows by canonical key before creating
// (src/lib/dedupe/keys.ts, match.ts, exam-rules.ts); this guard is the
// safety net that runs daily (/api/cron/dedupe-data) and in the one-time
// clean-up (scripts/dedupe-2026-09.ts).
//
// For every citizen-facing table:
//   EXACT duplicates (same canonical key in the same place) are resolved
//   automatically: the best row is kept (has a source, most facts filled,
//   most recently verified/updated), empty fields are filled from the
//   others, child rows move to it (InfraUpdate, SchoolResult,
//   SugarFactorySeason, news translations), and the others are deleted —
//   or set active=false where the table has an `active` flag the pages
//   read (Leader, LocalAlert, CitizenTip, LocalIndustry, FamousPersonality).
//   FUZZY candidates (similarity ≥ 0.85 in the same district, different
//   keys) are NEVER changed: each pair goes once to NewsActionQueue with
//   dataType "verify-duplicates" for a person to decide.
// GovernmentExam has its own pass (exam-rules.ts): copies of one exam
// become one national / state / district row with the best facts merged,
// statuses are rewritten in the canonical set. ElectionResult types are
// rewritten in the canonical set (LOK_SABHA, ASSEMBLY, …).
//
// Pure planning (planExactDuplicates, findFuzzyCandidates) is unit-tested
// in tests/dedupe-guard.test.ts; runDuplicateGuard() does the reads and
// writes and takes the Prisma client (or a transaction) as an argument.
// ═══════════════════════════════════════════════════════════
import type { PrismaClient } from "../../generated/prisma";
import {
  canonicalElectionType,
  electionResultKey,
  examKeys,
  foldText,
  nameKey,
  nameTokens,
  pinCode,
  similarity,
  urlKey,
} from "./keys";
import { classifyExamBody, examBucket, groupSameExams, planExamMerge } from "./exam-rules";

/** A Prisma client or an interactive-transaction client. */
export type Db = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export type Row = { id: string } & Record<string, unknown>;

// ── Small helpers ───────────────────────────────────────────

const str = (v: unknown): string => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));
const time = (v: unknown): number => (v instanceof Date ? v.getTime() : typeof v === "string" ? Date.parse(v) || 0 : 0);
const day = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : str(v).slice(0, 10));
const isBlank = (v: unknown): boolean =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "string" && /^unknown$/i.test(v.trim()));
const filled = (r: Row, fields: readonly string[]): number => fields.reduce((n, f) => n + (isBlank(r[f]) ? 0 : 1), 0);
/** 3 for a link / official domain, 1 for a named source, 0 for none. */
const sourceScore = (v: unknown): number => {
  const s = str(v).trim();
  if (!s) return 0;
  return /https?:\/\/|\b[\w-]+\.(gov|nic|org|com|in|net)\b/i.test(s) ? 3 : 1;
};
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Words that never identify a place on their own ("Town Police Station", "Government High School"). */
const GENERIC_WORDS = new Set([
  "police", "station", "town", "city", "rural", "urban", "traffic", "women", "north", "south", "east", "west",
  "circle", "office", "government", "high", "higher", "primary", "secondary", "school", "taluk", "district",
  "model", "public", "girls", "boys", "upper", "lower", "central", "main", "new", "old", "general",
  "hospital", "centre", "community", "health", "sub", "division", "extension", "urdu", "english", "kannada",
  "marathi", "hindi", "tamil", "telugu", "bengali", "medium", "junior", "senior", "college", "pu",
]);

/** nameKey, or null when the name is only generic words (such a name is compared fuzzily, never merged). */
export function placeNameKey(name: unknown): string | null {
  const tokens = nameTokens(str(name));
  if (!tokens.length || tokens.every((t) => GENERIC_WORDS.has(t))) return null;
  return tokens.join(" ");
}

// ── Table specs ─────────────────────────────────────────────

export interface ChildSpec {
  /** Prisma delegate of the child table. */
  delegate: string;
  /** Column pointing at the parent. */
  fk: string;
  /** Child rows equal on these columns are the same child: the kept parent's copy stays, the other is deleted. */
  sameBy: string[];
  /** Extra filter (ContentTranslation: entityType "news"). */
  where?: Record<string, unknown>;
}

export interface TableSpec {
  table: string;
  delegate: string;
  /** Columns loaded (id always). */
  columns: string[];
  /** Only these rows are compared (e.g. active ones). */
  where?: Record<string, unknown>;
  take?: number;
  /** Exact duplicate key; null = this row is never auto-merged. */
  key(r: Row): string | null;
  /** Higher = better row to keep. */
  score(r: Row): number;
  /** Newer = better when scores tie. */
  recency(r: Row): number;
  /** What happens to the other rows of an exact group. */
  resolve: "delete" | "deactivate";
  /** Columns copied onto the kept row when it has none. */
  fill?: string[];
  /** JSON string arrays pooled onto the kept row (sourceUrls). */
  mergeArrays?: string[];
  children?: ChildSpec[];
  /** Columns in other rows of the same table that point at a removed row (NewsItem.duplicateOf). */
  selfRefs?: string[];
  /** Fuzzy review: rows in the same bucket whose names are ≥ threshold alike. */
  fuzzy?: { bucket(r: Row): string | null; names(r: Row): string[]; threshold?: number };
  /**
   * Rows that fill the same slot (one election seat) but whose exact keys
   * differ (different winners) CONFLICT: never merged, sent for review.
   */
  conflictKey?(r: Row): string | null;
  /** Short human label for reports. */
  label(r: Row): string;
  /** Rewrite a column in its canonical spelling (grouped by old value). */
  canonicalColumn?: { column: string; to(value: string): string | null };
}

const byDistrict = (r: Row) => (r.districtId ? str(r.districtId) : null);
const electionSeat = (r: Row) =>
  electionResultKey({ districtId: str(r.districtId), year: Number(r.year), electionType: str(r.electionType), constituency: str(r.constituency) });

export const FUZZY_THRESHOLD = 0.85;

export const TABLE_SPECS: TableSpec[] = [
  {
    table: "ElectionResult",
    delegate: "electionResult",
    columns: ["districtId", "year", "electionType", "constituency", "winnerName", "winnerVotes", "runnerUpName", "runnerUpVotes", "totalVoters", "votesPolled", "turnoutPct", "margin", "source"],
    // Same seat AND same winner = duplicate. Same seat, different winner = conflict (a person decides).
    key: (r) => {
      const seat = electionSeat(r);
      const winner = nameKey(str(r.winnerName).replace(/\([^)]*\)/g, " "));
      return seat && winner ? `${seat}|${winner}` : null;
    },
    conflictKey: (r) => electionSeat(r),
    score: (r) =>
      sourceScore(r.source) +
      filled(r, ["runnerUpName", "runnerUpVotes", "totalVoters", "votesPolled", "turnoutPct", "margin"]) +
      (/\d/.test(str(r.constituency)) ? 1 : 0),
    recency: () => 0,
    resolve: "delete",
    fill: ["runnerUpName", "runnerUpParty", "runnerUpVotes", "totalVoters", "votesPolled", "turnoutPct", "margin"],
    label: (r) => `${r.year} ${r.electionType} ${r.constituency}: ${r.winnerName}`,
    canonicalColumn: { column: "electionType", to: (v) => canonicalElectionType(v) },
  },
  {
    table: "InfraProject",
    delegate: "infraProject",
    columns: [
      "districtId", "talukId", "name", "nameLocal", "shortName", "description", "category", "status", "scope", "budget", "fundsReleased",
      "progressPct", "contractor", "startDate", "expectedEnd", "lat", "lng", "source", "announcedBy", "announcedByRole", "party",
      "executingAgency", "keyPeople", "originalBudget", "revisedBudget", "announcedDate", "approvedDate", "tenderDate", "actualStartDate",
      "originalEndDate", "revisedEndDate", "completionDate", "sourceUrls", "lastNewsAt", "lastVerifiedAt", "verificationCount", "updatedAt",
    ],
    key: (r) => (r.districtId && nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}` : null),
    score: (r) =>
      sourceScore(r.source) + Math.min(5, arr(r.sourceUrls).length) + Math.min(3, Number(r.verificationCount ?? 0)) +
      filled(r, ["description", "budget", "progressPct", "startDate", "expectedEnd", "executingAgency", "announcedBy", "shortName"]),
    recency: (r) => Math.max(time(r.lastVerifiedAt), time(r.updatedAt)),
    resolve: "delete",
    fill: [
      "talukId", "nameLocal", "shortName", "description", "budget", "fundsReleased", "progressPct", "contractor", "startDate", "expectedEnd",
      "lat", "lng", "source", "announcedBy", "announcedByRole", "party", "executingAgency", "keyPeople", "originalBudget", "revisedBudget",
      "announcedDate", "approvedDate", "tenderDate", "actualStartDate", "originalEndDate", "revisedEndDate", "completionDate",
    ],
    mergeArrays: ["sourceUrls"],
    children: [{ delegate: "infraUpdate", fk: "projectId", sameBy: ["newsUrl", "updateType"] }],
    // Full names only: short names ("Namma Metro") are shared by different lines.
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "Scheme",
    delegate: "scheme",
    columns: ["districtId", "name", "nameLocal", "category", "amount", "beneficiaryCount", "eligibility", "applyUrl", "level", "source", "updatedAt"],
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId ?? "-"}|${nameKey(str(r.name))}|${foldText(str(r.level))}` : null),
    score: (r) => sourceScore(r.source) + sourceScore(r.applyUrl) + filled(r, ["nameLocal", "amount", "beneficiaryCount", "eligibility"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    fill: ["nameLocal", "amount", "beneficiaryCount", "eligibility", "applyUrl", "source"],
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "GovOffice",
    delegate: "govOffice",
    columns: ["districtId", "talukId", "name", "nameLocal", "department", "type", "address", "phone", "email", "website", "headName", "headDesignation", "latitude", "longitude", "updatedAt"],
    key: (r) => {
      const k = placeNameKey(r.name);
      return k ? `${r.districtId}|${k}|${pinCode(str(r.address)) ?? ""}` : null;
    },
    score: (r) => sourceScore(r.website) + filled(r, ["nameLocal", "phone", "email", "website", "headName", "latitude", "talukId"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    fill: ["talukId", "nameLocal", "phone", "email", "website", "headName", "headDesignation", "latitude", "longitude"],
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "PoliceStation",
    delegate: "policeStation",
    columns: ["districtId", "talukId", "name", "nameLocal", "address", "phone", "email", "sho", "lat", "lng"],
    key: (r) => {
      const k = placeNameKey(r.name);
      return k ? `${r.districtId}|${k}|${pinCode(str(r.address)) ?? ""}` : null;
    },
    score: (r) => filled(r, ["talukId", "nameLocal", "address", "phone", "email", "sho", "lat"]),
    recency: () => 0,
    resolve: "delete",
    fill: ["talukId", "nameLocal", "address", "phone", "email", "sho", "lat", "lng"],
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "School",
    delegate: "school",
    columns: ["districtId", "talukId", "name", "nameLocal", "type", "level", "udiseCode", "address", "students", "teachers", "latitude", "longitude", "updatedAt"],
    key: (r) => {
      if (!isBlank(r.udiseCode)) return `udise|${str(r.udiseCode).trim()}`;
      const k = placeNameKey(r.name);
      return k ? `${r.districtId}|${k}|${pinCode(str(r.address)) ?? str(r.talukId)}` : null;
    },
    score: (r) => filled(r, ["udiseCode", "talukId", "nameLocal", "address", "students", "teachers", "latitude"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    fill: ["talukId", "nameLocal", "udiseCode", "address", "latitude", "longitude"],
    children: [{ delegate: "schoolResult", fk: "schoolId", sameBy: ["year", "exam"] }],
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "LocalAlert",
    delegate: "localAlert",
    columns: ["districtId", "title", "type", "severity", "sourceUrl", "autoGenerated", "active", "startDate", "updatedAt"],
    where: { active: true },
    key: (r) => (nameKey(str(r.title)) ? `${r.districtId}|${nameKey(str(r.title))}` : null),
    score: (r) => sourceScore(r.sourceUrl) + (r.autoGenerated ? 0 : 2),
    recency: (r) => Math.max(time(r.updatedAt), time(r.startDate)),
    resolve: "deactivate",
    label: (r) => str(r.title),
  },
  {
    table: "CitizenTip",
    delegate: "citizenTip",
    columns: ["districtId", "title", "category", "titleLocal", "descriptionLocal", "priority", "active", "createdAt"],
    where: { active: true },
    key: (r) => (nameKey(str(r.title)) ? `${r.districtId}|${nameKey(str(r.title))}` : null),
    score: (r) => filled(r, ["titleLocal", "descriptionLocal"]) + Number(r.priority ?? 0) / 100,
    recency: (r) => time(r.createdAt),
    resolve: "deactivate",
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.title)] },
    label: (r) => str(r.title),
  },
  {
    table: "FamousPersonality",
    delegate: "famousPersonality",
    columns: ["districtId", "name", "nameLocal", "wikiUrl", "photoUrl", "birthYear", "bornInDistrict", "source", "active", "createdAt"],
    where: { active: true },
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}` : null),
    score: (r) => sourceScore(r.wikiUrl) + filled(r, ["nameLocal", "photoUrl", "birthYear"]) + (r.bornInDistrict ? 2 : 0),
    recency: (r) => time(r.createdAt),
    resolve: "deactivate",
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "LocalIndustry",
    delegate: "localIndustry",
    columns: ["districtId", "name", "nameLocal", "location", "latitude", "details", "source", "active", "updatedAt"],
    where: { active: true },
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}` : null),
    score: (r) => sourceScore(r.source) + filled(r, ["nameLocal", "location", "latitude", "details"]),
    recency: (r) => time(r.updatedAt),
    resolve: "deactivate",
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "GramPanchayat",
    delegate: "gramPanchayat",
    columns: ["districtId", "talukId", "villageId", "name", "nameLocal", "population", "households", "source", "updatedAt"],
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}|${str(r.talukId)}` : null),
    score: (r) => sourceScore(r.source) + filled(r, ["villageId", "nameLocal", "population", "households"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    fill: ["villageId", "nameLocal", "population", "households", "source"],
    fuzzy: { bucket: (r) => (r.districtId ? `${r.districtId}|${str(r.talukId)}` : null), names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "SugarFactory",
    delegate: "sugarFactory",
    columns: ["districtId", "name", "nameLocal", "type", "location", "latitude", "capacity", "phone", "active", "updatedAt"],
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}` : null),
    score: (r) => filled(r, ["nameLocal", "latitude", "capacity", "phone"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    fill: ["nameLocal", "latitude", "longitude", "capacity", "phone"],
    children: [{ delegate: "sugarFactorySeason", fk: "factoryId", sameBy: ["season"] }],
    fuzzy: { bucket: byDistrict, names: (r) => [str(r.name)] },
    label: (r) => str(r.name),
  },
  {
    table: "HousingScheme",
    delegate: "housingScheme",
    columns: ["districtId", "talukId", "schemeName", "fiscalYear", "source", "fundsAllocated", "updatedAt"],
    key: (r) => `${r.districtId}|${nameKey(str(r.schemeName))}|${str(r.fiscalYear)}|${str(r.talukId)}`,
    score: (r) => sourceScore(r.source) + filled(r, ["fundsAllocated"]),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    label: (r) => `${r.schemeName} ${r.fiscalYear}`,
  },
  {
    table: "Leader",
    delegate: "leader",
    columns: ["districtId", "name", "role", "tier", "party", "constituency", "phone", "email", "photoUrl", "source", "lastVerifiedAt", "active"],
    where: { active: true },
    key: (r) => (nameKey(str(r.name)) ? `${r.districtId}|${nameKey(str(r.name))}|${nameKey(str(r.role))}` : null),
    score: (r) => sourceScore(r.source) + filled(r, ["party", "constituency", "phone", "email", "photoUrl"]),
    recency: (r) => time(r.lastVerifiedAt),
    resolve: "deactivate",
    // Same office, names nearly alike ("D.K. Shivakumar" / "DK Shivakumar"). Same name in two offices is normal.
    fuzzy: { bucket: (r) => (r.districtId ? `${r.districtId}|${nameKey(str(r.role))}` : null), names: (r) => [str(r.name)] },
    label: (r) => `${r.name} (${r.role})`,
  },
  {
    table: "CropPrice",
    delegate: "cropPrice",
    columns: ["districtId", "commodity", "variety", "market", "date", "arrivalQty", "fetchedAt"],
    take: 50_000,
    key: (r) => `${r.districtId}|${nameKey(str(r.commodity))}|${nameKey(str(r.variety))}|${nameKey(str(r.market))}|${day(r.date)}`,
    score: (r) => filled(r, ["arrivalQty"]),
    recency: (r) => time(r.fetchedAt),
    resolve: "delete",
    label: (r) => `${r.commodity} ${r.market} ${day(r.date)}`,
  },
  {
    table: "DamReading",
    delegate: "damReading",
    columns: ["districtId", "damName", "recordedAt", "fetchedAt", "source"],
    take: 50_000,
    key: (r) => `${r.districtId}|${nameKey(str(r.damName))}|${day(r.recordedAt)}`,
    score: (r) => sourceScore(r.source),
    recency: (r) => Math.max(time(r.recordedAt), time(r.fetchedAt)),
    resolve: "delete",
    label: (r) => `${r.damName} ${day(r.recordedAt)}`,
  },
  {
    table: "RainfallHistory",
    delegate: "rainfallHistory",
    columns: ["districtId", "year", "month", "source"],
    key: (r) => `${r.districtId}|${r.year}|${r.month}`,
    score: (r) => sourceScore(r.source),
    recency: () => 0,
    resolve: "delete",
    label: (r) => `${r.year}-${r.month}`,
  },
  {
    table: "CrimeStat",
    delegate: "crimeStat",
    columns: ["districtId", "year", "category", "source"],
    key: (r) => `${r.districtId}|${r.year}|${nameKey(str(r.category))}`,
    score: (r) => sourceScore(r.source),
    recency: () => 0,
    resolve: "delete",
    label: (r) => `${r.year} ${r.category}`,
  },
  {
    table: "CourtStat",
    delegate: "courtStat",
    columns: ["districtId", "year", "courtName", "source", "avgDays"],
    key: (r) => `${r.districtId}|${r.year}|${nameKey(str(r.courtName))}`,
    score: (r) => sourceScore(r.source) + filled(r, ["avgDays"]),
    recency: () => 0,
    resolve: "delete",
    label: (r) => `${r.year} ${r.courtName}`,
  },
  {
    table: "BudgetEntry",
    delegate: "budgetEntry",
    columns: ["districtId", "fiscalYear", "sector", "source", "fetchedAt"],
    key: (r) => `${r.districtId}|${str(r.fiscalYear)}|${nameKey(str(r.sector))}`,
    score: (r) => sourceScore(r.source),
    recency: (r) => time(r.fetchedAt),
    resolve: "delete",
    label: (r) => `${r.fiscalYear} ${r.sector}`,
  },
  {
    table: "BudgetAllocation",
    delegate: "budgetAllocation",
    columns: ["districtId", "fiscalYear", "department", "scheme", "category", "month", "quarter", "source", "sourceUrl", "updatedAt"],
    key: (r) =>
      `${r.districtId}|${str(r.fiscalYear)}|${nameKey(str(r.department))}|${nameKey(str(r.scheme))}|${nameKey(str(r.category))}|${str(r.month)}|${str(r.quarter)}`,
    score: (r) => sourceScore(r.source) + sourceScore(r.sourceUrl),
    recency: (r) => time(r.updatedAt),
    resolve: "delete",
    label: (r) => `${r.fiscalYear} ${r.department} ${r.scheme ?? ""}`,
  },
  {
    table: "PopulationHistory",
    delegate: "populationHistory",
    columns: ["districtId", "year", "population", "source", "sexRatio", "literacy"],
    key: (r) => `${r.districtId}|${r.year}`,
    score: (r) => sourceScore(r.source) + filled(r, ["sexRatio", "literacy"]),
    recency: () => 0,
    resolve: "delete",
    label: (r) => `${r.year}: ${r.population}`,
  },
  {
    table: "NewsItem",
    delegate: "newsItem",
    columns: ["districtId", "url", "title", "fetchedAt", "classifiedAt", "targetModule", "duplicateOf"],
    take: 100_000,
    key: (r) => (urlKey(str(r.url)) ? `${r.districtId ?? "-"}|${urlKey(str(r.url))}` : null),
    // The original (not itself marked a copy, already classified, fetched first) stays.
    score: (r) => (r.duplicateOf ? 0 : 2) + (r.classifiedAt ? 1 : 0),
    recency: (r) => -time(r.fetchedAt),
    resolve: "delete",
    children: [{ delegate: "contentTranslation", fk: "entityId", sameBy: ["field", "locale"], where: { entityType: "news" } }],
    selfRefs: ["duplicateOf"],
    label: (r) => str(r.title).slice(0, 80),
  },
];

// ── Pure planning ───────────────────────────────────────────

export interface ExactPlan {
  table: string;
  key: string;
  keepId: string;
  removeIds: string[];
  /** Columns filled on the kept row. */
  fill: Record<string, unknown>;
  keepLabel: string;
  removeLabels: string[];
}

function compareForKeep(spec: TableSpec) {
  return (a: Row, b: Row) => spec.score(b) - spec.score(a) || spec.recency(b) - spec.recency(a) || b.id.localeCompare(a.id);
}

/** Exact-key groups of 2+ rows and what to do with each (best row kept, gaps filled). */
export function planExactDuplicates(rows: Row[], spec: TableSpec): ExactPlan[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = spec.key(r);
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const plans: ExactPlan[] = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(compareForKeep(spec));
    const keep = sorted[0];
    const others = sorted.slice(1);
    const fill: Record<string, unknown> = {};
    for (const f of spec.fill ?? []) {
      if (!isBlank(keep[f])) continue;
      const donor = others.find((o) => !isBlank(o[f]));
      if (donor) fill[f] = donor[f];
    }
    for (const f of spec.mergeArrays ?? []) {
      const merged = [...new Set(sorted.flatMap((r) => arr(r[f])))].slice(-20);
      if (merged.length !== arr(keep[f]).length) fill[f] = merged;
    }
    plans.push({
      table: spec.table,
      key,
      keepId: keep.id,
      removeIds: others.map((o) => o.id),
      fill,
      keepLabel: spec.label(keep),
      removeLabels: others.map((o) => spec.label(o)),
    });
  }
  return plans;
}

export interface FuzzyCandidate {
  /** "similar": names ≥ threshold alike; "conflict": same slot, different facts (election seat, two winners). */
  kind: "similar" | "conflict";
  table: string;
  districtId: string | null;
  ids: [string, string];
  names: [string, string];
  score: number;
  /** Stable id of the pair — a pair is queued for review once, ever. */
  fingerprint: string;
}

/** Largest bucket compared pairwise (a bigger one is skipped and reported). */
const MAX_BUCKET = 1500;

/**
 * Pairs in the same bucket (district) whose names are ≥ threshold alike but
 * whose exact keys differ. Rows being removed as exact duplicates are left out.
 */
export function findFuzzyCandidates(rows: Row[], spec: TableSpec, removed: ReadonlySet<string> = new Set()): FuzzyCandidate[] {
  if (!spec.fuzzy) return [];
  const threshold = spec.fuzzy.threshold ?? FUZZY_THRESHOLD;
  const buckets = new Map<string, Row[]>();
  for (const r of rows) {
    if (removed.has(r.id)) continue;
    const b = spec.fuzzy.bucket(r);
    if (!b) continue;
    buckets.set(b, [...(buckets.get(b) ?? []), r]);
  }
  const out: FuzzyCandidate[] = [];
  for (const group of buckets.values()) {
    if (group.length < 2 || group.length > MAX_BUCKET) continue;
    const names = group.map((r) => spec.fuzzy!.names(r).filter(Boolean));
    const keys = group.map((r) => spec.key(r));
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (keys[i] && keys[i] === keys[j]) continue; // exact — handled automatically
        let best = 0;
        for (const a of names[i]) for (const b of names[j]) best = Math.max(best, similarity(a, b));
        if (best < threshold) continue;
        const [x, y] = [group[i], group[j]].sort((p, q) => p.id.localeCompare(q.id));
        out.push({
          kind: "similar",
          table: spec.table,
          districtId: x.districtId ? str(x.districtId) : null,
          ids: [x.id, y.id],
          names: [spec.label(x), spec.label(y)],
          score: best,
          fingerprint: `${spec.table}:${x.id}+${y.id}`,
        });
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Rows that fill the same slot with different facts (conflictKey equal, exact keys different). */
export function findConflicts(rows: Row[], spec: TableSpec, removed: ReadonlySet<string> = new Set()): FuzzyCandidate[] {
  if (!spec.conflictKey) return [];
  const slots = new Map<string, Row[]>();
  for (const r of rows) {
    if (removed.has(r.id)) continue;
    const k = spec.conflictKey(r);
    if (k) slots.set(k, [...(slots.get(k) ?? []), r]);
  }
  const out: FuzzyCandidate[] = [];
  for (const group of slots.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (spec.key(group[i]) === spec.key(group[j])) continue;
        const [x, y] = [group[i], group[j]].sort((p, q) => p.id.localeCompare(q.id));
        out.push({
          kind: "conflict",
          table: spec.table,
          districtId: x.districtId ? str(x.districtId) : null,
          ids: [x.id, y.id],
          names: [spec.label(x), spec.label(y)],
          score: 1,
          fingerprint: `${spec.table}:conflict:${x.id}+${y.id}`,
        });
      }
    }
  }
  return out;
}

// ── The run ─────────────────────────────────────────────────

export interface TableReport {
  table: string;
  scanned: number;
  exactGroups: number;
  /** Rows deleted (or, for deactivate tables, set active=false). */
  resolved: number;
  resolution: "delete" | "deactivate" | "merge";
  keptRowsFilled: number;
  childrenMoved: number;
  childrenDropped: number;
  /** Rows whose spelling was rewritten (electionType, exam status/placement). */
  normalised: number;
  fuzzy: number;
  examples: string[];
}

export interface ExamReport {
  scanned: number;
  groupsMerged: number;
  rowsRemoved: number;
  rowsMoved: number;
  statusesNormalised: number;
  nonGovernment: Array<{ id: string; title: string; removed: boolean }>;
  unknownOrganiser: Array<{ id: string; title: string }>;
  conflicts: string[];
  /** Same exam stored under two scopes (e.g. national and one state) — for a person. */
  crossScope: string[];
  examples: string[];
  /** Verbose only: single rows whose status or placement is rewritten. */
  rewritten: string[];
}

export interface GuardReport {
  dryRun: boolean;
  tables: TableReport[];
  exams: ExamReport | null;
  fuzzy: FuzzyCandidate[];
  queued: number;
  queueSkippedExisting: number;
  errors: string[];
  budgetExhausted: boolean;
  /** Tables (or passes) not reached before the deadline. */
  notReached: string[];
}

export interface GuardOptions {
  /** Plan and report only; write nothing. */
  dryRun: boolean;
  /** Stop starting new tables after this time (ms since epoch). */
  deadlineMs?: number;
  /** Limit to these tables ("GovernmentExam" for the exam pass). */
  only?: string[];
  /** Queue fuzzy pairs to NewsActionQueue (default: when not a dry run). */
  queueFuzzy?: boolean;
  /** Most review items created per run. */
  maxQueue?: number;
  /** Also delete exams whose organiser is clearly not government (the one-time clean-up; the daily cron only reports them). */
  removeNonGovernmentExams?: boolean;
  /** List every exact group in the report (default: the first 5 per table). */
  verbose?: boolean;
  log?: (m: string) => void;
}

type Delegate = {
  findMany(args: object): Promise<Row[]>;
  update(args: object): Promise<unknown>;
  updateMany(args: object): Promise<{ count: number }>;
  deleteMany(args: object): Promise<{ count: number }>;
};
const delegateOf = (db: Db, name: string): Delegate => (db as unknown as Record<string, Delegate>)[name];

export const REVIEW_DATA_TYPE = "verify-duplicates";

async function moveChildren(db: Db, child: ChildSpec, keepId: string, removeIds: string[]): Promise<{ moved: number; dropped: number }> {
  const d = delegateOf(db, child.delegate);
  const select = Object.fromEntries(["id", ...child.sameBy].map((f) => [f, true]));
  const sig = (r: Row) => child.sameBy.map((f) => str(r[f] instanceof Date ? day(r[f]) : r[f])).join("|");
  const kept = await d.findMany({ where: { ...child.where, [child.fk]: keepId }, select });
  const seen = new Set(kept.map(sig));
  const theirs = await d.findMany({ where: { ...child.where, [child.fk]: { in: removeIds } }, select });
  const move: string[] = [];
  const drop: string[] = [];
  for (const r of theirs) {
    const s = sig(r);
    if (seen.has(s)) drop.push(r.id);
    else {
      seen.add(s);
      move.push(r.id);
    }
  }
  if (move.length) await d.updateMany({ where: { id: { in: move } }, data: { [child.fk]: keepId } });
  if (drop.length) await d.deleteMany({ where: { id: { in: drop } } });
  return { moved: move.length, dropped: drop.length };
}

async function runTable(db: Db, spec: TableSpec, opts: GuardOptions): Promise<{ report: TableReport; fuzzy: FuzzyCandidate[] }> {
  const d = delegateOf(db, spec.delegate);
  const select = Object.fromEntries(["id", ...spec.columns].map((c) => [c, true]));
  const rows = await d.findMany({ where: spec.where ?? {}, select, take: spec.take ?? 20_000 });
  const plans = planExactDuplicates(rows, spec);
  const removed = new Set(plans.flatMap((p) => p.removeIds));
  const fuzzy = [...findConflicts(rows, spec, removed), ...findFuzzyCandidates(rows, spec, removed)];

  // Column spellings to rewrite, grouped by old value (one updateMany each).
  const rewrites = new Map<string, string>();
  let normalised = 0;
  if (spec.canonicalColumn) {
    for (const r of rows) {
      if (removed.has(r.id)) continue;
      const old = str(r[spec.canonicalColumn.column]);
      const next = spec.canonicalColumn.to(old);
      if (next && next !== old) {
        rewrites.set(old, next);
        normalised++;
      }
    }
  }

  const report: TableReport = {
    table: spec.table,
    scanned: rows.length,
    exactGroups: plans.length,
    resolved: removed.size,
    resolution: spec.resolve,
    keptRowsFilled: plans.filter((p) => Object.keys(p.fill).length > 0).length,
    childrenMoved: 0,
    childrenDropped: 0,
    normalised,
    fuzzy: fuzzy.length,
    examples: plans
      .slice(0, opts.verbose ? plans.length : 5)
      .map((p) => `keep "${p.keepLabel}" [${p.keepId}] ← ${p.removeLabels.map((l, i) => `"${l}" [${p.removeIds[i]}]`).join(", ")}${Object.keys(p.fill).length ? ` (fills ${Object.keys(p.fill).join(", ")})` : ""}`),
  };
  if (opts.dryRun) return { report, fuzzy };

  for (const p of plans) {
    for (const child of spec.children ?? []) {
      const r = await moveChildren(db, child, p.keepId, p.removeIds);
      report.childrenMoved += r.moved;
      report.childrenDropped += r.dropped;
    }
    for (const col of spec.selfRefs ?? []) {
      await d.updateMany({ where: { [col]: { in: p.removeIds } }, data: { [col]: p.keepId } });
      // The kept row never points at itself.
      await d.updateMany({ where: { id: p.keepId, [col]: p.keepId }, data: { [col]: null } });
    }
    if (Object.keys(p.fill).length) await d.update({ where: { id: p.keepId }, data: p.fill });
    if (spec.resolve === "delete") await d.deleteMany({ where: { id: { in: p.removeIds } } });
    else await d.updateMany({ where: { id: { in: p.removeIds } }, data: { active: false } });
  }
  for (const [from, to] of rewrites) {
    await d.updateMany({ where: { [spec.canonicalColumn!.column]: from }, data: { [spec.canonicalColumn!.column]: to } });
  }
  return { report, fuzzy };
}

async function runExams(db: Db, opts: GuardOptions): Promise<ExamReport> {
  const rows = await db.governmentExam.findMany({ take: 20_000 });
  const report: ExamReport = {
    scanned: rows.length,
    groupsMerged: 0,
    rowsRemoved: 0,
    rowsMoved: 0,
    statusesNormalised: 0,
    nonGovernment: [],
    unknownOrganiser: [],
    conflicts: [],
    crossScope: [],
    examples: [],
    rewritten: [],
  };
  const nonGov = new Set<string>();
  for (const r of rows) {
    const c = classifyExamBody(r);
    if (c === "non-government") {
      nonGov.add(r.id);
      report.nonGovernment.push({ id: r.id, title: r.title, removed: !!opts.removeNonGovernmentExams });
    } else if (c === "unknown") report.unknownOrganiser.push({ id: r.id, title: r.title });
  }
  const considered = opts.removeNonGovernmentExams ? rows.filter((r) => !nonGov.has(r.id)) : rows;

  const plans = groupSameExams(considered).map(planExamMerge);
  const keptIds = new Set<string>();
  for (const plan of plans) {
    keptIds.add(plan.keepId);
    const keep = considered.find((r) => r.id === plan.keepId)!;
    if (plan.removeIds.length) {
      report.groupsMerged++;
      report.rowsRemoved += plan.removeIds.length;
      if (opts.verbose || report.examples.length < 12) {
        const place = String(plan.patch.level ?? keep.level);
        const changes = Object.keys(plan.patch).filter((k) => !["level", "scope", "stateId", "districtId"].includes(k));
        report.examples.push(
          `keep "${keep.title}" [${keep.id}] as the one ${place} row, remove ${plan.removeIds.length} ${plan.removeIds.length === 1 ? "copy" : "copies"}` +
            (changes.length ? `; sets ${changes.map((k) => (k === "status" ? `status=${String(plan.patch.status)}` : k)).join(", ")}` : ""),
        );
      }
    }
    if (["districtId", "stateId", "level", "scope"].some((k) => k in plan.patch)) report.rowsMoved++;
    if ("status" in plan.patch) report.statusesNormalised++;
    if (opts.verbose && !plan.removeIds.length && Object.keys(plan.patch).length) {
      const parts = Object.entries(plan.patch).map(([k, v]) => `${k}: ${String((keep as Record<string, unknown>)[k] ?? "∅")} → ${v === null ? "∅" : String(v)}`);
      report.rewritten.push(`"${keep.title}" [${keep.id}] ${parts.join("; ")}`);
    }
    report.conflicts.push(...plan.conflicts.map((c) => `${keep.title}: ${c}`));
  }

  // The same exam kept under two scopes (after merging) — a person decides which is right.
  const scopesByKey = new Map<string, Set<string>>();
  for (const r of considered) {
    if (!keptIds.has(r.id)) continue;
    for (const k of examKeys(r)) scopesByKey.set(k, new Set([...(scopesByKey.get(k) ?? []), examBucket(r)]));
  }
  for (const [k, scopes] of scopesByKey) if (scopes.size > 1) report.crossScope.push(`${k} in ${[...scopes].join(", ")}`);

  if (opts.dryRun) return report;
  for (const plan of plans) {
    if (Object.keys(plan.patch).length) {
      await db.governmentExam.update({ where: { id: plan.keepId }, data: plan.patch });
    }
    if (plan.removeIds.length) await db.governmentExam.deleteMany({ where: { id: { in: plan.removeIds } } });
  }
  if (opts.removeNonGovernmentExams && nonGov.size) {
    await db.governmentExam.deleteMany({ where: { id: { in: [...nonGov] } } });
  }
  return report;
}

async function queueFuzzy(db: Db, candidates: FuzzyCandidate[], max: number): Promise<{ queued: number; existing: number }> {
  if (!candidates.length) return { queued: 0, existing: 0 };
  const prior = await db.newsActionQueue.findMany({
    where: { dataType: REVIEW_DATA_TYPE },
    select: { extractedData: true },
    take: 20_000,
  });
  const seen = new Set(
    prior.map((p) => (p.extractedData && typeof p.extractedData === "object" ? str((p.extractedData as Record<string, unknown>).fingerprint) : "")),
  );
  let queued = 0;
  let existing = 0;
  for (const c of candidates) {
    if (seen.has(c.fingerprint)) {
      existing++;
      continue;
    }
    if (!c.districtId || queued >= max) continue;
    await db.newsActionQueue.create({
      data: {
        districtId: c.districtId,
        dataType: REVIEW_DATA_TYPE,
        extractedData: {
          origin: "dedupe-guard",
          kind: c.kind,
          fingerprint: c.fingerprint,
          table: c.table,
          ids: c.ids,
          names: c.names,
          similarity: c.score,
          suggestion:
            c.kind === "conflict"
              ? "Two rows claim the same slot with different facts. Check the official source, correct or delete the wrong row in the admin content editor, then close this item."
              : "Same thing? Merge the two rows in the admin content editor (keep the one with the source). Not the same? Reject this item — it will not be raised again.",
        },
        sourceUrl: `internal:dedupe-guard/${c.table}`,
        headline: (c.kind === "conflict"
          ? `Conflicting ${c.table} rows for one slot: "${c.names[0]}" / "${c.names[1]}"`
          : `Possible duplicate ${c.table}: "${c.names[0]}" / "${c.names[1]}" (${Math.round(c.score * 100)}% alike)`
        ).slice(0, 300),
        confidence: c.score,
        status: "pending",
      },
    });
    seen.add(c.fingerprint);
    queued++;
  }
  return { queued, existing };
}

/**
 * Run the guard over every table (or `only`). Exact duplicates are resolved
 * (unless dryRun), fuzzy pairs are queued once for review. Never throws for
 * one table: the error is reported and the next table runs.
 */
export async function runDuplicateGuard(db: Db, opts: GuardOptions): Promise<GuardReport> {
  const log = opts.log ?? (() => {});
  const wanted = (t: string) => !opts.only?.length || opts.only.includes(t);
  const out: GuardReport = {
    dryRun: opts.dryRun,
    tables: [],
    exams: null,
    fuzzy: [],
    queued: 0,
    queueSkippedExisting: 0,
    errors: [],
    budgetExhausted: false,
    notReached: [],
  };
  const pastDeadline = () => opts.deadlineMs !== undefined && Date.now() > opts.deadlineMs;

  if (wanted("GovernmentExam")) {
    try {
      out.exams = await runExams(db, opts);
      log(`GovernmentExam: ${out.exams.groupsMerged} exams merged (${out.exams.rowsRemoved} copies), ${out.exams.rowsMoved} moved, ${out.exams.statusesNormalised} statuses`);
    } catch (err) {
      out.errors.push(`GovernmentExam: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const spec of TABLE_SPECS) {
    if (!wanted(spec.table)) continue;
    if (pastDeadline()) {
      out.budgetExhausted = true;
      out.notReached.push(spec.table);
      continue;
    }
    try {
      const { report, fuzzy } = await runTable(db, spec, opts);
      out.tables.push(report);
      out.fuzzy.push(...fuzzy);
      if (report.exactGroups || report.normalised || report.fuzzy) {
        log(`${spec.table}: ${report.exactGroups} exact groups (${report.resolved} rows ${spec.resolve === "delete" ? "deleted" : "deactivated"}), ${report.normalised} normalised, ${report.fuzzy} fuzzy`);
      }
    } catch (err) {
      out.errors.push(`${spec.table}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!opts.dryRun && (opts.queueFuzzy ?? true)) {
    try {
      const q = await queueFuzzy(db, out.fuzzy, opts.maxQueue ?? 50);
      out.queued = q.queued;
      out.queueSkippedExisting = q.existing;
    } catch (err) {
      out.errors.push(`review queue: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return out;
}

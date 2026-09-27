/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Dataset freshness — pure helpers shared by /api/data/freshness, the
//  StaleDataNotice at the top of a module page and the VerifyPanel at the
//  bottom. No database, no React: safe to unit test (tests/freshness.test.ts).
// ═══════════════════════════════════════════════════════════════════════
//
//  A district page shows one or more DATASETS (Dams & rivers: dam levels +
//  canal releases). Each dataset has:
//    dataDate     the date the data describes (reading time, publish date,
//                 start of the financial year, end of the calendar year)
//    lastChecked  when we last collected or edited it
//    rows         how many rows we hold for this district (0 = not collected)
//  and a rule (registry MODULE_FRESHNESS, or its own for secondary datasets).
//
//  Status:
//    current        newer than the rule's maxAgeHours
//    late           older — the page says "This data is N days old …"
//    unknown        rows exist but no date ("date not published by the source")
//    not_collected  nothing for this district (menus show "coming soon")
//    reference      guides and templates written by our team; never stale

import {
  MODULE_FRESHNESS,
  type CollectMethod,
  type FreshnessRule,
  type UpdateEvery,
} from "@/lib/constants/sidebar-modules";

export type DatasetStatus = "current" | "late" | "unknown" | "not_collected" | "reference";

/** How a dataset's period reads: "FY 2025-26", "2024", "Census 2011". */
export type PeriodKind = "fy" | "year" | "dataset";

/** One dataset on a district page, as returned by /api/data/freshness. */
export interface DatasetFreshness {
  /** Sidebar module slug the dataset belongs to. */
  module: string;
  /** Dataset key (message key `page_verify.dataset.<key>`). */
  key: string;
  /** The module's main dataset (drives the stale notice and the menus). */
  primary: boolean;
  rows: number;
  /** ISO date the data describes, or null when unknown. */
  dataDate: string | null;
  /** Period label shown instead of a date for yearly data ("2025-26", "2024", "Census 2011"). */
  period: string | null;
  periodKind: PeriodKind | null;
  /** ISO time we last collected or edited it, or null. */
  lastChecked: string | null;
  maxAgeHours: number | null;
  every: UpdateEvery;
  method: CollectMethod;
  /** Some figures are estimates (the source row says so). */
  estimate: boolean;
  status: DatasetStatus;
  ageDays: number | null;
  ageHours: number | null;
  /** Days past the expected maximum age (late only). */
  lateByDays: number | null;
}

const HOUR = 1;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

/**
 * Every dataset the freshness API reports, grouped by module, main dataset
 * first. Secondary datasets carry their own rule; main datasets use the
 * module's rule from the registry. Pages whose content does not depend on
 * one table ("What you can do": written guidance + news) have none.
 */
export const DATASETS: ReadonlyArray<{ key: string; module: string; rule?: FreshnessRule }> = [
  { key: "news", module: "news" },
  { key: "alerts", module: "alerts" },
  { key: "weather", module: "weather" },
  { key: "rainfall", module: "weather", rule: { maxAgeHours: 2 * YEAR, every: "yearly", method: "manual" } },
  { key: "rtiTemplates", module: "file-rti" },
  { key: "rti", module: "rti" },
  { key: "leaders", module: "leadership" },
  { key: "elections", module: "elections" },
  { key: "panchayats", module: "gram-panchayat" },
  { key: "courts", module: "courts" },
  { key: "crime", module: "police" },
  { key: "traffic", module: "police", rule: { maxAgeHours: 400 * DAY, every: "monthly", method: "manual" } },
  { key: "stations", module: "police", rule: { maxAgeHours: null, every: "onChange", method: "manual" } },
  { key: "budget", module: "finance" },
  { key: "projects", module: "infrastructure" },
  { key: "tenders", module: "tenders" },
  { key: "industries", module: "industries" },
  { key: "schemes", module: "schemes" },
  { key: "housing", module: "housing" },
  { key: "services", module: "services" },
  { key: "offices", module: "offices" },
  { key: "exams", module: "exams" },
  { key: "jjm", module: "jjm" },
  { key: "dams", module: "water" },
  { key: "canals", module: "water", rule: { maxAgeHours: 30 * DAY, every: "weekly", method: "manual" } },
  { key: "power", module: "power" },
  { key: "buses", module: "transport" },
  { key: "trains", module: "transport", rule: { maxAgeHours: YEAR, every: "onChange", method: "manual" } },
  { key: "health", module: "health" },
  { key: "schools", module: "schools" },
  { key: "mandi", module: "crops" },
  { key: "advice", module: "farm" },
  { key: "soil", module: "farm", rule: { maxAgeHours: 3 * YEAR, every: "yearly", method: "manual" } },
  { key: "census", module: "population" },
  { key: "famous", module: "famous-personalities" },
];

/** The five fast feeds the district bar summarises ("3 of 5 live feeds up to date"). */
export const LIVE_FEED_KEYS: readonly string[] = ["weather", "mandi", "dams", "news", "alerts"];

const FALLBACK_RULE: FreshnessRule = { maxAgeHours: null, every: "onChange", method: "manual" };

/** The rule for a dataset: its own, else its module's. */
export function ruleFor(key: string): FreshnessRule {
  const d = DATASETS.find((x) => x.key === key);
  if (!d) return FALLBACK_RULE;
  return d.rule ?? MODULE_FRESHNESS[d.module] ?? FALLBACK_RULE;
}

/** True when `key` is the first (main) dataset of its module. */
export function isPrimary(key: string): boolean {
  const d = DATASETS.find((x) => x.key === key);
  if (!d) return false;
  return DATASETS.find((x) => x.module === d.module)?.key === key;
}

/**
 * Start of an Indian financial year: "2025-26", "2025-2026" or "FY 2025-26"
 * → 1 April 2025 (UTC). null when the text has no year.
 */
export function fyStartDate(fy: string | null | undefined): Date | null {
  if (!fy) return null;
  const m = /(\d{4})/.exec(fy);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), 3, 1));
}

/** 31 December of a calendar year (UTC); null for a missing year. */
export function yearEndDate(year: number | null | undefined): Date | null {
  if (year === null || year === undefined || !Number.isFinite(year)) return null;
  return new Date(Date.UTC(year, 11, 31));
}

export interface Judgement {
  status: DatasetStatus;
  ageDays: number | null;
  ageHours: number | null;
  lateByDays: number | null;
}

/**
 * Decide a dataset's status.
 *
 * @param rows          rows we hold for this district
 * @param dataDate      the date the data describes (null = unknown)
 * @param rule          the dataset's freshness rule
 * @param notCollected  force "not collected" (e.g. tenders switched off for the district)
 */
export function judgeDataset({
  rows,
  dataDate,
  rule,
  notCollected = false,
  now = new Date(),
}: {
  rows: number;
  dataDate: Date | null;
  rule: FreshnessRule;
  notCollected?: boolean;
  now?: Date;
}): Judgement {
  if (notCollected || rows <= 0) return { status: "not_collected", ageDays: null, ageHours: null, lateByDays: null };
  const ageHours = dataDate ? Math.max(0, (now.getTime() - dataDate.getTime()) / 3_600_000) : null;
  const ageDays = ageHours === null ? null : Math.floor(ageHours / 24);
  if (rule.maxAgeHours === null) return { status: "reference", ageDays, ageHours, lateByDays: null };
  if (ageHours === null) return { status: "unknown", ageDays: null, ageHours: null, lateByDays: null };
  if (ageHours > rule.maxAgeHours) {
    return { status: "late", ageDays, ageHours, lateByDays: Math.max(1, Math.floor((ageHours - rule.maxAgeHours) / 24)) };
  }
  return { status: "current", ageDays, ageHours, lateByDays: null };
}

/** Live-feed summary for the district bar: how many of the fast feeds are current. */
export function liveFeedSummary(datasets: readonly DatasetFreshness[]): { current: number; total: number } {
  const feeds = datasets.filter((d) => LIVE_FEED_KEYS.includes(d.key) && d.status !== "not_collected");
  return { current: feeds.filter((d) => d.status === "current").length, total: feeds.length };
}

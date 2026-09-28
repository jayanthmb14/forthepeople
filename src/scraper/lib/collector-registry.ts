/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Registry of the v5.1 portal collectors (pure data, no I/O)
//
// The Sept 2026 audit asked for the "Where our data comes from" page and
// the freshness checks to be built from a code registry of collectors
// that actually run, instead of a static list of cadences. This lists
// the collectors added in v5.1 with everything those pages need: which
// module, which cron, how often, where the figures are stored, the
// source a reader can open, and which districts it can cover. Proper
// nouns only; every sentence around them comes from the dictionaries.
// Nothing at runtime reads it yet (only tests). tests/cron-schedule.test.ts
// keeps each schedule equal to vercel.json, the schedule that runs.
// ═══════════════════════════════════════════════════════════
import { GEPNIC_ORGS } from "./gepnic";
import { JJM_PUBLIC_URL, JJM_SOURCE } from "./jjm";
import { NREGA_PUBLIC_URL, NREGA_SOURCE } from "./nrega";
import { UDISE_PUBLIC_URL, UDISE_SOURCE } from "./udise";

export interface CollectorInfo {
  key: "jjm" | "schools" | "mgnrega" | "tenders";
  /** District module slug the figures belong to. */
  module: "jjm" | "schools" | "gram-panchayat" | "tenders";
  cronPath: string;
  /** The vercel.json schedule (UTC). */
  schedule: string;
  /** Where the figures live. */
  storage: "JJMStatus" | "Tender" | "redis:ftp:data:udise" | "redis:ftp:data:mgnrega";
  sourceName: string;
  sourceUrl: string;
  /** The source's own period: a day ("as on"), a school year, or live listings. */
  sourceDate: "as-on-day" | "school-year" | "listing";
  /** Consider the figures stale after this many minutes without a successful run. */
  expectedMaxAgeMinutes: number;
  /** Which districts it can cover (the collectors report the rest as not covered). */
  coverage: "rural-districts" | "all-districts" | "followed-bodies";
}

export const PORTAL_COLLECTORS: CollectorInfo[] = [
  {
    key: "jjm",
    module: "jjm",
    cronPath: "/api/cron/scrape-jjm",
    schedule: "15 4 * * *",
    storage: "JJMStatus",
    sourceName: JJM_SOURCE,
    sourceUrl: JJM_PUBLIC_URL,
    sourceDate: "as-on-day",
    expectedMaxAgeMinutes: 2 * 1440 + 120,
    coverage: "rural-districts",
  },
  {
    key: "schools",
    module: "schools",
    cronPath: "/api/cron/scrape-schools",
    schedule: "40 4 * * 2",
    storage: "redis:ftp:data:udise",
    sourceName: UDISE_SOURCE,
    sourceUrl: UDISE_PUBLIC_URL,
    sourceDate: "school-year",
    expectedMaxAgeMinutes: 15 * 1440,
    coverage: "all-districts",
  },
  {
    key: "mgnrega",
    module: "gram-panchayat",
    cronPath: "/api/cron/scrape-mgnrega",
    schedule: "50 4 * * *",
    storage: "redis:ftp:data:mgnrega",
    sourceName: NREGA_SOURCE,
    sourceUrl: NREGA_PUBLIC_URL,
    sourceDate: "as-on-day",
    expectedMaxAgeMinutes: 2 * 1440 + 120,
    coverage: "rural-districts",
  },
  {
    key: "tenders",
    module: "tenders",
    cronPath: "/api/cron/scrape-tenders",
    schedule: "15 */2 * * *",
    storage: "Tender",
    sourceName: "State e-procurement portals (NIC GePNIC)",
    sourceUrl: "https://mahatenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page",
    sourceDate: "listing",
    expectedMaxAgeMinutes: 8 * 60,
    coverage: "followed-bodies",
  },
];

/** Districts whose tenders are collected (a hand-checked list of bodies per district). */
export function tenderDistricts(): string[] {
  return Object.keys(GEPNIC_ORGS);
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  How each dataset really reaches the site — the one list the
//  "Where our data comes from" page reads.
// ═══════════════════════════════════════════════════════════════════════
//
//  Honesty rule: a dataset is `auto` ONLY when a cron in vercel.json
//  collects it (tests/dataset-collection.test.ts checks every `cron`
//  path). Everything else is said plainly: entered by hand from the
//  source's published pages and reports, picked up from news reports, or
//  a fixed publication such as the Census. The newest date and the row
//  count for a district come from GET /api/data/dataset-dates, never from
//  this file, so the page cannot claim data it does not have.
//
//  `maxAgeHours` is how old the newest data may be and still count as
//  current for that kind of data. Older → the page says "N days old; we
//  could not find newer data". Leave it out when the data only changes
//  on an event (an election, a new Census) and age is not a problem.
//
//  Update this file whenever vercel.json or a collector's coverage changes.

/** How the data reaches us. */
export type Collection =
  /** Our collector fetches it on a schedule (a cron in vercel.json). */
  | "auto"
  /** Found in news reports, then checked before it is shown. */
  | "news"
  /** Entered by hand from the source's pages and reports, checked from time to time. */
  | "hand"
  /** A fixed publication (Census, election results, encyclopaedia entries). */
  | "published";

/** What the date we show for this dataset means. */
export type DateKind =
  /** The source's own date for the reading (weather time, market day, news date). */
  | "reading"
  /** When we last entered or checked it. */
  | "checked"
  /** A period, not a day: a year, a fiscal year, a month, a Census round. */
  | "period"
  /** The source publishes no date. */
  | "none";

export interface DatasetInfo {
  /** Key in the dataset-dates API and the page's messages (datasets.<key>). */
  key: string;
  /** The district page it appears on (sidebar slug), if any. */
  slug: string | null;
  collection: Collection;
  /** vercel.json cron path, for `auto`. */
  cron?: string;
  /** How often our collector runs, for `auto` (message key under every.*). */
  every?: "30min" | "6h" | "12h" | "daily";
  /**
   * `auto` only for these districts (the collector covers no others);
   * every other district gets `fallback`.
   */
  autoDistricts?: readonly string[];
  fallback?: Collection;
  dateKind: DateKind;
  maxAgeHours?: number;
  /** The source's own website, when there is one page to send people to. */
  url?: string;
}

const DAY = 24;

/**
 * Districts whose dam levels the dams collector reads from the Karnataka
 * Water Resources Department portal (KARNATAKA_DISTRICT_DAMS in
 * src/scraper/jobs/dams.ts). Other districts' dam figures were entered by hand.
 */
export const AUTO_DAM_DISTRICTS = ["mandya", "mysuru", "bengaluru-urban"] as const;

/** Every dataset, in the order of the sidebar groups (docs/MODULE-MAP.md). */
export const DATASETS: readonly DatasetInfo[] = [
  // Start here
  { key: "news", slug: "news", collection: "auto", cron: "/api/cron/scrape-news", every: "daily", dateKind: "reading", maxAgeHours: 3 * DAY },
  { key: "alerts", slug: "alerts", collection: "news", dateKind: "checked" },
  { key: "weather", slug: "weather", collection: "auto", cron: "/api/cron/scrape-weather", every: "30min", dateKind: "reading", maxAgeHours: DAY, url: "https://openweathermap.org" },
  { key: "rainfall", slug: "weather", collection: "hand", dateKind: "period", maxAgeHours: 62 * DAY, url: "https://mausam.imd.gov.in" },
  // You can help
  { key: "rti", slug: "rti", collection: "hand", dateKind: "period" },
  // Who runs it
  { key: "leaders", slug: "leadership", collection: "hand", dateKind: "checked", maxAgeHours: 60 * DAY },
  { key: "elections", slug: "elections", collection: "published", dateKind: "period", url: "https://results.eci.gov.in" },
  { key: "panchayats", slug: "gram-panchayat", collection: "hand", dateKind: "checked", maxAgeHours: 365 * DAY, url: "https://egramswaraj.gov.in" },
  { key: "courts", slug: "courts", collection: "hand", dateKind: "period", url: "https://njdg.ecourts.gov.in" },
  { key: "police", slug: "police", collection: "hand", dateKind: "period", url: "https://ncrb.gov.in" },
  // Money & projects
  { key: "budget", slug: "finance", collection: "hand", dateKind: "period" },
  { key: "infrastructure", slug: "infrastructure", collection: "hand", dateKind: "checked", maxAgeHours: 60 * DAY },
  { key: "industries", slug: "industries", collection: "hand", dateKind: "checked", maxAgeHours: 365 * DAY },
  // Help for you
  { key: "schemes", slug: "schemes", collection: "hand", dateKind: "checked", maxAgeHours: 90 * DAY, url: "https://www.myscheme.gov.in" },
  { key: "housing", slug: "housing", collection: "hand", dateKind: "period", url: "https://pmayg.nic.in" },
  { key: "services", slug: "services", collection: "hand", dateKind: "checked", maxAgeHours: 180 * DAY },
  { key: "offices", slug: "offices", collection: "hand", dateKind: "checked", maxAgeHours: 90 * DAY },
  { key: "exams", slug: "exams", collection: "hand", dateKind: "checked", maxAgeHours: 30 * DAY },
  // Daily needs
  { key: "jjm", slug: "jjm", collection: "hand", dateKind: "checked", maxAgeHours: 180 * DAY, url: "https://ejalshakti.gov.in/jjmreport" },
  {
    key: "dams",
    slug: "water",
    collection: "auto",
    cron: "/api/cron/scrape-dams",
    every: "6h",
    autoDistricts: AUTO_DAM_DISTRICTS,
    fallback: "hand",
    dateKind: "reading",
    maxAgeHours: 3 * DAY,
  },
  { key: "power", slug: "power", collection: "hand", dateKind: "checked" },
  { key: "transport", slug: "transport", collection: "hand", dateKind: "none" },
  { key: "schools", slug: "schools", collection: "hand", dateKind: "checked", maxAgeHours: 400 * DAY, url: "https://udiseplus.gov.in" },
  // Farming
  { key: "crops", slug: "crops", collection: "auto", cron: "/api/cron/scrape-crops", every: "daily", dateKind: "reading", maxAgeHours: 7 * DAY, url: "https://agmarknet.gov.in" },
  { key: "soil", slug: "farm", collection: "hand", dateKind: "checked", url: "https://soilhealth.dac.gov.in" },
  // Know your district
  { key: "population", slug: "population", collection: "published", dateKind: "period", url: "https://censusindia.gov.in" },
  { key: "famous", slug: "famous-personalities", collection: "published", dateKind: "checked" },
  // Across the site
  { key: "aiSummaries", slug: null, collection: "auto", cron: "/api/cron/generate-insights", every: "12h", dateKind: "reading", maxAgeHours: 2 * DAY },
];

/** How a dataset reaches THIS district (a collector may cover only some districts). */
export function collectionFor(d: DatasetInfo, districtSlug: string): Collection {
  if (d.collection === "auto" && d.autoDistricts && !d.autoDistricts.includes(districtSlug)) return d.fallback ?? "hand";
  return d.collection;
}

/** One dataset's numbers for a district (GET /api/data/dataset-dates). */
export interface DatasetDate {
  /** Rows we hold for this district (0 = not available here yet). */
  rows: number;
  /** ISO date of the newest row, when the data has a day. */
  newest: string | null;
  /** The newest period when the data is by year / fiscal year / month / edition. */
  period: string | null;
  /** Alerts only: how many are active now. */
  active?: number;
}

export interface DatasetDatesPayload {
  district: string;
  checkedAt: string;
  datasets: Record<string, DatasetDate>;
}

/** How old a dataset may be and still count as current (hours), or undefined. */
export function maxAgeHoursOf(key: string): number | undefined {
  return DATASETS.find((d) => d.key === key)?.maxAgeHours;
}

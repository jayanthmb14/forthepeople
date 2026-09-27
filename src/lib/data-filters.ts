/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Shared Prisma filters for what a district page may show or count.
// Use them everywhere public numbers are built (data API, report card,
// insights) so every screen agrees.
import { COURTSTAT_SOURCE_PREFIX } from "@/lib/courts/snapshot";
import { JJM_SOURCE } from "@/scraper/lib/jjm";

/**
 * Rows written straight from a news article carry the article URL as
 * `source` (Leader, CrimeStat, PowerOutage). The Sept 2026 audit found them
 * wrong far too often, so they are never shown or counted. Curated rows name
 * their source ("NCRB", "BESCOM", "manual-research").
 */
export const NOT_FROM_NEWS = { NOT: { source: { startsWith: "http" } } };

/** Same, for tables where `source` is optional (Leader). */
export const NOT_FROM_NEWS_OPTIONAL = { OR: [{ source: null }, NOT_FROM_NEWS] };

/**
 * Infrastructure that is actually IN the district. STATE and NATIONAL rows
 * were copied onto many districts by the old sync (one Delhi project was on
 * all ten), so district pages list DISTRICT and CITY projects only.
 */
export const LOCAL_INFRA = { OR: [{ scope: null }, { scope: { in: ["DISTRICT", "CITY"] } }] };

/**
 * Monthly rainfall rows that the seed scripts generated with Math.random()
 * (prisma/seed.ts — Mandya; seed-bengaluru-data.ts; seed-delhi-data.ts) or
 * typed by hand (seed-mysuru-data.ts, "IMD Mysuru" 2023–24),
 * labelled as KSNDMC / IMD. They are not measurements, so they are never
 * shown. Matched by the exact seed source labels AND the seeded years
 * (2020–2024), so a real collector writing current years is unaffected.
 */
export const NOT_SEEDED_RAINFALL = {
  NOT: {
    AND: [
      { source: { in: ["Karnataka State Natural Disaster Monitoring Centre (KSNDMC)", "KSNDMC / IMD", "IMD Delhi", "IMD Mysuru"] } },
      { year: { lte: 2024 } },
    ],
  },
};

/**
 * CourtStat rows the NJDG collector wrote ("NJDG district dashboard · read
 * 2026-09-27", src/scraper/jobs/courts-njdg.ts). The older rows have no
 * source and round numbers — they were typed into the seed scripts, not
 * read from NJDG — so they are never shown or counted. (Deleting them is
 * the owner's call; this keeps them out until then.)
 */
export const NJDG_COURTSTAT = { source: { startsWith: COURTSTAT_SOURCE_PREFIX } };

/**
 * JJMStatus: only the district total the JJM collector writes from the
 * Jal Jeevan Mission dashboard (src/scraper/jobs/jjm-dashboard.ts). The
 * other rows ("Mandya Taluk (aggregate)", village rows with water tests)
 * were seeded with round numbers; adding them to the real total would
 * count homes twice, so they are never shown. No collector row yet →
 * the tap-water page shows nothing rather than seeded numbers.
 */
export const JJM_DISTRICT_TOTAL = { source: JJM_SOURCE };

/**
 * CrimeStat rows whose source says they are estimates ("NCRB Crime in
 * India Report (estimated)" — Hyderabad), not published NCRB counts.
 * Never shown or counted as figures.
 */
export const NOT_ESTIMATED_CRIME = { NOT: { source: { contains: "estimat", mode: "insensitive" as const } } };

/**
 * CrimeStat rows a page may show: not written from a news article and not
 * an estimate. Combined with AND because both filters use the NOT key.
 */
export const SHOWN_CRIME = { AND: [NOT_FROM_NEWS, NOT_ESTIMATED_CRIME] };

/**
 * TrafficCollection rows a page may show: the source is named and is not an
 * estimate ("Estimated from Telangana Traffic Police reports" — Hyderabad).
 * A row with no source cannot be checked, so it is left out too.
 */
export const SHOWN_TRAFFIC = {
  source: { not: null },
  NOT: { source: { startsWith: "estimat", mode: "insensitive" as const } },
};

/**
 * GramPanchayat.source labels written by a collector whose figures were
 * checked against the official source. None yet: the 8 rows in the table
 * were typed into the seed scripts with round numbers (and labelled
 * "MGNREGA / nrega.nic.in" or "ELCIA"), and no open source publishes
 * figures per panchayat. So no GramPanchayat row is shown or counted; the
 * village-council page shows the district's MGNREGA figures from the
 * NREGA collector instead (readDistrictSnapshot("mgnrega", slug)). Add a
 * collector's exact source label here once one writes checked rows.
 */
export const VERIFIED_PANCHAYAT_SOURCES: string[] = [];
export const VERIFIED_PANCHAYAT = { source: { in: VERIFIED_PANCHAYAT_SOURCES } };

// ── Money: budgets, sugar seasons, tenders (Sept 2026 audit, v5.4) ─────

/**
 * BudgetEntry.source labels written by a collector from a published
 * dataset (src/scraper/jobs/finance.ts, src/scraper/jobs/budget.ts). Every
 * other BudgetEntry row was typed into a seed or a one-off script: whole-
 * state or whole-city totals filed under one district (Hyderabad, Lucknow,
 * New Delhi), invented round sector figures (Mumbai, Kolkata, Chennai,
 * Mandya) and "spent" made up as a fixed share of the allocation
 * (Bengaluru 44% / 70%, Mysuru, Hyderabad "estimated from state avg
 * utilisation"). No district publishes sector-wise spending, so those rows
 * are never shown or counted. Add a collector's exact label here once one
 * writes checked rows.
 */
export const COLLECTED_BUDGET_SOURCES: string[] = ["Karnataka Finance Dept / data.gov.in"];
export const SHOWN_BUDGET_ENTRY = {
  OR: [{ source: { in: COLLECTED_BUDGET_SOURCES } }, { source: { startsWith: "data.gov.in (" } }],
};

/**
 * BudgetAllocation rows a page may show: the row links to the page that
 * published its figures. The rows without a link were typed into seeds
 * with round numbers ("BBMP Budget", "BMRCL Annual Report", "Karnataka
 * Expenditure Monitoring System", "Delhi Budget") and could not be traced
 * to any published document.
 */
export const SHOWN_BUDGET_ALLOCATION = { sourceUrl: { not: null } };

/**
 * SugarFactorySeason.source labels written by a collector that read the
 * figures from the Sugar Directorate. None yet: the only season rows were
 * written by prisma/seed.ts ("Karnataka Sugar Directorate", the same
 * season, dates, FRP/SAP and round farmer counts for every Mandya mill),
 * so no season row is shown. Add a collector's exact label here once one
 * writes checked rows.
 */
export const VERIFIED_SUGAR_SEASON_SOURCES: string[] = [];
export const VERIFIED_SUGAR_SEASON = { source: { in: VERIFIED_SUGAR_SEASON_SOURCES } };

/**
 * Tender rows prisma/seed-tenders-karnataka.ts wrote as placeholders
 * ("STUB_PENDING_SCRAPER_VERIFICATION": invented titles, values and
 * awards) are never listed or counted. A null snapshot is a real row, so
 * it is kept explicitly (NOT alone would drop NULLs).
 */
export const TENDER_STUB_MARKER = "STUB_PENDING_SCRAPER_VERIFICATION";
export const NOT_STUB_TENDER = { OR: [{ rawHtmlSnapshot: null }, { NOT: { rawHtmlSnapshot: TENDER_STUB_MARKER } }] };

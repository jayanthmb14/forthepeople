/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Shared Prisma filters for what a district page may show or count.
// Use them everywhere public numbers are built (data API, report card,
// insights) so every screen agrees.
import { COURTSTAT_SOURCE_PREFIX } from "@/lib/courts/snapshot";
import { JJM_SOURCE } from "@/scraper/lib/jjm";
import { MIN_PRICE_PER_QUINTAL, NOT_PER_QUINTAL_COMMODITIES } from "@/scraper/lib/agmarknet";
import { agmarknetMarketsInDistrict } from "@/scraper/lib/district-aliases";
import { SACHET_SOURCE_PREFIX } from "@/scraper/lib/sachet";

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
export const SEEDED_RAINFALL_SOURCES = ["Karnataka State Natural Disaster Monitoring Centre (KSNDMC)", "KSNDMC / IMD", "IMD Delhi", "IMD Mysuru"];
/** Last year the rainfall seeds wrote (the SQL in /api/data/freshness uses it too). */
export const SEEDED_RAINFALL_LAST_YEAR = 2024;
export const NOT_SEEDED_RAINFALL = {
  NOT: {
    AND: [
      { source: { in: SEEDED_RAINFALL_SOURCES } },
      { year: { lte: SEEDED_RAINFALL_LAST_YEAR } },
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

// ── Government area (Sept 2026 audit) ───────────────────────────────────

/**
 * Election results are WITHHELD until the ElectionResult table is re-loaded
 * from results.eci.gov.in (the seeded rows had wrong winners and round
 * vote counts). Shared by the elections API, the freshness panel and the
 * dataset dates, so no screen calls withheld results "on time".
 */
export const ELECTION_RESULTS_WITHHELD = true;

/**
 * CitizenTip rows are never served: the table has no source column and all
 * 22 rows were typed into the Mar 2026 seeds (BBMP named as Mysuru's city
 * body, a stale sugarcane FRP, an unchecked "free entry on Sundays"). Turn
 * on only after the rows carry a checked source.
 */
export const SHOW_CITIZEN_TIP_ROWS = false;

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

// ═══ Land & water (Sept 2026 audit) ═══════════════════════════════════
// Crops, alerts. Each filter says which audit finding it answers.

/**
 * CropPrice rows a page may show or count:
 *  - not hand-typed seed rows. prisma/seed.ts wrote 8 invented Mandya
 *    prices labelled "AGMARKNET / data.gov.in" (Areca "₹350/kg",
 *    Sugarcane "₹3/kg"), and the Bengaluru / Mysuru seed scripts did the
 *    same; every seed row carries an arrival quantity, which the
 *    AGMARKNET collector (src/scraper/jobs/crops.ts) never writes;
 *  - a crop priced per quintal: not livestock (an ox shown as "₹800/kg"),
 *    coconut (per 1,000 nuts) or cut flowers (per stem) —
 *    NOT_PER_QUINTAL_COMMODITIES in src/scraper/lib/agmarknet.ts;
 *  - at least ₹1 a kg: smaller figures are per bunch and showed as "₹0".
 */
export const SHOWN_CROP_PRICE = {
  arrivalQty: null,
  minPrice: { gte: MIN_PRICE_PER_QUINTAL },
  commodity: { notIn: [...NOT_PER_QUINTAL_COMMODITIES] },
};

/**
 * SHOWN_CROP_PRICE, plus only the mandis inside the district where the
 * AGMARKNET district is bigger than ours (Bengaluru Urban: only Bangalore
 * APMC; New Delhi: none — agmarknetMarketsInDistrict in
 * src/scraper/lib/district-aliases.ts). An empty OR matches no row.
 */
export function shownCropPrices(districtSlug: string) {
  const markets = agmarknetMarketsInDistrict(districtSlug);
  if (markets === null) return SHOWN_CROP_PRICE;
  return {
    AND: [SHOWN_CROP_PRICE, { OR: markets.map((m) => ({ market: { contains: m, mode: "insensitive" as const } })) }],
  };
}

/**
 * LocalAlert rows that are official warnings: the ones the NDMA SACHET
 * collector wrote (src/scraper/jobs/alerts.ts), whose sourceUrl is the
 * CAP message link. The news pipeline used to turn health and election
 * stories into "warnings in force" (an advert for a scan centre, a
 * political allegation); those rows, and the old headline-keyword rows,
 * are never shown or counted as warnings.
 */
export const OFFICIAL_ALERTS = { sourceUrl: { startsWith: SACHET_SOURCE_PREFIX } };


// ── People & services (Sept 2026 audit) ─────────────────────
// Rows that were typed into seed scripts or lifted from news stories
// without a checkable source. Hidden at the API, never deleted here.

/**
 * FamousPersonality rows a page may show: active AND born in the
 * district (CLAUDE.md: "Never add a famous personality unless they were
 * born in that district"). Rows only "linked to" a district (Tilak in
 * Pune, Mother Teresa in Kolkata) are kept in the table but not shown.
 */
export const BORN_HERE_PERSONALITY = { active: true, bornInDistrict: true };

/**
 * BusRoute / TrainSchedule rows a page may show: active ones. Every row
 * was hand- or AI-seeded (no NTES / KSRTC feed) and many were wrong
 * (train numbers of the opposite direction, invented route codes), so
 * the unchecked rows are set active=false and stay hidden until someone
 * checks them against the operator's own timetable and re-activates them.
 */
export const ACTIVE_TRANSPORT = { active: true };

/** Government sites (.gov.in / .nic.in / .gov) — same rule as the exams page. */
function isGovernmentUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase();
    return /(^|\.)(gov\.in|nic\.in|gov)$/.test(host);
  } catch {
    return false;
  }
}

/**
 * DepartmentStaffing (sanctioned vs working posts) is shown only when its
 * source is a government site. The news pipeline turned numbers in
 * national stories into "district" rows (Kolkata: 2,73,000 CAPF posts, 0
 * working; Mysuru: 10 health posts), labelled official data.
 */
export function isOfficialStaffingRow(row: { sourceUrl: string | null }): boolean {
  return isGovernmentUrl(row.sourceUrl);
}

// ── News area: warnings, budgets (Sept 2026 audit) ─────────────────────
//
// Merge note (v54/merge-rest): v54/fix-news and v54/fix-land-water both
// stopped news stories counting as warnings, and v54/fix-news and
// v54/fix-money both stopped seeded budget rows counting as a district
// budget. One rule each is used by the queries:
//   • warnings — OFFICIAL_ALERTS above (NDMA SACHET rows only). The news
//     branch's OFFICIAL_ALERT ({ autoGenerated: false, sourceUrl not null })
//     was looser (it also passed a hand-typed row with any link), so it was
//     folded into OFFICIAL_ALERTS. The SACHET collector writes
//     autoGenerated: false, so every row the news rule meant to keep is kept.
//   • budgets — SHOWN_BUDGET_ENTRY above (collector labels only). It hides
//     every label in SEEDED_BUDGET_SOURCES below (tests/budget-shown.test.ts
//     checks that), so NOT_SEEDED_BUDGET is kept as the audit's record of
//     the seed labels, not applied separately.

/**
 * BudgetEntry source labels written by hand-made seed scripts
 * (prisma/seed-bengaluru-data.ts, seed-hyderabad-data.ts,
 * seed-lucknow-data.ts, seed-mumbai-data.ts, seed-delhi-data.ts), not read
 * from a budget document. The Sept 2026 audit found their totals were state
 * or agency budgets credited to one district (New Delhi's twelve Delhi
 * Government heads sum to the same ₹65,200 crore as Mumbai's; Lucknow's
 * are UP state heads), and their "spent" was a fixed share of every line
 * (Bengaluru Urban 44 % / 70 %, Hyderabad "estimated from state avg
 * utilisation"). They are never shown or counted; matched by the exact
 * labels, so a collector's rows are unaffected. (BMC's own 2025-26 budget
 * estimate is ₹74,427.41 crore — not what the Mumbai rows add up to.)
 */
export const SEEDED_BUDGET_SOURCES: string[] = [
  "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
  "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
  "finance.telangana.gov.in (estimated from state avg utilisation)",
  "ghmc.gov.in (estimated from state avg utilisation)",
  "UP Finance Department",
  "UP Finance Department (budget.up.nic.in)",
  "BMC Budget 2025-26",
  "MMRDA / State Allocation",
  "Delhi Budget",
  "Delhi Budget / delhiplanning.delhi.gov.in",
];
export const NOT_SEEDED_BUDGET = { OR: [{ source: null }, { source: { notIn: SEEDED_BUDGET_SOURCES } }] };

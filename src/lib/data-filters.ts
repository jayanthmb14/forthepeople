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

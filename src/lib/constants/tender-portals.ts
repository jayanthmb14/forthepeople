/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// What the tender collector reads (/api/cron/scrape-tenders →
// src/scraper/jobs/gepnic-tenders.ts): one GePNIC portal per state and, per
// district, the bodies we follow there. Pure data with no imports, so the
// "Check this data" panel, the stale notice and the tender switch can use
// it without pulling in the parsers (src/scraper/lib/gepnic.ts, which
// re-exports these).
//
// A state missing from GEPNIC_PORTALS has no tender collector (Karnataka's
// KPPP and Telangana run other software): its tender pages name no source.
// A district missing from GEPNIC_ORGS is not collected, so its tender pages
// stay locked whatever District.tendersActive says (tendersCollectedFor).

export interface GepnicPortal {
  /** Stored as Tender.sourcePortal; shown to readers as the source. */
  host: string;
  /** …/nicgep/app */
  app: string;
}

export const GEPNIC_PORTALS: Record<string, GepnicPortal> = {
  maharashtra: { host: "mahatenders.gov.in", app: "https://mahatenders.gov.in/nicgep/app" },
  "tamil-nadu": { host: "tntenders.gov.in", app: "https://tntenders.gov.in/nicgep/app" },
  "west-bengal": { host: "wbtenders.gov.in", app: "https://wbtenders.gov.in/nicgep/app" },
  delhi: { host: "govtprocurement.delhi.gov.in", app: "https://govtprocurement.delhi.gov.in/nicgep/app" },
};

/** The portal the tender collector reads for a state, or null when none does. */
export function tenderPortalFor(stateSlug: string): GepnicPortal | null {
  return GEPNIC_PORTALS[stateSlug] ?? null;
}

// Which organisations count for a district is a short, hand-checked list:
// the bodies whose whole area is that district (city corporation, zilla
// parishad, city police, city bus/power undertaking). Regional bodies that
// also cover other districts (e.g. a metropolitan region authority, a PWD
// region) are left out rather than guessed.

export interface FollowedOrg {
  /** The organisation's name exactly as the portal lists it. */
  org: string;
  /** TenderAuthority.shortCode */
  shortCode: string;
  authorityType: "ULB" | "PANCHAYAT" | "PARASTATAL" | "STATE_DEPT";
}

/** District slug → the organisations whose tenders are that district's. */
export const GEPNIC_ORGS: Record<string, FollowedOrg[]> = {
  pune: [
    { org: "Pune Municipal Corporation", shortCode: "MH_PMC", authorityType: "ULB" },
    { org: "Pimpri Chinchwad Municipal Corporation", shortCode: "MH_PCMC", authorityType: "ULB" },
    // Zilla Parishad Pune (Rural Development Department, CEO Pune).
    { org: "RDD-CEO-PUNE", shortCode: "MH_ZP_PUNE", authorityType: "PANCHAYAT" },
  ],
  mumbai: [
    { org: "Municipal Corporation of Greater Mumbai", shortCode: "MH_MCGM", authorityType: "ULB" },
    { org: "Brihanmumbai Electric Supply and Transport Undertaking", shortCode: "MH_BEST", authorityType: "PARASTATAL" },
  ],
  chennai: [
    { org: "Corporation of Chennai", shortCode: "TN_GCC", authorityType: "ULB" },
    { org: "Metropolitan Transport Corporation(Chennai) Ltd.", shortCode: "TN_MTC", authorityType: "PARASTATAL" },
  ],
  kolkata: [
    { org: "KOLKATA MUNICIPAL CORPORATION", shortCode: "WB_KMC", authorityType: "ULB" },
    { org: "KOLKATA POLICE", shortCode: "WB_KOLKATA_POLICE", authorityType: "STATE_DEPT" },
  ],
  "new-delhi": [{ org: "New Delhi Municipal Council", shortCode: "DL_NDMC", authorityType: "ULB" }],
};

/**
 * True when the tender collector reads this district: its state has a
 * portal and we follow at least one body there. The tender pages, the
 * overview snippet and the freshness panel treat a district as switched on
 * only when this AND District.tendersActive hold (Sept 2026: the three
 * Karnataka districts were switched on with no collector and showed an
 * empty dashboard).
 */
export function tendersCollectedFor(stateSlug: string, districtSlug: string): boolean {
  return Boolean(GEPNIC_PORTALS[stateSlug]) && (GEPNIC_ORGS[districtSlug]?.length ?? 0) > 0;
}

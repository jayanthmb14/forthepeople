/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The state e-procurement portals the tender collector reads
// (/api/cron/scrape-tenders → src/scraper/jobs/gepnic-tenders.ts). Pure data
// with no imports, so client code (the "Check this data" panel, the stale
// notice) can name the real source without pulling in the parsers. The
// parsers and the list of followed bodies per district stay in
// src/scraper/lib/gepnic.ts, which re-exports these.
//
// A state missing here has no tender collector (Karnataka's KPPP and
// Telangana run other software): its tender pages name no source.

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

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Scraper job types
// ═══════════════════════════════════════════════════════════

export interface ScraperResult {
  success: boolean;
  recordsNew: number;
  recordsUpdated: number;
  error?: string;
}

export interface JobContext {
  districtSlug: string;
  districtId: string;
  districtName: string;
  stateSlug: string;
  stateName: string;
  owmCityName?: string | null;   
  agmarknetName?: string | null; 
  log: (msg: string) => void;
}
export type ScraperJob = (ctx: JobContext) => Promise<ScraperResult>;

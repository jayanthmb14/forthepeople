/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: petrol and diesel prices (Delhi, Mumbai, Chennai, Kolkata)
// Schedule: /api/cron/scrape-fuel (see that route for the schedule).
//
// Five requests per run, at most one every 2.5 s per site
// (src/scraper/lib/source-fetch.ts, honest user agent):
//   1. https://ppac.gov.in/                   the "as on" Delhi lines + the day's table link
//   2. PPAC metro-cities page                 the "Current" table link
//   3. the PPAC metro table (PDF, ~3–4 MB)    petrol + diesel in the four metros
//   4. BPCL petrol price build-up (PDF)       Delhi retail price + the day it took effect
//   5. BPCL diesel price build-up (PDF)
// Then the double-check in src/scraper/lib/fuel-prices.ts (verifyFuel).
// Nothing is written unless every check passes; the reasons are returned
// (and end up in ScraperLog.error) so a person can see why.
// ═══════════════════════════════════════════════════════════
import { todayIST } from "@/lib/markets/compute";
import { writeFuelSnapshot } from "@/lib/markets/fuel";
import { fetchSource, fetchSourceBytes } from "../lib/source-fetch";
import { pdfLines, pdfTextRuns } from "../lib/pdf-text";
import {
  BPCL_BUILDUP_URL,
  PPAC_HOME_URL,
  PPAC_METRO_PAGE_URL,
  metroPdfDay,
  parseBpclBuildUp,
  parsePpacHome,
  parsePpacMetroTable,
  ppacMetroPdfLinks,
  verifyFuel,
  type BpclBuildUp,
  type Fuel,
  type FuelSnapshot,
} from "../lib/fuel-prices";

export interface FuelRunResult {
  /** "created" / "changed" / "confirmed" when a snapshot was written; null when nothing was. */
  written: "created" | "changed" | "confirmed" | null;
  problems: string[];
  snapshot: FuelSnapshot | null;
  /** Which PPAC table file was read. */
  tableUrl: string | null;
}

const isPdf = (b: Uint8Array) => b.byteLength > 5 && Buffer.from(b.subarray(0, 5)).toString("latin1") === "%PDF-";

/** Text lines of a PDF, or null when it is not a PDF we can read. */
function readPdf(bytes: Uint8Array): string[][] | null {
  if (!isPdf(bytes)) return null;
  const lines = pdfLines(pdfTextRuns(bytes));
  return lines.length ? lines : null;
}

export async function collectFuelPrices(opts: { deadlineMs: number; log: (m: string) => void; nowMs?: number }): Promise<FuelRunResult> {
  const { deadlineMs, log } = opts;
  const fetchedAt = new Date(opts.nowMs ?? Date.now()).toISOString();
  const problems: string[] = [];

  // 1. PPAC home page
  const homeRes = await fetchSource(PPAC_HOME_URL, { deadlineMs, timeoutMs: 20_000 });
  const home = homeRes.ok ? parsePpacHome(homeRes.text) : {};
  if (!homeRes.ok) problems.push(`PPAC home page: ${homeRes.error ?? `HTTP ${homeRes.status}`}`);
  log(`ppac home: petrol ${home.petrol ? `${home.petrol.rsp} as on ${home.petrol.day}` : "—"}, diesel ${home.diesel ? `${home.diesel.rsp} as on ${home.diesel.day}` : "—"}`);

  // 2. The metro page's "Current" link, then the home page's links
  const metroRes = await fetchSource(PPAC_METRO_PAGE_URL, { deadlineMs, timeoutMs: 20_000 });
  const links = [...(metroRes.ok ? ppacMetroPdfLinks(metroRes.text) : []), ...(homeRes.ok ? ppacMetroPdfLinks(homeRes.text) : [])];
  const day = home.petrol?.day ?? home.diesel?.day ?? null;
  // Prefer the file named for the home page's day (PPAC posts the home link first).
  const tableUrl = links.find((u) => day && metroPdfDay(u) === day) ?? links[0] ?? null;
  log(`ppac table: ${tableUrl ?? "no link"} (${links.length} link(s))`);

  // 3. The table
  let table = null;
  if (tableUrl) {
    const pdf = await fetchSourceBytes(tableUrl, { deadlineMs, timeoutMs: 40_000, maxBytes: 16 * 1024 * 1024 });
    const lines = pdf.ok ? readPdf(pdf.bytes) : null;
    table = lines ? parsePpacMetroTable(lines) : null;
    if (!pdf.ok) problems.push(`PPAC metro table: ${pdf.error ?? `HTTP ${pdf.status}`}`);
    log(`ppac table: ${pdf.ok ? `${pdf.bytes.byteLength} bytes, ${table ? `${table.rows} rows, newest ${table.newest.day}` : "not readable"}` : pdf.error}`);
  }

  // 4–5. BPCL price build-ups
  const bpcl: Partial<Record<Fuel, BpclBuildUp | null>> = {};
  for (const fuel of ["petrol", "diesel"] as const) {
    const res = await fetchSourceBytes(BPCL_BUILDUP_URL[fuel], { deadlineMs, timeoutMs: 20_000, maxBytes: 4 * 1024 * 1024 });
    const lines = res.ok ? readPdf(res.bytes) : null;
    const parsed = lines ? parseBpclBuildUp(lines) : null;
    bpcl[fuel] = parsed && parsed.fuel === fuel ? parsed : null;
    if (!res.ok) problems.push(`BPCL ${fuel} price build-up: ${res.error ?? `HTTP ${res.status}`}`);
    log(`bpcl ${fuel}: ${bpcl[fuel] ? `${bpcl[fuel]!.rsp} from ${bpcl[fuel]!.effective}` : res.ok ? "not readable" : res.error}`);
  }

  const check = verifyFuel({ home, table, tableUrl, bpcl, today: todayIST(opts.nowMs), fetchedAt });
  if (!check.ok) {
    const all = [...problems, ...check.problems.filter((p) => !problems.some((q) => q.split(":")[0] === p.split(":")[0]))];
    log(`not written: ${all.join("; ")}`);
    return { written: null, problems: all, snapshot: null, tableUrl };
  }
  const written = await writeFuelSnapshot(check.snapshot);
  log(`written (${written}): Delhi petrol ${check.snapshot.cities[0].petrol}, diesel ${check.snapshot.cities[0].diesel}, as on ${check.snapshot.asOf}`);
  return { written, problems: [], snapshot: check.snapshot, tableUrl };
}

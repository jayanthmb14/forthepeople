/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Crop Prices — AGMARKNET via data.gov.in API
// Schedule: daily 03:30 UTC via /api/cron/scrape-crops (vercel.json)
//
// Sept 2026 performance fix: the data.gov.in fetch times out at 20 s, and
// instead of one findFirst + one create per record we load the district's
// existing keys with ONE findMany and insert everything new with ONE
// createMany.
//
// Sept 2026 (v5):
//  - District spellings: AGMARKNET still uses "Bangalore", "Mysore" …; the
//    job tries each alias from src/scraper/lib/district-aliases.ts in
//    order (next one only when the previous answered with 0 records) and
//    logs which one matched.
//  - One retry after 2 s on a gateway error (429/5xx) or a network error.
//    A 20 s timeout is NOT retried: a hung API will not answer in the next
//    20 s either, and the run has a time budget.
//  - Every record passes the price checks in src/scraper/lib/agmarknet.ts
//    (no zero prices, min ≤ modal ≤ max, nothing absurd); rejects are
//    counted, never "fixed".
//
// Sept 2026 audit:
//  - Only crops priced per quintal are stored: livestock (an ox shown as
//    "₹800/kg"), coconut (per 1,000 nuts), cut flowers (per stem) and
//    prices under ₹1 a kg (per bunch) are rejected by toCropRow().
//  - Only mandis inside the district are stored: AGMARKNET's "Bangalore"
//    and "Delhi" are bigger than Bengaluru Urban and New Delhi
//    (isMarketInDistrict, src/scraper/lib/district-aliases.ts).
//  - arrivalQty is never written here. The only rows that carry it are
//    hand-typed seed rows, which the data API hides (SHOWN_CROP_PRICE in
//    src/lib/data-filters.ts) — keep it that way or update that filter.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { logUpdate } from "@/lib/update-log";
import { agmarknetDistrictNames, isMarketInDistrict } from "../lib/district-aliases";
import { isRetryableStatus, toCropRow, type AgmarkRecord } from "../lib/agmarknet";

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const FETCH_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 2_000;
export const CROPS_SOURCE = "AGMARKNET / data.gov.in";

export interface CropsCollectOptions {
  /** Epoch ms after which no new request is started (the cron's time budget). */
  deadlineMs?: number;
}

export interface CropsCollectResult extends ScraperResult {
  /** AGMARKNET district name that returned records, if any. */
  matchedName?: string;
  /** Records dropped by the price checks. */
  rejected?: number;
  /** True when data.gov.in itself failed (timeout / gateway error), not "no data". */
  sourceDown?: boolean;
}

class SourceError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One data.gov.in request with one retry on a gateway or network error. */
async function fetchRecords(url: string, deadlineMs: number | undefined): Promise<AgmarkRecord[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (deadlineMs && Date.now() + FETCH_TIMEOUT_MS > deadlineMs) {
      throw new SourceError("time budget left is too short for another request");
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.ok) {
        const json = (await res.json()) as { records?: AgmarkRecord[] };
        return Array.isArray(json.records) ? json.records : [];
      }
      if (attempt === 1 && isRetryableStatus(res.status)) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new SourceError(`HTTP ${res.status}`);
    } catch (err) {
      if (err instanceof SourceError) throw err;
      const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      if (!isTimeout && attempt === 1) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new SourceError(isTimeout ? `no answer in ${FETCH_TIMEOUT_MS / 1000} s` : err instanceof Error ? err.message : String(err));
    }
  }
  throw new SourceError("no answer");
}

export async function collectCrops(ctx: JobContext, opts: CropsCollectOptions = {}): Promise<CropsCollectResult> {
  if (!API_KEY) {
    ctx.log("DATA_GOV_API_KEY not set — skipping");
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: "No API key" };
  }

  const state = ctx.stateName || ctx.stateSlug.charAt(0).toUpperCase() + ctx.stateSlug.slice(1);
  const names = agmarknetDistrictNames(ctx.districtSlug, ctx.districtName);

  // ── Step 1: find the spelling AGMARKNET uses for this district ──
  let records: AgmarkRecord[] = [];
  let matchedName: string | undefined;
  try {
    for (const name of names) {
      const url =
        `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json` +
        `&filters[state]=${encodeURIComponent(state)}&filters[district]=${encodeURIComponent(name)}&limit=100`;
      const started = Date.now();
      const got = await fetchRecords(url, opts.deadlineMs);
      ctx.log(`"${name}": ${got.length} records in ${Date.now() - started}ms`);
      if (got.length > 0) {
        records = got;
        matchedName = name;
        break;
      }
    }
  } catch (err) {
    const msg = `data.gov.in: ${err instanceof Error ? err.message : String(err)}`;
    ctx.log(msg);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg, sourceDown: true };
  }

  if (!matchedName) {
    // The source answered but has no mandi under any of our spellings.
    ctx.log(`no AGMARKNET records under ${names.map((n) => `"${n}"`).join(", ")}`);
    return { success: true, recordsNew: 0, recordsUpdated: 0, rejected: 0 };
  }

  try {
    // ── Step 2: ONE query for the keys we already have ──
    // CropPrice has no unique index, so we dedupe in memory: the identity
    // of a row is (commodity, market, date).
    const existingRows = await prisma.cropPrice.findMany({
      where: { districtId: ctx.districtId },
      select: { commodity: true, market: true, date: true },
    });
    const seen = new Set(existingRows.map((e) => `${e.commodity}|${e.market}|${e.date.toISOString()}`));

    // ── Step 3: check every record; keep the new, sane ones ──
    const fetchedAt = new Date();
    const now = Date.now();
    const rejectedBy = new Map<string, number>();
    const toInsert = [];
    for (const r of records) {
      const checked = toCropRow(r, now);
      if ("reason" in checked) {
        rejectedBy.set(checked.reason, (rejectedBy.get(checked.reason) ?? 0) + 1);
        continue;
      }
      const row = checked.row;
      if (!isMarketInDistrict(ctx.districtSlug, row.market)) {
        const why = "mandi is outside the district";
        rejectedBy.set(why, (rejectedBy.get(why) ?? 0) + 1);
        continue;
      }
      const key = `${row.commodity}|${row.market}|${row.date.toISOString()}`;
      if (seen.has(key)) continue; // already in DB, or duplicate within this batch
      seen.add(key);
      toInsert.push({ districtId: ctx.districtId, ...row, source: CROPS_SOURCE, fetchedAt });
    }
    const rejected = Array.from(rejectedBy.values()).reduce((a, b) => a + b, 0);
    if (rejected > 0) {
      ctx.log(`rejected ${rejected}: ${Array.from(rejectedBy, ([why, n]) => `${n}× ${why}`).join(", ")}`);
    }

    // ── Step 4: ONE insert for all of them ──
    let newCount = 0;
    if (toInsert.length > 0) {
      const created = await prisma.cropPrice.createMany({ data: toInsert, skipDuplicates: true });
      newCount = created.count;
    }

    // Keep only the last 100 records per district.
    const old = await prisma.cropPrice.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { date: "desc" },
      skip: 100,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.cropPrice.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }

    const summary = `Crop prices: ${newCount} new records from ${records.length} fetched ("${matchedName}")`;
    ctx.log(summary);

    if (newCount > 0) {
      await logUpdate({
        source: "scraper",
        actorLabel: "cron",
        tableName: "CropPrice",
        recordId: `${ctx.districtId}:${Date.now()}`,
        action: "create",
        districtId: ctx.districtId,
        districtName: ctx.districtName,
        moduleName: "crops",
        description: summary,
        recordCount: newCount,
        details: { fetched: records.length, inserted: newCount, rejected, agmarknetDistrict: matchedName },
      });
    }

    return { success: true, recordsNew: newCount, recordsUpdated: 0, matchedName, rejected };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

/** ScraperJob signature for the admin "run now" button (/api/admin/run-scraper). */
export async function scrapeCrops(ctx: JobContext): Promise<ScraperResult> {
  const { success, recordsNew, recordsUpdated, error } = await collectCrops(ctx);
  return { success, recordsNew, recordsUpdated, error };
}

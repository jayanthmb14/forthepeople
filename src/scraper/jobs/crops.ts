/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Crop Prices — AGMARKNET via data.gov.in API
// Schedule: daily 03:30 UTC via /api/cron/scrape-crops (vercel.json)
//
// Sept 2026 performance fix: the data.gov.in fetch now times out at 20 s,
// and instead of one findFirst + one create per record (up to ~2,000
// sequential round-trips to Neon), we load the district's existing keys
// with ONE findMany and insert everything new with ONE createMany.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { logUpdate } from "@/lib/update-log";

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

// Override map for districts where AGMARKNET name differs from district name
const AGMARKNET_DISTRICT_OVERRIDE: Record<string, string> = {
  "bengaluru-urban": "Bangalore",
  "mysuru":          "Mysore",
  "new-delhi":       "Delhi",
  "central-delhi":   "Delhi",
  "north-delhi":     "Delhi",
  "north-west-delhi":"Delhi",
  "north-east-delhi":"Delhi",
  "east-delhi":      "Delhi",
  "south-delhi":     "Delhi",
  "south-west-delhi":"Delhi",
  "south-east-delhi":"Delhi",
  "west-delhi":      "Delhi",
  "shahdara":        "Delhi",
  "mumbai":          "Mumbai",
  "kolkata":         "Kolkata",
  "chennai":         "Chennai",
  "pune":            "Pune",
};

interface AgmarkRecord {
  commodity: string;
  variety: string;
  district: string;
  market: string;
  min_price: number | string;
  max_price: number | string;
  modal_price: number | string;
  arrival_date: string;
  grade?: string;
  state?: string;
}

export async function scrapeCrops(ctx: JobContext): Promise<ScraperResult> {
  if (!API_KEY) {
    ctx.log("DATA_GOV_API_KEY not set — skipping");
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: "No API key" };
  }

  try {
    const state = ctx.stateName ?? (ctx.stateSlug.charAt(0).toUpperCase() + ctx.stateSlug.slice(1));
    const district = AGMARKNET_DISTRICT_OVERRIDE[ctx.districtSlug] ?? ctx.districtName ?? ctx.districtSlug;
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&filters[state]=${encodeURIComponent(state)}&filters[district]=${encodeURIComponent(district)}&limit=100`;

    // data.gov.in sometimes hangs for minutes; a hard 20 s cap keeps one
    // slow district from eating the whole cron budget.
    const fetchStart = Date.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const records: AgmarkRecord[] = json.records ?? [];
    ctx.log(`fetched ${records.length} records in ${Date.now() - fetchStart}ms`);

    // ── Step 1: ONE query for the keys we already have ──
    // CropPrice has no unique index (schema is frozen), so we dedupe in
    // memory: the identity of a row is (commodity, market, date).
    const existingRows = await prisma.cropPrice.findMany({
      where: { districtId: ctx.districtId },
      select: { commodity: true, market: true, date: true },
    });
    const seen = new Set(existingRows.map((e) => `${e.commodity}|${e.market}|${e.date.toISOString()}`));

    // ── Step 2: build the list of rows that are genuinely new ──
    const fetchedAt = new Date();
    const toInsert: Array<{
      districtId: string;
      commodity: string;
      variety: string | null;
      market: string;
      minPrice: number;
      maxPrice: number;
      modalPrice: number;
      date: Date;
      source: string;
      fetchedAt: Date;
    }> = [];

    for (const r of records) {
      // API now uses lowercase fields + numeric prices (changed 2026-03)
      const dateStr = r.arrival_date;
      if (!dateStr || !r.commodity || !r.market) continue;
      const [dd, mm, yyyy] = dateStr.split("/");
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      if (isNaN(date.getTime())) continue;

      const key = `${r.commodity}|${r.market}|${date.toISOString()}`;
      if (seen.has(key)) continue; // already in DB, or duplicate within this batch
      seen.add(key);

      toInsert.push({
        districtId: ctx.districtId,
        commodity: r.commodity,
        variety: r.variety || null,
        market: r.market,
        minPrice: Number(r.min_price) || 0,
        maxPrice: Number(r.max_price) || 0,
        modalPrice: Number(r.modal_price) || 0,
        date,
        source: "AGMARKNET / data.gov.in",
        fetchedAt,
      });
    }

    // ── Step 3: ONE insert for all of them ──
    // skipDuplicates is a no-op without a unique index but is harmless and
    // becomes useful the day one is added to the schema.
    let newCount = 0;
    if (toInsert.length > 0) {
      const created = await prisma.cropPrice.createMany({ data: toInsert, skipDuplicates: true });
      newCount = created.count;
    }

    // Keep only last 100 records
    const old = await prisma.cropPrice.findMany({
      where: { districtId: ctx.districtId },
      orderBy: { date: "desc" },
      skip: 100,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.cropPrice.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }

    const summary = `Crop prices: ${newCount} new records from ${records.length} fetched`;
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
        details: { fetched: records.length, inserted: newCount },
      });
    }

    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

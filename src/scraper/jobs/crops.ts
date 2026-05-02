/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Crop Prices — AGMARKNET via data.gov.in API
// Schedule: Every 15 min (6AM–8PM IST)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { logUpdate } from "@/lib/update-log";

const API_KEY = process.env.DATA_GOV_API_KEY;
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

// Override map for districts where AGMARKNET name differs from district name

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
    const district = ctx.agmarknetName ?? ctx.districtName ?? ctx.districtSlug;
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&filters[state]=${encodeURIComponent(state)}&filters[district]=${encodeURIComponent(district)}&limit=100`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const records: AgmarkRecord[] = json.records ?? [];

    let newCount = 0;
    for (const r of records) {
      // API now uses lowercase fields + numeric prices (changed 2026-03)
      const dateStr = r.arrival_date;
      if (!dateStr) continue;
      const [dd, mm, yyyy] = dateStr.split("/");
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      if (isNaN(date.getTime())) continue;

      const existing = await prisma.cropPrice.findFirst({
        where: {
          districtId: ctx.districtId,
          commodity: r.commodity,
          market: r.market,
          date,
        },
      });
      if (!existing) {
        await prisma.cropPrice.create({
          data: {
            districtId: ctx.districtId,
            commodity: r.commodity,
            variety: r.variety || null,
            market: r.market,
            minPrice: Number(r.min_price) || 0,
            maxPrice: Number(r.max_price) || 0,
            modalPrice: Number(r.modal_price) || 0,
            date,
            source: "AGMARKNET / data.gov.in",
            fetchedAt: new Date(),
          },
        });
        newCount++;
      }
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

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Dam/Reservoir Levels — National Scraper
//
// Priority order for data sources:
// 1. State-specific water portal (Karnataka has working API)
// 2. India-WRIS / CWC national portal (future — no public API yet)
// 3. Dam config static data as last resort for capacity info
//
// Research findings (2026-04-10):
// - India-WRIS (indiawris.gov.in): No public REST API. Portal uses
//   internal GIS-based queries. Not feasible for automated collection.
// - CWC (cwc.gov.in): Daily reservoir bulletin published but as
//   PDF/HTML with no stable API. Old RSMS portal has TLS issues.
// - Karnataka (water.karnataka.gov.in): Working POST API returns
//   GeoJSON with all reservoir data. ONLY reliable state portal found.
// - data.gov.in: No current reservoir storage datasets found.
//
// Strategy: Keep Karnataka portal (works), add dam-config for capacity
// data, and gracefully skip other states until their portals are integrated.
//
// Schedule: Every 30 minutes
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { getDamConfig } from "@/lib/constants/dam-config";

// ── Karnataka state portal (the only working live source) ──
const KARNATAKA_WATER_URL =
  "https://water.karnataka.gov.in/CommonXyZABC.aspx/GetReservoirLocs";

// Map Karnataka portal dam names → our config dam names
const KARNATAKA_NAME_MAP: Record<string, string> = {
  "K.R.Sagara Dam": "KRS (Krishna Raja Sagara)",
  "Kabini Dam": "Kabini Dam",
  "Hemavathy Dam": "Hemavathy Dam",
  "Harangi Dam": "Harangi Dam",
  "TG Halli": "TG Halli Reservoir",
};

// Which portal dam names to track per Karnataka district
const KARNATAKA_DISTRICT_DAMS: Record<string, string[]> = {
  mandya: ["K.R.Sagara Dam", "Hemavathy Dam"],
  mysuru: ["K.R.Sagara Dam", "Kabini Dam"],
  "bengaluru-urban": ["K.R.Sagara Dam"],
};

// Full Reservoir Level (FRL) in ft — static design values for Karnataka
const DAM_FRL: Record<string, number> = {
  "K.R.Sagara Dam": 2624.0,
  "Kabini Dam": 2284.0,
  "Hemavathy Dam": 2922.0,
  "Harangi Dam": 2859.0,
};

interface KarnatakaReservoir {
  ReservoirName: string;
  Date: string;
  PercentFull: number;
  Reservior_Level: number;
  StorageCapacity_AsPerDesign: number;
  TMC_GrossCapacity: number;
  Flow_Inflow: number;
  Flow_OutFlow: number;
}

function parseDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return null;
  const [dd, mon, yyyy] = parts;
  const month = months[mon];
  if (month === undefined) return null;
  const d = new Date(Date.UTC(parseInt(yyyy), month, parseInt(dd)));
  return isNaN(d.getTime()) ? null : d;
}

// ── Karnataka portal parser ─────────────────────────────────
async function scrapeKarnataka(ctx: JobContext): Promise<{ newCount: number }> {
  const targetDams = KARNATAKA_DISTRICT_DAMS[ctx.districtSlug];
  if (!targetDams || targetDams.length === 0) return { newCount: 0 };

  const res = await fetch(KARNATAKA_WATER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Referer: "https://water.karnataka.gov.in/ReservoirPublic",
      "User-Agent": "ForThePeople.in Data Aggregator",
    },
    body: "{}",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Karnataka water portal HTTP ${res.status}`);

  const json = await res.json();
  const geojson = JSON.parse(json.d ?? "{}");
  const features: { properties: KarnatakaReservoir }[] = geojson.features ?? [];

  let newCount = 0;
  for (const feature of features) {
    const p = feature.properties;
    if (!targetDams.includes(p.ReservoirName)) continue;

    const recordedAt = parseDate(p.Date);
    if (!recordedAt) continue;

    const existing = await prisma.damReading.findFirst({
      where: { districtId: ctx.districtId, damName: p.ReservoirName, recordedAt },
    });
    if (existing) continue;

    const configName = KARNATAKA_NAME_MAP[p.ReservoirName] ?? p.ReservoirName;
    const damConfig = getDamConfig(ctx.districtSlug);
    const dam = damConfig?.dams.find((d) => d.name === configName);

    await prisma.damReading.create({
      data: {
        districtId: ctx.districtId,
        damName: p.ReservoirName,
        damNameLocal: dam?.nameLocal ?? null,
        waterLevel: p.Reservior_Level ?? 0,
        maxLevel: DAM_FRL[p.ReservoirName] ?? 0,
        storage: p.TMC_GrossCapacity ?? 0,
        maxStorage: p.StorageCapacity_AsPerDesign ?? 0,
        inflow: p.Flow_Inflow ?? 0,
        outflow: p.Flow_OutFlow ?? 0,
        storagePct: typeof p.PercentFull === "number" ? p.PercentFull : 0,
        recordedAt,
        source: "Karnataka Water Resources Department",
      },
    });
    newCount++;
  }

  return { newCount };
}

// ── Cleanup old readings (keep last 48 per dam) ─────────────
async function cleanupOldReadings(districtId: string) {
  const damsInDb = await prisma.damReading.findMany({
    where: { districtId },
    distinct: ["damName"],
    select: { damName: true },
  });
  for (const { damName } of damsInDb) {
    const old = await prisma.damReading.findMany({
      where: { districtId, damName },
      orderBy: { recordedAt: "desc" },
      skip: 48,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.damReading.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    }
  }
}

// ── Main scraper entry point ────────────────────────────────
export async function scrapeDams(ctx: JobContext): Promise<ScraperResult> {
  const stateSlug = ctx.stateSlug ?? "karnataka";
  const damConfig = getDamConfig(ctx.districtSlug);

  // No dams configured for this district — skip gracefully
  if (!damConfig || damConfig.dams.length === 0) {
    ctx.log(`Dams: no dam config for district ${ctx.districtSlug} — skipping`);
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;

    // Karnataka: use the working state portal API
    if (stateSlug === "karnataka") {
      const result = await scrapeKarnataka(ctx);
      newCount = result.newCount;
    } else {
      // Other states: no live portal API available yet
      // India-WRIS has no public REST API (researched 2026-04-10)
      // Dam capacity data is available from dam-config.ts
      // Live storage data will be added when state portals are integrated
      ctx.log(`Dams: no live portal for state "${stateSlug}" — dam capacity data available from config, live levels pending`);
    }

    // Cleanup old readings
    await cleanupOldReadings(ctx.districtId);

    ctx.log(`Dams: ${newCount} new readings for ${ctx.districtSlug}`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

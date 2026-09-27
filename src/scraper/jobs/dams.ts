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
// Schedule: every 6 hours via /api/cron/scrape-dams (vercel.json).
//
// Sept 2026 (v5), see src/scraper/lib/dams.ts:
//  - One canonical name per dam; a reading is stored under the name the
//    district already uses (e.g. the seed's "Krishna Raja Sagara (KRS)"),
//    so the water page shows ONE card per dam, not a live one next to a
//    stale seed one.
//  - KRS full level fixed (2,624 ft was wrong; 2,468.8 ft = 752.50 m).
//  - Each reading keeps the portal's own date. Readings older than 7 days
//    (the portal still lists one from 2021), % full outside 0–105 or
//    disagreeing with storage ÷ capacity, and missing figures are rejected.
//  - The portal payload is fetched once per run, not once per district.
//  - If the portal revises a day's figures, the stored row is updated.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { getDamConfig } from "@/lib/constants/dam-config";
import {
  canonicalDam,
  checkedFullLevel,
  damReadingProblems,
  parsePortalDate,
  pickStoredName,
} from "../lib/dams";

// ── Karnataka state portal (the only working live source) ──
const KARNATAKA_WATER_URL =
  "https://water.karnataka.gov.in/CommonXyZABC.aspx/GetReservoirLocs";
export const KARNATAKA_DAM_SOURCE = "Karnataka Water Resources Department";

// Which portal reservoirs to track per Karnataka district (portal names).
const KARNATAKA_DISTRICT_DAMS: Record<string, string[]> = {
  mandya: ["K.R.Sagara Dam", "Hemavathy Dam"],
  mysuru: ["K.R.Sagara Dam", "Kabini Dam"],
  "bengaluru-urban": ["K.R.Sagara Dam"],
};

/**
 * True when a live reservoir feed exists for this district. Today that is
 * only the Karnataka portal for the districts mapped above; every other
 * district is "not collected", and the cron says so instead of counting
 * it as a successful run.
 */
export function hasLiveDamSource(stateSlug: string, districtSlug: string): boolean {
  return stateSlug === "karnataka" && (KARNATAKA_DISTRICT_DAMS[districtSlug]?.length ?? 0) > 0;
}

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

const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};

// One portal download per run (every Karnataka district reads the same payload).
let portalCache: { at: number; data: Promise<KarnatakaReservoir[]> } | null = null;
const PORTAL_CACHE_MS = 5 * 60_000;

function loadKarnatakaPortal(): Promise<KarnatakaReservoir[]> {
  if (portalCache && Date.now() - portalCache.at < PORTAL_CACHE_MS) return portalCache.data;
  const data = (async () => {
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
    return features.map((f) => f.properties);
  })();
  portalCache = { at: Date.now(), data };
  // A failed download must not be cached for the next district.
  data.catch(() => {
    if (portalCache?.data === data) portalCache = null;
  });
  return data;
}

// ── Karnataka portal parser ─────────────────────────────────
async function scrapeKarnataka(ctx: JobContext): Promise<{ newCount: number; updatedCount: number }> {
  const targetDams = KARNATAKA_DISTRICT_DAMS[ctx.districtSlug];
  if (!targetDams || targetDams.length === 0) return { newCount: 0, updatedCount: 0 };

  const reservoirs = await loadKarnatakaPortal();
  const existingNames = (
    await prisma.damReading.findMany({
      where: { districtId: ctx.districtId },
      distinct: ["damName"],
      select: { damName: true, damNameLocal: true },
    })
  );

  let newCount = 0;
  let updatedCount = 0;
  const now = Date.now();
  for (const p of reservoirs) {
    if (!targetDams.includes(p.ReservoirName)) continue;

    const figures = {
      date: parsePortalDate(p.Date),
      percentFull: num(p.PercentFull),
      level: num(p.Reservior_Level),
      storage: num(p.TMC_GrossCapacity),
      maxStorage: num(p.StorageCapacity_AsPerDesign),
      inflow: num(p.Flow_Inflow),
      outflow: num(p.Flow_OutFlow),
    };
    const problems = damReadingProblems(figures, now);
    if (problems.length > 0) {
      ctx.log(`${p.ReservoirName} (${p.Date}): rejected — ${problems.join(", ")}`);
      continue;
    }
    // damReadingProblems() guarantees these are present.
    const recordedAt = figures.date as Date;
    const level = figures.level as number;

    const damName = pickStoredName(p.ReservoirName, existingNames.map((e) => e.damName));
    const fullLevel = checkedFullLevel(p.ReservoirName, level);
    if (fullLevel.mismatch) {
      ctx.log(`${p.ReservoirName}: level ${level} ft is above our full level — full level stored as unknown; check CANONICAL_DAMS`);
    }
    const data = {
      waterLevel: level,
      maxLevel: fullLevel.frlFt,
      storage: figures.storage as number,
      maxStorage: figures.maxStorage as number,
      inflow: figures.inflow as number,
      outflow: figures.outflow as number,
      storagePct: figures.percentFull as number,
    };

    const existing = await prisma.damReading.findFirst({
      where: { districtId: ctx.districtId, damName, recordedAt },
    });
    if (existing) {
      // Same day already stored: update only if the portal revised the figures.
      const changed = (Object.keys(data) as Array<keyof typeof data>).some((k) => existing[k] !== data[k]);
      if (changed) {
        await prisma.damReading.update({
          where: { id: existing.id },
          data: { ...data, source: KARNATAKA_DAM_SOURCE, fetchedAt: new Date() },
        });
        updatedCount++;
      }
      continue;
    }

    const local =
      existingNames.find((e) => e.damName === damName)?.damNameLocal ?? canonicalDam(p.ReservoirName)?.nameLocal ?? null;
    await prisma.damReading.create({
      data: {
        districtId: ctx.districtId,
        damName,
        damNameLocal: local,
        ...data,
        recordedAt,
        source: KARNATAKA_DAM_SOURCE,
      },
    });
    newCount++;
  }

  return { newCount, updatedCount };
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
    let updatedCount = 0;

    // Karnataka: use the working state portal API
    if (stateSlug === "karnataka") {
      const result = await scrapeKarnataka(ctx);
      newCount = result.newCount;
      updatedCount = result.updatedCount;
    } else {
      // Other states: no live portal API available yet
      // India-WRIS has no public REST API (researched 2026-04-10)
      // Dam capacity data is available from dam-config.ts
      // Live storage data will be added when state portals are integrated
      ctx.log(`Dams: no live portal for state "${stateSlug}" — dam capacity data available from config, live levels pending`);
    }

    // Cleanup old readings
    await cleanupOldReadings(ctx.districtId);

    ctx.log(`Dams: ${newCount} new, ${updatedCount} revised readings for ${ctx.districtSlug}`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

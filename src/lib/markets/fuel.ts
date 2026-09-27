/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Petrol and diesel prices — the stored, double-checked snapshot
//
//   key   ftp:data:fuel        (Redis, no expiry)
//   value FuelSnapshot         (src/scraper/lib/fuel-prices.ts)
//
// Written only by /api/cron/scrape-fuel after every check passed; a failed
// run leaves the previous snapshot in place. It carries its own "as on"
// day, so a page can say how old it is. Read by /api/data/prices and the
// home page (through Next's data cache there, see home-markets.ts).
// ═══════════════════════════════════════════════════════════
import { redis } from "@/lib/redis";
import { isFuelSnapshot, type FuelSnapshot } from "@/scraper/lib/fuel-prices";

export const FUEL_KEY = "ftp:data:fuel";

/** The latest verified snapshot, or null (none yet, Redis unavailable, or not readable). */
export async function readFuelSnapshot(): Promise<FuelSnapshot | null> {
  if (!redis) return null;
  try {
    const v = await redis.get<FuelSnapshot>(FUEL_KEY);
    return isFuelSnapshot(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Store a verified snapshot. "created" (first one), "changed" (a price or
 * the day moved) or "confirmed" (same prices and day, newer fetch).
 * Throws when Redis is not configured, so the run is recorded as failed.
 */
export async function writeFuelSnapshot(snap: FuelSnapshot): Promise<"created" | "changed" | "confirmed"> {
  if (!redis) throw new Error("Redis is not configured (REDIS_URL / REDIS_TOKEN)");
  const prev = await redis.get<FuelSnapshot>(FUEL_KEY);
  await redis.set(FUEL_KEY, snap);
  if (!isFuelSnapshot(prev)) return "created";
  const same = prev.asOf === snap.asOf && JSON.stringify(prev.cities) === JSON.stringify(snap.cities);
  return same ? "confirmed" : "changed";
}

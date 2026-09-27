/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// District figures that have no table yet, kept in Redis
//
// Some official sources publish one set of district figures (UDISE+
// school statistics, the NREGA "at a glance" page) that no Prisma model
// can hold today: School is one row per school, GramPanchayat one row
// per village council. CLAUDE.md: "Prefer existing tables or Redis keys
// over new columns". So the collectors store the latest verified
// snapshot per district in Redis, without expiry:
//
//   key   ftp:data:<kind>:<districtSlug>      e.g. ftp:data:udise:mandya
//   value DistrictSnapshot (JSON)
//
// A snapshot is written only after every check passed; a failed run
// leaves the previous one in place (it carries its own dates, so the
// page can say how old it is). readDistrictSnapshot() is what a data
// route or page loader calls. A proper table (DistrictIndicator) is
// proposed in the collectors' hand-over notes; when it exists, the
// collectors write there instead and this file goes away.
// ═══════════════════════════════════════════════════════════
import { redis } from "@/lib/redis";

export type SnapshotKind = "udise" | "mgnrega";

export interface DistrictSnapshot<T> {
  kind: SnapshotKind;
  districtSlug: string;
  /** Who publishes it, e.g. "UDISE+ (Ministry of Education)". */
  source: string;
  /** A page a citizen can open to check the figures. */
  sourceUrl: string;
  /** The period the figures are for: school year "2025-26" or financial year "2026-2027". */
  period: string | null;
  /** The source's own date (YYYY-MM-DD) when it prints one, else null ("date not published by the source"). */
  asOf: string | null;
  /** When we fetched and checked it (ISO). */
  fetchedAt: string;
  data: T;
}

export const snapshotKey = (kind: SnapshotKind, slug: string) => `ftp:data:${kind}:${slug}`;

/** Latest verified snapshot, or null (none yet, or Redis unavailable). */
export async function readDistrictSnapshot<T>(kind: SnapshotKind, slug: string): Promise<DistrictSnapshot<T> | null> {
  if (!redis) return null;
  try {
    return (await redis.get<DistrictSnapshot<T>>(snapshotKey(kind, slug))) ?? null;
  } catch {
    return null;
  }
}

/**
 * Store a verified snapshot. Returns "created", "changed" (figures differ
 * from the stored ones) or "confirmed" (same figures, newer fetch date).
 * Throws when Redis is not configured, so the run is recorded as failed
 * instead of silently writing nowhere.
 */
export async function writeDistrictSnapshot<T>(snap: DistrictSnapshot<T>): Promise<"created" | "changed" | "confirmed"> {
  if (!redis) throw new Error("Redis is not configured (REDIS_URL / REDIS_TOKEN)");
  const key = snapshotKey(snap.kind, snap.districtSlug);
  const prev = await redis.get<DistrictSnapshot<T>>(key);
  await redis.set(key, snap);
  if (!prev) return "created";
  const same = JSON.stringify(prev.data) === JSON.stringify(snap.data) && prev.period === snap.period;
  return same ? "confirmed" : "changed";
}

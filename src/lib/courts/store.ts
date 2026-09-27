/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Courts — where the NJDG snapshot is kept (Upstash Redis, REST)
//
//   ftp:courts:njdg:<district>        the district's snapshot (CourtsSnapshot)
//   ftp:courts:njdg-hc:<stateCode>    a High Court read, shared by the
//                                     state's districts within one day
//
// Redis, not a new table: CourtStat has no columns for civil/criminal,
// case age or time-to-decide, and the rule is "prefer existing tables or
// Redis keys over new columns". The durable part (cases filed / decided
// this year, cases waiting) is also written to CourtStat by the
// collector, so the page still has figures if this key is lost. A
// proposed table for the full snapshot is in the courts hand-over notes.
//
// Snapshots expire after 120 days only as housekeeping (a district that
// is switched off); the page shows an "N days old" notice long before.
// ═══════════════════════════════════════════════════════════

import { redis } from "@/lib/redis";
import { SNAPSHOT_VERSION, type CourtUnitSnapshot, type CourtsSnapshot } from "./snapshot";

const SNAPSHOT_TTL_S = 120 * 24 * 3600;
/** A High Court read is reused by the state's other districts for this long. */
export const HIGH_COURT_REUSE_MS = 20 * 3600 * 1000;

export function courtsSnapshotKey(districtSlug: string): string {
  return `ftp:courts:njdg:${districtSlug}`;
}

export function highCourtKey(stateCode: string): string {
  return `ftp:courts:njdg-hc:${stateCode}`;
}

export interface StoredHighCourt {
  fetchedAt: string;
  unit: CourtUnitSnapshot;
}

function isSnapshot(v: unknown): v is CourtsSnapshot {
  if (!v || typeof v !== "object") return false;
  const s = v as Partial<CourtsSnapshot>;
  return s.v === SNAPSHOT_VERSION && typeof s.fetchedAt === "string" && Array.isArray(s.units);
}

export async function readCourtsSnapshot(districtSlug: string): Promise<CourtsSnapshot | null> {
  if (!redis) return null;
  try {
    const v = await redis.get<unknown>(courtsSnapshotKey(districtSlug));
    return isSnapshot(v) ? v : null;
  } catch {
    return null;
  }
}

export async function writeCourtsSnapshot(snapshot: CourtsSnapshot): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.set(courtsSnapshotKey(snapshot.district), snapshot, { ex: SNAPSHOT_TTL_S });
    return true;
  } catch {
    return false;
  }
}

export async function readHighCourt(stateCode: string): Promise<StoredHighCourt | null> {
  if (!redis) return null;
  try {
    const v = await redis.get<StoredHighCourt>(highCourtKey(stateCode));
    return v && typeof v.fetchedAt === "string" && v.unit ? v : null;
  } catch {
    return null;
  }
}

export async function writeHighCourt(stateCode: string, hc: StoredHighCourt): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(highCourtKey(stateCode), hc, { ex: SNAPSHOT_TTL_S });
  } catch {
    // non-fatal: the next district of the state reads NJDG again
  }
}

/** When each district was last read, for "oldest first" ordering in the cron. */
export async function snapshotAges(districtSlugs: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!redis || districtSlugs.length === 0) return out;
  try {
    const values = await redis.mget<unknown[]>(...districtSlugs.map(courtsSnapshotKey));
    districtSlugs.forEach((slug, i) => {
      const v = values[i];
      if (isSnapshot(v)) out.set(slug, Date.parse(v.fetchedAt));
    });
  } catch {
    // unknown ages: every district counts as never read
  }
  return out;
}

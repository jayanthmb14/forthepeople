/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Dams check — parsing and comparison (pure)
//
// Second sources looked at (Sept 2026):
//   - Karnataka Water Resources Department portal (POST GetReservoirLocs):
//     the SAME publisher our collector uses, re-read now. It proves our
//     copy is faithful and current, not that the figure is right, so it
//     can only give "single-source" (reason "same-publisher").
//   - KSNDMC Reservoir_Details.aspx now serves the KSNDMC home page (no
//     table) and its dashboard (ksndmc.org:804) has weather only.
//   - CWC weekly bulletin listing stops at 8 May 2025 (PDF).
// Neither is usable today; see docs/VERIFICATION.md → "Adding a source".
// ═══════════════════════════════════════════════════════════
import { canonicalDam, parsePortalDate } from "@/scraper/lib/dams";
import { compareDamPercent, fmtNumber, istDayKey } from "./compare";
import type { SourceCheck } from "./types";

export interface PortalReservoir {
  name: string;
  date: Date | null;
  percentFull: number | null;
}

const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};

/** The portal replies `{ d: "<GeoJSON as a string>" }`; each feature's properties is one reservoir. */
export function parseKarnatakaReservoirs(json: unknown): PortalReservoir[] {
  const d = (json as { d?: unknown } | null)?.d;
  if (typeof d !== "string") return [];
  let geo: { features?: Array<{ properties?: Record<string, unknown> }> };
  try {
    geo = JSON.parse(d);
  } catch {
    return [];
  }
  return (geo.features ?? [])
    .map((f) => f.properties ?? {})
    .filter((p) => typeof p.ReservoirName === "string")
    .map((p) => ({
      name: String(p.ReservoirName),
      date: parsePortalDate(typeof p.Date === "string" ? p.Date : null),
      percentFull: num(p.PercentFull),
    }));
}

/** The portal reservoir that is the same dam as a stored name (any spelling), or null. */
export function findSameDam(storedName: string, reservoirs: readonly PortalReservoir[]): PortalReservoir | null {
  const dam = canonicalDam(storedName);
  if (!dam) return reservoirs.find((r) => r.name.toLowerCase() === storedName.toLowerCase()) ?? null;
  return reservoirs.find((r) => canonicalDam(r.name) === dam) ?? null;
}

export interface DamRecheck {
  check: SourceCheck;
  /** Reason when the values were not compared. */
  reason: "stored-older-than-source" | "source-older-than-stored" | null;
  note: string;
}

/**
 * Compare a stored reading with the portal's reading for the same dam.
 * Only readings of the same Indian day are compared (±2 points); when the
 * portal has a newer day our copy is behind ("stored-older-than-source").
 */
export function recheckDam(
  stored: { storagePct: number; recordedAt: Date },
  portal: PortalReservoir,
  opts: { sourceLabel: string; independent: boolean; url: string },
): DamRecheck {
  const value = portal.percentFull === null ? null : `${fmtNumber(portal.percentFull)}% full`;
  const asOf = portal.date ? portal.date.toISOString() : null;
  const base = { source: opts.sourceLabel, value, independent: opts.independent, url: opts.url, asOf };
  if (portal.percentFull === null || !portal.date) {
    return { check: { ...base, agreed: null }, reason: null, note: `${portal.name}: the portal gives no % full or date.` };
  }
  const ours = istDayKey(stored.recordedAt);
  const theirs = istDayKey(portal.date);
  if (ours < theirs) {
    return { check: { ...base, agreed: null }, reason: "stored-older-than-source", note: `Our reading is for ${ours}; the portal already has ${theirs} (${value}).` };
  }
  if (ours > theirs) {
    return { check: { ...base, agreed: null }, reason: "source-older-than-stored", note: `Our reading is for ${ours}; the portal now shows ${theirs}.` };
  }
  const agreed = compareDamPercent(stored.storagePct, portal.percentFull);
  return {
    check: { ...base, agreed },
    reason: null,
    note: `${fmtNumber(stored.storagePct)}% (ours) vs ${value} (portal), same day ${ours}.`,
  };
}

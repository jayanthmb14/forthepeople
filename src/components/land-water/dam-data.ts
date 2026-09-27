/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Dam readings — pure helpers shared by the water page and its sheet
// ═══════════════════════════════════════════════════════════════════════
//  Sept 2026 audit:
//   - One dam, one name: KRS was "Krishna Raja Sagara (KRS)" in Mandya and
//     "KRS Dam (Krishnaraja Sagara)" in Mysuru (old per-district seed
//     spellings), so the river lookup missed it. Every known spelling now
//     maps to one canonical dam (CANONICAL_DAMS, src/scraper/lib/dams.ts).
//   - Per cent full: the Karnataka portal's PercentFull is a whole number
//     cut down (Kabini 56 for 11.048 of 19.516 TMC = 56.6 %). The page
//     showed it as "56.0%", a decimal the portal never gave. When both
//     TMC figures are published the share is worked out from them (one
//     decimal); otherwise the portal's whole number is shown as it is.

import type { DamReading } from "@/hooks/useRealtimeData";
import { canonicalDam } from "@/scraper/lib/dams";

/** The key readings of one dam are grouped by: its canonical name, else the stored name. */
export function damKey(name: string): string {
  return canonicalDam(name)?.name ?? name;
}

/** The name (and Kannada name) to show for a reading: the canonical dam's, else the stored ones. */
export function shownDamName(d: Pick<DamReading, "damName" | "damNameLocal">): { damName: string; damNameLocal: string | null } {
  const c = canonicalDam(d.damName);
  return { damName: c?.name ?? d.damName, damNameLocal: c?.nameLocal ?? d.damNameLocal ?? null };
}

/** True when two stored names are the same dam (any known spelling). */
export function sameDam(a: string, b: string): boolean {
  if (a === b) return true;
  const ca = canonicalDam(a);
  return ca !== null && ca === canonicalDam(b);
}

/**
 * How full the dam is, in per cent, and how many decimals that figure
 * honestly has: storage ÷ capacity (1 decimal) when both are published,
 * else the portal's stored whole number (0 decimals).
 */
export function fillPct(d: Pick<DamReading, "storage" | "maxStorage" | "storagePct">): { pct: number; digits: 0 | 1 } {
  if (d.maxStorage > 0 && d.storage >= 0) return { pct: (d.storage / d.maxStorage) * 100, digits: 1 };
  return { pct: d.storagePct, digits: 0 };
}

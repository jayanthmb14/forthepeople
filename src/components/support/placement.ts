/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Where a supporter's name is shown — by tier or amount, not by
//  "monthly or one-time"
// ═══════════════════════════════════════════════════════════════════════
//
//  The support page promises:
//    • Founding Builder / All-India Patron → every page, founder first;
//    • State Champion                      → every district in that state;
//    • District Champion                   → the district they chose.
//
//  /api/data/contributors already decides WHO is visible on a district page
//  by tier OR amount (a one-time ₹50,000 gift counts like a founder). The old
//  "Backed by" block then threw away everyone who was not a monthly
//  subscriber, so the one Founding Builder (a one-time gift) never appeared
//  and every district said "All India — Be the first". This file puts each
//  visible supporter on the right row using the same rule as the API. The
//  thresholds are the tier prices, so they can never drift from what the
//  support page sells.

import { TIER_CONFIG, TIER_PRIORITY } from "@/lib/constants/razorpay-plans";

export type PlacementLevel = "india" | "state" | "district";

/** The fields placement needs (a subset of the public contributor row). */
export interface PlacedSupporter {
  id: string;
  name: string;
  tier: string;
  /** Only one-time gifts carry an amount in the public API (null for monthly). */
  amount?: number | null;
  isRecurring?: boolean;
}

const NATIONAL_FROM = TIER_CONFIG.patron.amount; // ₹9,999
const STATE_FROM = TIER_CONFIG.state.amount; // ₹999

/** Which row a supporter belongs on. */
export function placementLevel(s: PlacedSupporter): PlacementLevel {
  const amount = typeof s.amount === "number" ? s.amount : 0;
  if (s.tier === "founder" || s.tier === "patron" || amount >= NATIONAL_FROM) return "india";
  if (s.tier === "state" || amount >= STATE_FROM) return "state";
  return "district";
}

/** A founder gift (tier, or ≥ the founder price) — shown first, with its own label. */
export function isFoundingBuilder(s: PlacedSupporter): boolean {
  const amount = typeof s.amount === "number" ? s.amount : 0;
  return s.tier === "founder" || amount >= TIER_CONFIG.founder.amount;
}

function rank(s: PlacedSupporter): number {
  if (isFoundingBuilder(s)) return 100;
  return TIER_PRIORITY[s.tier] ?? 0;
}

export interface PlacedRow<T extends PlacedSupporter> {
  /** Named supporters, founder first, one chip per name. */
  named: T[];
  /** How many chose not to show their name. */
  anonymous: number;
}

/**
 * Split supporters into the India / state / district rows. Within a row the
 * Founding Builder comes first, then higher tiers, then the order the API
 * sent (amount, then how long they have supported). A name that appears
 * twice on the same row (two gifts) is shown once. "Anonymous" rows are
 * counted, not listed.
 */
export function placeSupporters<T extends PlacedSupporter>(list: T[]): Record<PlacementLevel, PlacedRow<T>> {
  const rows: Record<PlacementLevel, PlacedRow<T>> = {
    india: { named: [], anonymous: 0 },
    state: { named: [], anonymous: 0 },
    district: { named: [], anonymous: 0 },
  };
  const seen: Record<PlacementLevel, Set<string>> = { india: new Set(), state: new Set(), district: new Set() };
  const ordered = list
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(b.s) - rank(a.s) || a.i - b.i)
    .map((x) => x.s);
  for (const s of ordered) {
    const level = placementLevel(s);
    const name = (s.name ?? "").trim();
    if (!name || name === "Anonymous") {
      rows[level].anonymous += 1;
      continue;
    }
    const key = name.toLowerCase();
    if (seen[level].has(key)) continue;
    seen[level].add(key);
    rows[level].named.push(s);
  }
  return rows;
}

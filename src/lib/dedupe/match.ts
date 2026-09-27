/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// "Is this already stored?" — the lookup every writer does before it
// creates a named row (pure, no DB, unit-tested in tests/dedupe-guard.test.ts)
//
// Writers load the rows of the same place (one district) and call
// findSameNamed() before creating:
//   exact    — same nameKey ("Atal Setu" = "Mumbai Trans Harbour Link",
//              "Metro Phase II" = "Metro Phase 2"), or the same 2+-word
//              short name when the full names are at least half alike;
//   similar  — similarity() ≥ threshold (0.85 by default);
// never across different numbers ("Phase 1" vs "Phase 2"). A match is
// updated fill-only instead of creating a second row.
// ═══════════════════════════════════════════════════════════
import { nameKey, nameTokens, numbersConflict, similarity } from "./keys";

/** Similarity at or above which a writer treats an incoming name as a row it already has. */
export const SAME_NAME_THRESHOLD = 0.85;

export interface Named {
  name: string;
  shortName?: string | null;
}

export interface NameMatch<T> {
  row: T;
  how: "exact" | "short-name" | "similar";
  score: number;
}

/** The stored row that is the same thing as `incoming`, or null. Best score wins; exact beats similar. */
export function findSameNamed<T extends Named>(
  pool: readonly T[],
  incoming: Named,
  opts: { threshold?: number; exactOnly?: boolean } = {},
): NameMatch<T> | null {
  const threshold = opts.threshold ?? SAME_NAME_THRESHOLD;
  const key = nameKey(incoming.name);
  const shortKey = incoming.shortName && nameTokens(incoming.shortName).length >= 2 ? nameKey(incoming.shortName) : "";
  let best: NameMatch<T> | null = null;
  for (const row of pool) {
    if (numbersConflict(row.name, incoming.name)) continue;
    let m: NameMatch<T> | null = null;
    if (key && nameKey(row.name) === key) m = { row, how: "exact", score: 1 };
    // Same 2+-word short name only counts when the full names are also half alike:
    // "Namma Metro" is the short name of several different lines.
    else if (shortKey && row.shortName && nameKey(row.shortName) === shortKey && similarity(row.name, incoming.name) >= 0.5) {
      m = { row, how: "short-name", score: 0.95 };
    } else if (!opts.exactOnly) {
      const score = similarity(row.name, incoming.name);
      if (score >= threshold) m = { row, how: "similar", score };
    }
    if (m && (!best || m.score > best.score)) best = m;
    if (best?.score === 1) break;
  }
  return best;
}

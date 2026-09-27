/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Sanity checks shared by the collectors (pure: no DB, no network)
//
// Rule (CLAUDE.md): never fabricate data when a source fails or a field
// is missing — write nothing. These helpers turn "a field we could not
// read" into null so the caller can skip the row, instead of the old
// `?? 0` / `* 0.85` fallbacks that stored invented figures.
// ═══════════════════════════════════════════════════════════

/**
 * Parse an amount or count from a source field.
 * Returns null for missing, empty, non-numeric or negative values.
 * Accepts numbers and strings like "1,23,456.78" (Indian grouping).
 */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[,\s₹]/g, "");
  if (cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** First field of `rec` (in order) that parses as an amount, else null. */
export function firstAmount(rec: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = parseAmount(rec[k]);
    if (n !== null) return n;
  }
  return null;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Insight input check — PURE, unit-tested (tests/insight-data.test.ts).
//
// The insight generator sends a module's /api/data payload to a paid model.
// When the payload is empty (no rows at all) the model still wrote a generic
// "watch" verdict about nothing (Sept 2026 audit: Pune weather, alerts,
// power and courts). isEmptyModuleData() says "nothing to judge" so the
// generator skips the call and writes nothing.
// ═══════════════════════════════════════════════════════════

/**
 * True when the payload holds no data:
 *   null / undefined / "" / [] / {}
 *   or an object whose every value is itself empty
 *   (e.g. { stations: [], crime: [], traffic: [] }).
 * Numbers, booleans and non-empty strings count as data.
 */
export function isEmptyModuleData(value: unknown, depth = 0): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number" || typeof value === "boolean") return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    if (depth > 4) return false; // deep structure: assume it holds something
    const values = Object.values(value as Record<string, unknown>);
    return values.every((v) => isEmptyModuleData(v, depth + 1));
  }
  return false;
}

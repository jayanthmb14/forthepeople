/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Redis keys of the public verification summary (/api/data/verification).
// District summaries use the shared cacheKey(district, "verification").
export const VERIFICATION_MODULE = "verification";

/** Cache key of a state-wide summary (?state= without ?district=). */
export function stateCacheKey(stateSlug: string): string {
  return `ftp:state:${stateSlug}:${VERIFICATION_MODULE}`;
}

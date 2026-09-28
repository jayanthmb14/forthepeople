/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Small shared pieces of the public read routes under /api/data (pure).

/** A district or state slug as the read routes accept it ("mandya", "bengaluru-urban"). */
export const SLUG_RE = /^[a-z0-9-]{1,64}$/;

/** True for a well-formed slug; anything else is answered 400 before any cache or database work. */
export function isSlug(value: string | null | undefined): value is string {
  return typeof value === "string" && SLUG_RE.test(value);
}

/** Cache-Control for a public read: the CDN keeps it `ttlSeconds`, and serves it stale for twice that while it refreshes. */
export function publicCacheHeaders(ttlSeconds: number): { "Cache-Control": string } {
  return { "Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}` };
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Redis keys of the public supporter lists, in one place, so the routes
// that change a Supporter row (payment verify, webhook, admin edits) clear
// the SAME keys the list routes write. Bump a version here when what a
// list may contain changes (v8 / v4 / v2, Sept 2026: names that look like
// a phone number or e-mail address are masked as "Supporter").

export const CONTRIBUTOR_KEYS = {
  /** /api/payment/contributors */
  payment: "ftp:contributors:v8",
  /** /api/data/contributors (no type) */
  all: "ftp:contributors:all:v2",
  leaderboard: "ftp:contributors:leaderboard:v2",
  topTier: "ftp:contributors:top-tier:v4",
  /** Counts only, no names. */
  districtRankings: "ftp:contributors:district-rankings",
  /** Counts only, no names. */
  growthTrend: "ftp:contributors:growth-trend",
  statePage: (stateSlug: string) => `ftp:contributors:state-page:${stateSlug}:v4`,
  district: (districtSlug: string, stateSlug: string) => `ftp:contributors:district:${districtSlug}:${stateSlug}:v4`,
} as const;

/** Every fixed key (the per-state / per-district ones are cleared by pattern, or expire in 2 min). */
export const CONTRIBUTOR_CACHE_KEYS: readonly string[] = [
  CONTRIBUTOR_KEYS.payment,
  CONTRIBUTOR_KEYS.all,
  CONTRIBUTOR_KEYS.leaderboard,
  CONTRIBUTOR_KEYS.topTier,
  CONTRIBUTOR_KEYS.districtRankings,
  CONTRIBUTOR_KEYS.growthTrend,
];

/** Patterns for the per-state and per-district lists (Redis SCAN MATCH). */
export const CONTRIBUTOR_KEY_PATTERNS: readonly string[] = ["ftp:contributors:district:*", "ftp:contributors:state-page:*"];

/**
 * Clear every public supporter list — the fixed keys and the per-district /
 * per-state lists — after any change to a Supporter row (payment verify,
 * webhook, admin edits), so the walls and sponsor banners show it at once.
 * Best-effort: a Redis problem is logged, never thrown (the lists also
 * expire on their own within minutes). Redis is imported lazily so the key
 * list above stays importable anywhere, tests included.
 */
export async function bustSupporterCaches(): Promise<void> {
  const { redis } = await import("@/lib/redis");
  if (!redis) return;
  try {
    await redis.del(...CONTRIBUTOR_CACHE_KEYS);
    for (const pattern of CONTRIBUTOR_KEY_PATTERNS) {
      // SCAN (never KEYS, which blocks Redis); "0" ends the walk.
      let cursor = "0";
      do {
        const [next, keys] = await redis.scan(cursor, { match: pattern, count: 1000 });
        if (keys.length > 0) await redis.del(...keys);
        cursor = String(next);
      } while (cursor !== "0");
    }
  } catch (err) {
    console.error("[supporter-cache] clearing the supporter lists failed:", err instanceof Error ? err.message : err);
  }
}

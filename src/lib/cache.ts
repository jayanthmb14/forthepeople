/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Redis cache helpers
// ═══════════════════════════════════════════════════════════
import redis from "./redis";

export function cacheKey(districtSlug: string, module: string): string {
  return `ftp:${districtSlug}:${module}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redis) return null;
    // @upstash/redis returns parsed JSON automatically
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    if (!redis) return;
    // @upstash/redis uses { ex: seconds } instead of ioredis "EX", seconds
    await redis.set(key, data, { ex: ttlSeconds });
  } catch {
    // Non-fatal: proceed without cache
  }
}

/**
 * Drop a district's cached /api/data responses for these modules — and,
 * when `locales` is given, their translated copies (`<key>@<locale>`, which
 * the data route writes for "news"). Call it after a write so pages show
 * the new rows at once. Never throws: returns false when Redis refused
 * (the entries then expire by their TTL), true otherwise.
 */
export async function dropModuleCaches(
  districtSlug: string,
  modules: readonly string[],
  opts: { locales?: readonly string[] } = {},
): Promise<boolean> {
  if (!redis || modules.length === 0) return true;
  const keys = modules.flatMap((m) => {
    const base = cacheKey(districtSlug, m);
    return [base, ...(opts.locales ?? []).map((l) => `${base}@${l}`)];
  });
  try {
    await redis.del(...keys);
    return true;
  } catch {
    return false;
  }
}

/** TTL by module — live data shorter, stable data longer */
export function getModuleTTL(module: string): number {
  const live = new Set(["crops", "weather", "water", "dam", "alerts", "news", "power"]);
  const stable = new Set(["leaders", "offices", "elections", "schools", "services", "taluks", "exams"]);
  if (live.has(module)) return 60;
  if (stable.has(module)) return 600;
  return 300;
}

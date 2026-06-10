/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */
import { redis } from "./redis";
import { createHash } from "crypto";

/**
 * Extract the client IP from a request (x-forwarded-for first, then x-real-ip).
 * Accepts both `Request` and `NextRequest` (which extends `Request`).
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Hash an IP with VOTE_IP_SALT before using it as a rate-limit key, so raw IPs
 * are never persisted anywhere. Same approach as /api/district-request.
 */
export function hashIp(ip: string): string {
  const salt = process.env.VOTE_IP_SALT || "forthepeople-default-salt";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

/** Clear a rate-limit counter (e.g. on a successful admin login). Best-effort. */
export async function resetRateLimit(identifier: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`rate:${identifier}`);
  } catch {
    // non-fatal
  }
}

/**
 * Simple sliding-window rate limiter using Upstash Redis.
 * Falls back to "allow" if Redis is unavailable.
 *
 * @param identifier - unique key (e.g. IP address + route)
 * @param limit      - max requests per window (default: 60)
 * @param window     - window size in seconds (default: 60)
 */
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  window: number = 60
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    // Redis unavailable — degrade gracefully (allow all)
    return { success: true, remaining: limit };
  }

  const key = `rate:${identifier}`;
  try {
    const current = (await redis.incr(key)) as number;
    if (current === 1) {
      await redis.expire(key, window);
    }
    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch {
    // Redis error — degrade gracefully
    return { success: true, remaining: limit };
  }
}

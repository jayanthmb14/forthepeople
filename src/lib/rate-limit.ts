/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */
import { redis } from "./redis";
import { createHash } from "crypto";

/**
 * Extract the client IP from a request (x-forwarded-for first, then x-real-ip).
 * Accepts both `Request` and `NextRequest` (which extends `Request`).
 *
 * On Vercel the platform overwrites `x-forwarded-for` with the real client IP,
 * so a caller cannot spoof it to dodge a limiter.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Same as getClientIp() but for the `headers()` object you get inside a
 * Server Action or a server component (no Request object there).
 */
export function getClientIpFromHeaders(h: { get(name: string): string | null }): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
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

export interface RateLimitOptions {
  /**
   * When true, a Redis outage DENIES the request instead of allowing it.
   *
   * Use this for anything that guards a credential check (admin login, TOTP,
   * header auth, 2FA recovery). For public features like feedback or votes the
   * default (fail open) is the better trade-off: a Redis blip should not take
   * citizen features down, but it must never open the admin door.
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  /** True when the caller is still within the limit. */
  success: boolean;
  /** Requests left in the current window (0 when denied). */
  remaining: number;
  /**
   * True when Redis was unreachable and the result came from the
   * fail-open/fail-closed policy rather than a real counter. Useful for logs.
   */
  degraded?: boolean;
}

/**
 * Simple fixed-window rate limiter using Upstash Redis.
 *
 * Default behaviour on a Redis outage is "allow" (fail open). Pass
 * `{ failClosed: true }` to deny instead — required for every auth-sensitive
 * limiter (see RateLimitOptions).
 *
 * @param identifier - unique key (e.g. hashed IP + route)
 * @param limit      - max requests per window (default: 60)
 * @param window     - window size in seconds (default: 60)
 * @param options    - { failClosed } — see above
 */
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  window: number = 60,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const failClosed = options.failClosed === true;

  // Redis not configured at all (REDIS_URL / REDIS_TOKEN missing).
  if (!redis) {
    if (failClosed) {
      console.warn(
        JSON.stringify({ event: "rate_limit_fail_closed", identifier, reason: "redis_unconfigured" })
      );
      return { success: false, remaining: 0, degraded: true };
    }
    return { success: true, remaining: limit, degraded: true };
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
    // Redis error (network, auth, quota). Apply the policy the caller chose.
    if (failClosed) {
      console.warn(
        JSON.stringify({ event: "rate_limit_fail_closed", identifier, reason: "redis_error" })
      );
      return { success: false, remaining: 0, degraded: true };
    }
    return { success: true, remaining: limit, degraded: true };
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

/**
 * Admin authentication — signed, expiring, server-revocable sessions.
 *
 * Full flow (see docs/RUNBOOKS/admin-auth.md for the operator view):
 *
 *   password ──► signed "TOTP pending" token (5 min, Redis-bound, IP-bound)
 *            ──► 6-digit code / backup code ──► signed session cookie (8 h)
 *
 * A session is:
 *   - a random 32-byte id stored in Upstash Redis under `admin:session:<id>`
 *     with an 8-hour TTL — delete the key to revoke the session instantly; AND
 *   - a signed cookie token `<id>.<expiryMs>.<hmac>`, where
 *     `hmac = HMAC-SHA256("<id>.<expiryMs>", ADMIN_SESSION_SECRET)`.
 *
 * Two entry points:
 *
 *   requireAdmin()        — cookie session OR the header path (below).
 *                           Use for ordinary admin API routes.
 *   requireAdminCookie()  — cookie session ONLY. Use for anything that must
 *                           have passed 2FA: 2FA setup/verify/disable, the
 *                           recovery e-mail/phone, logout-all, the API-key
 *                           vault (requireVaultSession) and revealing a
 *                           stored service login.
 *
 * The header path (`x-admin-secret` / `x-admin-password` == ADMIN_PASSWORD)
 * exists for curl/ops scripts. It is compared in constant time, its FAILURES
 * are rate-limited (10 per 15 min per IP, fail closed) and every failure is
 * logged. `Authorization: Bearer <SEED_SECRET>` is NO LONGER accepted here —
 * SEED_SECRET is scoped to /api/admin/seed-tenders only.
 */

import { cookies, headers } from "next/headers";
import { createHmac, randomBytes } from "crypto";
import redis from "@/lib/redis";
import { getClientIpFromHeaders, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  TOTP_PENDING_TTL_SECONDS,
  generateTotpPendingNonce,
  parseTotpPendingToken,
  safeEqual,
  signTotpPendingToken,
} from "@/lib/totp";

// Re-exported so actions.ts and routes use ONE timing-safe compare.
export { safeEqual };

/** Session cookie name. Public knowledge — the VALUE is what is secret. */
export const ADMIN_COOKIE = "ftp_admin_v1";
/**
 * UI-hint cookie. Value is always "ok" and it carries NO authority — it only
 * tells the admin layout to render the code form instead of the password
 * form. totpAction never reads it.
 */
export const TOTP_PENDING_COOKIE = "admin_totp_pending";
/** The signed pending token (the thing totpAction actually trusts). */
export const TOTP_PENDING_TOKEN_COOKIE = "admin_totp_token";

const REDIS_PREFIX = "admin:session:";
const TOTP_PENDING_PREFIX = "admin:totp-pending:";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

// Lockout: after this many wrong passwords/codes (any IP, any step) the whole
// admin login is closed for LOCK_SECONDS. Counter lives in Redis, so it is
// consistent across serverless invocations.
const FAILURE_KEY = "admin:auth-failures";
const LOCK_KEY = "admin:login-lock";
export const LOCK_AFTER_FAILURES = 10;
export const LOCK_SECONDS = 15 * 60;

// Header-auth failure limiter: 10 wrong secrets per 15 min per IP, fail closed.
const HEADER_FAIL_LIMIT = 10;
const HEADER_FAIL_WINDOW_SECONDS = 15 * 60;

// Refuse to start without a real secret — never fall back to a constant.
// NOTE: this throws at module load, so ADMIN_SESSION_SECRET MUST be present in
// every environment that imports this module: local (.env.local), CI build,
// and Vercel. Set it BEFORE deploying code that depends on it.
const RAW_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
if (!RAW_SESSION_SECRET) {
  throw new Error(
    "ADMIN_SESSION_SECRET is not set. Generate one with `openssl rand -hex 32` " +
      "and add it to the environment (Vercel env + .env.local). Refusing to " +
      "start with a fallback secret."
  );
}
const SESSION_SECRET: string = RAW_SESSION_SECRET;

interface SessionPayload {
  createdAt: number;
  ip: string;
}

interface TotpPendingPayload {
  /** hashIp() of the IP that passed the password step. */
  ipHash: string;
  createdAt: number;
}

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new admin session: store a revocable record in Redis and return the
 * signed cookie token to set as `ftp_admin_v1`.
 */
export async function createAdminSession(ip: string): Promise<string> {
  if (!redis) {
    throw new Error(
      "Redis is unavailable (REDIS_URL/REDIS_TOKEN unset) — cannot create a " +
        "revocable admin session."
    );
  }
  const sessionId = randomBytes(32).toString("hex");
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload: SessionPayload = { createdAt: Date.now(), ip };
  await redis.set(REDIS_PREFIX + sessionId, payload, { ex: SESSION_TTL_SECONDS });
  const body = `${sessionId}.${expiry}`;
  return `${body}.${sign(body)}`;
}

/** Validate the signed session cookie token (authenticity + expiry + revocation). */
async function verifySessionToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sessionId, expiryStr, providedHmac] = parts;
  if (!sessionId || !expiryStr || !providedHmac) return false;

  // 1. Authenticity — HMAC must match (constant-time).
  if (!safeEqual(providedHmac, sign(`${sessionId}.${expiryStr}`))) return false;

  // 2. Expiry.
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  // 3. Revocation — the Redis key must still exist. Fail closed on absence or
  //    any Redis error (a deleted key / Redis outage logs the admin out).
  if (!redis) return false;
  try {
    const exists = await redis.exists(REDIS_PREFIX + sessionId);
    return exists === 1;
  } catch {
    return false;
  }
}

/**
 * Cookie-only check. Returns { ok: true } only for a valid signed session
 * cookie that is still present in Redis. Use this for anything that must have
 * passed the full password + 2FA flow.
 */
export async function requireAdminCookie(): Promise<{ ok: boolean }> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) {
    return { ok: true };
  }
  return { ok: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Header path (curl / ops scripts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Timing-safe admin secret header path. Returns:
 *   "ok"      — a header matched ADMIN_PASSWORD
 *   "fail"    — a header was present but wrong
 *   "absent"  — no admin header on this request (normal browser traffic)
 */
function checkSecretHeaders(h: { get(name: string): string | null }): "ok" | "fail" | "absent" {
  const xSecret = h.get("x-admin-secret");
  const xPassword = h.get("x-admin-password");
  if (!xSecret && !xPassword) return "absent";

  const adminPassword = process.env.ADMIN_PASSWORD;
  // No configured password ⇒ the header path is simply closed.
  if (!adminPassword) return "fail";

  if (xSecret && safeEqual(xSecret, adminPassword)) return "ok";
  if (xPassword && safeEqual(xPassword, adminPassword)) return "ok";
  return "fail";
}

/**
 * Count a header-auth attempt for this IP. Successes reset the counter, so the
 * effective rule is "10 FAILURES per 15 min". Fail closed: if Redis is down the
 * header path is unavailable (the cookie path is unaffected).
 */
async function headerAttemptAllowed(ipHash: string): Promise<boolean> {
  const rl = await rateLimit(
    `admin-header-fail:${ipHash}`,
    HEADER_FAIL_LIMIT,
    HEADER_FAIL_WINDOW_SECONDS,
    { failClosed: true }
  );
  return rl.success;
}

/**
 * SINGLE source of truth for ordinary admin authorization. Returns { ok }.
 * Accepts a valid signed session cookie OR a valid timing-safe admin secret
 * header. Call this from every admin route handler, server action and page.
 *
 * Prefer requireAdminCookie() for 2FA management, recovery details,
 * logout-all, the vault and stored-login reveals.
 */
export async function requireAdmin(): Promise<{ ok: boolean }> {
  // 1. Cookie session (primary path).
  const viaCookie = await requireAdminCookie();
  if (viaCookie.ok) return { ok: true };

  // 2. Header path — only evaluated when an admin header is actually present,
  //    so normal page renders never touch the limiter.
  const h = await headers();
  const xSecret = h.get("x-admin-secret");
  const xPassword = h.get("x-admin-password");
  if (!xSecret && !xPassword) return { ok: false };

  const ip = getClientIpFromHeaders(h);
  const ipHash = hashIp(ip);

  if (!(await headerAttemptAllowed(ipHash))) {
    console.warn(
      JSON.stringify({
        event: "admin_header_auth_throttled",
        ipHash,
        header: xSecret ? "x-admin-secret" : "x-admin-password",
      })
    );
    return { ok: false };
  }

  const result = checkSecretHeaders(h);
  if (result === "ok") {
    // Legit ops call — don't let its own attempt count against it.
    await resetRateLimit(`admin-header-fail:${ipHash}`);
    return { ok: true };
  }

  // Structured, secret-free failure log (no header values, no raw IP).
  console.warn(
    JSON.stringify({
      event: "admin_header_auth_failed",
      ipHash,
      header: xSecret ? "x-admin-secret" : "x-admin-password",
      passwordConfigured: Boolean(process.env.ADMIN_PASSWORD),
    })
  );
  return { ok: false };
}

/** Destroy the current admin session — delete the Redis key and clear the cookie. */
export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    const sessionId = token.split(".")[0];
    if (sessionId && redis) {
      try {
        await redis.del(REDIS_PREFIX + sessionId);
      } catch {
        // best-effort — the cookie is cleared regardless below
      }
    }
  }
  jar.delete(ADMIN_COOKIE);
}

/**
 * Revoke EVERY admin session and every pending TOTP token, on every device.
 * Walks Redis with SCAN (never KEYS — that blocks the server). Returns how
 * many keys were removed. Used by POST /api/admin/security/logout-all.
 */
export async function revokeAllAdminSessions(): Promise<{ sessions: number; pending: number }> {
  if (!redis) return { sessions: 0, pending: 0 };
  const counts = { sessions: 0, pending: 0 };

  async function sweep(pattern: string): Promise<number> {
    if (!redis) return 0;
    // Redis SCAN returns a string cursor; "0" means the walk is complete.
    let cursor = "0";
    let removed = 0;
    do {
      const [next, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      if (keys.length > 0) {
        removed += await redis.del(...keys);
      }
      cursor = next;
    } while (cursor !== "0");
    return removed;
  }

  try {
    counts.sessions = await sweep(`${REDIS_PREFIX}*`);
    counts.pending = await sweep(`${TOTP_PENDING_PREFIX}*`);
  } catch (err) {
    console.error("[admin-auth] revokeAllAdminSessions failed:", err instanceof Error ? err.message : err);
  }
  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed "TOTP pending" token (password passed, waiting for the code)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mint a pending token for the browser that just passed the password check.
 * The nonce is stored in Redis for 5 minutes together with the hashed IP, so
 * the second step can only be completed from the same network and only once.
 * Throws when Redis is unavailable (we never issue a token we cannot revoke).
 */
export async function createTotpPendingToken(ip: string): Promise<string> {
  if (!redis) {
    throw new Error("Redis is unavailable — cannot start the 2FA step.");
  }
  const nonce = generateTotpPendingNonce();
  const expiresAt = Date.now() + TOTP_PENDING_TTL_SECONDS * 1000;
  const payload: TotpPendingPayload = { ipHash: hashIp(ip), createdAt: Date.now() };
  await redis.set(TOTP_PENDING_PREFIX + nonce, payload, { ex: TOTP_PENDING_TTL_SECONDS });
  return signTotpPendingToken(nonce, expiresAt, SESSION_SECRET);
}

/**
 * Check a pending token: signature + expiry (pure) and then Redis presence +
 * IP binding. Does NOT consume the nonce — call consumeTotpPendingToken() once
 * the 6-digit code has been verified. Fails closed on any Redis problem.
 */
export async function verifyTotpPendingToken(
  token: string | undefined,
  ip: string
): Promise<{ ok: true; nonce: string } | { ok: false; reason: string }> {
  const parsed = parseTotpPendingToken(token, SESSION_SECRET);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };

  if (!redis) return { ok: false, reason: "redis_unavailable" };
  try {
    const stored = await redis.get<TotpPendingPayload>(TOTP_PENDING_PREFIX + parsed.nonce);
    if (!stored) return { ok: false, reason: "unknown_or_used" };
    if (!safeEqual(stored.ipHash, hashIp(ip))) return { ok: false, reason: "ip_mismatch" };
    return { ok: true, nonce: parsed.nonce };
  } catch {
    return { ok: false, reason: "redis_error" };
  }
}

/** Delete the nonce so the token can never be replayed. Best-effort. */
export async function consumeTotpPendingToken(nonce: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(TOTP_PENDING_PREFIX + nonce);
  } catch {
    // best-effort — the token also expires on its own within 5 minutes
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Failure counter + lockout (Redis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record one wrong password or wrong code. After LOCK_AFTER_FAILURES the login
 * is locked for LOCK_SECONDS. Returns the new failure count and whether the
 * lock was just engaged. Fails closed: if Redis is unreachable we report
 * `locked: true` so the caller refuses the attempt.
 */
export async function recordAdminAuthFailure(): Promise<{ failures: number; locked: boolean }> {
  if (!redis) return { failures: LOCK_AFTER_FAILURES, locked: true };
  try {
    const failures = (await redis.incr(FAILURE_KEY)) as number;
    if (failures === 1) await redis.expire(FAILURE_KEY, LOCK_SECONDS);
    if (failures >= LOCK_AFTER_FAILURES) {
      await redis.set(LOCK_KEY, Date.now(), { ex: LOCK_SECONDS });
      console.warn(JSON.stringify({ event: "admin_login_locked", failures, lockSeconds: LOCK_SECONDS }));
      return { failures, locked: true };
    }
    return { failures, locked: false };
  } catch {
    return { failures: LOCK_AFTER_FAILURES, locked: true };
  }
}

/** True while the 15-minute lock is active (or while Redis cannot tell us). */
export async function isAdminLoginLocked(): Promise<boolean> {
  if (!redis) return true;
  try {
    return (await redis.exists(LOCK_KEY)) === 1;
  } catch {
    return true;
  }
}

/** Clear the failure counter after a fully successful login. Best-effort. */
export async function clearAdminAuthFailures(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(FAILURE_KEY);
  } catch {
    // non-fatal
  }
}

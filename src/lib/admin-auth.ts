/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

/**
 * Admin authentication — signed, expiring, server-revocable sessions.
 *
 * Replaces the old static `ftp_admin_v1="ok"` cookie. Both the cookie NAME and
 * VALUE were public in this open-source repo, so anyone could forge the cookie
 * in dev-tools and gain full admin access. A session is now:
 *
 *   - a random 32-byte id stored in Upstash Redis under `admin:session:<id>`
 *     with an 8-hour TTL — delete the key to revoke the session instantly; AND
 *   - a signed cookie token `<id>.<expiryMs>.<hmac>`, where
 *     `hmac = HMAC-SHA256("<id>.<expiryMs>", ADMIN_SESSION_SECRET)`.
 *
 * `requireAdmin()` is the SINGLE source of truth used by every admin route,
 * server action and admin page. It returns { ok } and accepts EITHER:
 *   1. a valid signed session cookie, OR
 *   2. a valid timing-safe admin secret header — `x-admin-secret` /
 *      `x-admin-password` matching ADMIN_PASSWORD, or
 *      `Authorization: Bearer <SEED_SECRET>`.
 *
 * The header path keeps the standalone /admin tooling pages (which prompt for
 * the password) and curl/ops scripts (e.g. the one-shot seed-tenders endpoint)
 * working — it uses real, non-public secrets compared in constant time, so it
 * is NOT the forgeable-cookie bypass this module exists to kill.
 */

import { cookies, headers } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import redis from "@/lib/redis";

const COOKIE = "ftp_admin_v1";
const REDIS_PREFIX = "admin:session:";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

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

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
}

/** Constant-time string compare that tolerates length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

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

/** Timing-safe admin secret header path (ops scripts + standalone /admin UI). */
function verifySecretHeaders(h: { get(name: string): string | null }): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const xSecret = h.get("x-admin-secret");
    if (xSecret && safeEqual(xSecret, adminPassword)) return true;
    const xPassword = h.get("x-admin-password");
    if (xPassword && safeEqual(xPassword, adminPassword)) return true;
  }
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const auth = h.get("authorization");
    if (auth?.startsWith("Bearer ") && safeEqual(auth.slice(7), seedSecret)) {
      return true;
    }
  }
  return false;
}

/**
 * SINGLE source of truth for admin authorization. Returns { ok }.
 * Accepts a valid signed session cookie OR a valid timing-safe admin secret
 * header. Call this from every admin route handler, server action and page.
 */
export async function requireAdmin(): Promise<{ ok: boolean }> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && (await verifySessionToken(token))) {
    return { ok: true };
  }
  const h = await headers();
  if (verifySecretHeaders(h)) {
    return { ok: true };
  }
  return { ok: false };
}

/** Destroy the current admin session — delete the Redis key and clear the cookie. */
export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
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
  jar.delete(COOKIE);
}

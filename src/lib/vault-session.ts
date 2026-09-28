/**
 * ForThePeople.in — Vault session management
 * Stored in Redis (Upstash) with a 10-minute TTL. Session is bound to the admin
 * cookie hash so it can't be replayed from a different browser.
 *
 * Falls back to an in-memory Map in dev when Redis isn't available, so the flow
 * is still testable without Upstash credentials.
 */

import { randomUUID, createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { ADMIN_COOKIE, requireAdminCookie } from "@/lib/admin-auth";

const VAULT_PREFIX = "ftp:vault-session:";
const VAULT_TTL_SECONDS = 600; // 10 minutes
const MAX_REVEALS_PER_SESSION = 5;

export const VAULT_COOKIE = "ftp_vault_session";

interface StoredSession {
  createdAt: number;
  reveals: number;
}

const memoryStore = new Map<string, StoredSession>();

function hashCookieValue(v: string): string {
  return createHash("sha256").update(v).digest("hex").slice(0, 12);
}

async function getStored(token: string): Promise<StoredSession | null> {
  const key = VAULT_PREFIX + token;
  try {
    if (redis) {
      const v = await redis.get<StoredSession>(key);
      return v ?? null;
    }
  } catch {
    // fall through
  }
  return memoryStore.get(key) ?? null;
}

async function setStored(token: string, value: StoredSession, ttl: number): Promise<void> {
  const key = VAULT_PREFIX + token;
  try {
    if (redis) {
      await redis.set(key, value, { ex: ttl });
      return;
    }
  } catch {
    // fall through
  }
  memoryStore.set(key, value);
  setTimeout(() => memoryStore.delete(key), ttl * 1000).unref?.();
}

async function deleteStored(token: string): Promise<void> {
  const key = VAULT_PREFIX + token;
  try {
    if (redis) await redis.del(key);
  } catch {
    // ignore
  }
  memoryStore.delete(key);
}

/** Create a new vault session token. Returns the token (put in cookie, also stored in Redis). */
export async function createVaultSession(adminCookieValue: string): Promise<{ token: string; expiresIn: number }> {
  const token = `${randomUUID()}.${hashCookieValue(adminCookieValue)}`;
  const stored: StoredSession = { createdAt: Date.now(), reveals: 0 };
  await setStored(token, stored, VAULT_TTL_SECONDS);
  return { token, expiresIn: VAULT_TTL_SECONDS };
}

/** Returns remaining ttl in seconds if session valid, else 0. */
export async function checkVaultSession(
  token: string | undefined,
  adminCookieValue: string | undefined
): Promise<{ valid: boolean; remainingSeconds: number; reveals: number }> {
  if (!token || !adminCookieValue) return { valid: false, remainingSeconds: 0, reveals: 0 };
  const stored = await getStored(token);
  if (!stored) return { valid: false, remainingSeconds: 0, reveals: 0 };

  // Bind check: the session token must match the hashed admin cookie.
  const expectedSuffix = hashCookieValue(adminCookieValue);
  if (!token.endsWith("." + expectedSuffix)) {
    return { valid: false, remainingSeconds: 0, reveals: 0 };
  }

  const elapsed = (Date.now() - stored.createdAt) / 1000;
  const remaining = Math.max(0, VAULT_TTL_SECONDS - elapsed);
  if (remaining <= 0) return { valid: false, remainingSeconds: 0, reveals: stored.reveals };
  return { valid: true, remainingSeconds: remaining, reveals: stored.reveals };
}

/** Increment the reveals counter. Returns false if the per-session cap is hit. */
export async function bumpReveals(token: string): Promise<{ allowed: boolean; reveals: number }> {
  const stored = await getStored(token);
  if (!stored) return { allowed: false, reveals: 0 };
  if (stored.reveals >= MAX_REVEALS_PER_SESSION) return { allowed: false, reveals: stored.reveals };
  stored.reveals++;
  const elapsed = (Date.now() - stored.createdAt) / 1000;
  const remaining = Math.max(1, Math.ceil(VAULT_TTL_SECONDS - elapsed));
  await setStored(token, stored, remaining);
  return { allowed: true, reveals: stored.reveals };
}

export async function destroyVaultSession(token: string): Promise<void> {
  await deleteStored(token);
}

/**
 * The gate of every vault route: a signed admin cookie session (never the
 * password header — the vault is cookie-only, like 2FA management) plus an
 * unlocked vault session bound to that cookie. Returns the vault token, or
 * the response to send (401 / 403).
 */
export async function requireVaultSession(): Promise<{ ok: true; token: string } | { ok: false; res: NextResponse }> {
  if (!(await requireAdminCookie()).ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const jar = await cookies();
  const token = jar.get(VAULT_COOKIE)?.value;
  const status = await checkVaultSession(token, jar.get(ADMIN_COOKIE)?.value);
  if (!status.valid || !token) {
    return { ok: false, res: NextResponse.json({ error: "Vault locked" }, { status: 403 }) };
  }
  return { ok: true, token };
}

export { VAULT_TTL_SECONDS, MAX_REVEALS_PER_SESSION };

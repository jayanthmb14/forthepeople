/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron auth + cron run bookkeeping
//
// WHY THIS FILE EXISTS (Sept 2026 audit, item 3.5):
// Vercel Cron calls every scheduled route with
//   Authorization: Bearer <CRON_SECRET>
// but two of our routes only looked for an "x-cron-secret" header,
// so they returned 401 on every scheduled run since March. Every cron
// route now goes through verifyCron() below, which accepts BOTH forms:
//   - "Authorization: Bearer <CRON_SECRET>"   (what Vercel sends)
//   - "x-cron-secret: <CRON_SECRET>"          (manual curl triggers)
//
// It fails CLOSED: if CRON_SECRET is not set in the environment, every
// request is rejected. It also compares with crypto.timingSafeEqual so an
// attacker cannot guess the secret one byte at a time by measuring
// response times.
//
// The second half of this file records every cron run in Redis so
// /api/health can tell whether a cron actually ran (no schema change
// needed). Each cron writes a hash at "ftp:cron:<name>" with:
//   startedAt, finishedAt, status ("running" | "ok" | "error"),
//   count (records touched), error (message, if any),
//   lastSuccessAt (only updated on a successful run).
// ═══════════════════════════════════════════════════════════
import { timingSafeEqual } from "crypto";
import { redis } from "@/lib/redis";

// ── Auth ────────────────────────────────────────────────────

/** Extract the secret the caller presented, from either header form. */
function presentedSecret(req: Request): string | null {
  const direct = req.headers.get("x-cron-secret");
  if (direct) return direct;

  const auth = req.headers.get("authorization");
  if (auth) {
    // Case-insensitive "Bearer " prefix, tolerate extra spaces.
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  return null;
}

/**
 * Returns true only when the request carries the correct CRON_SECRET.
 * - CRON_SECRET unset  -> false (fail closed)
 * - header missing     -> false
 * - wrong length       -> false (timingSafeEqual needs equal lengths,
 *                         so we compare lengths first — this leaks only
 *                         the secret's length, which is acceptable)
 * - mismatch           -> false
 */
export function verifyCron(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const provided = presentedSecret(req);
  if (!provided) return false;

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

// ── Cron run bookkeeping (Redis hash "ftp:cron:<name>") ─────

export type CronStatus = "running" | "ok" | "error";

export interface CronRunRecord {
  startedAt?: string;
  finishedAt?: string;
  lastSuccessAt?: string;
  status?: CronStatus;
  count?: number;
  error?: string;
  durationMs?: number;
}

/** Redis key for one cron's run record. `name` = the folder name under /api/cron. */
export function cronRunKey(name: string): string {
  return `ftp:cron:${name}`;
}

// Run records never expire on purpose: /api/health must be able to say
// "last succeeded 40 days ago" for a cron that silently died, rather than
// "never recorded". Ten tiny hashes cost nothing in Upstash.

/**
 * Mark a cron as started. Returns the start timestamp (ms) so the caller
 * can pass it back to cronFinished() for the duration calculation.
 * Never throws — cron bookkeeping must not break the cron itself.
 */
export async function cronStarted(name: string): Promise<number> {
  const startedAt = Date.now();
  if (!redis) return startedAt;
  try {
    const key = cronRunKey(name);
    await redis.hset(key, {
      startedAt: new Date(startedAt).toISOString(),
      status: "running",
      error: "",
    });
  } catch (err) {
    console.warn(`[cron:${name}] could not record start:`, err instanceof Error ? err.message : err);
  }
  return startedAt;
}

/**
 * Mark a cron as finished. Call once at the end of the route, in both the
 * success and the failure path.
 *   status "ok"    -> also updates lastSuccessAt (what /api/health reads)
 *   status "error" -> keeps the previous lastSuccessAt untouched
 */
export async function cronFinished(
  name: string,
  startedAtMs: number,
  result: { status: "ok" | "error"; count?: number; error?: string },
): Promise<void> {
  if (!redis) return;
  try {
    const key = cronRunKey(name);
    const finishedAt = new Date().toISOString();
    const fields: Record<string, string | number> = {
      finishedAt,
      status: result.status,
      count: result.count ?? 0,
      error: (result.error ?? "").slice(0, 500),
      durationMs: Date.now() - startedAtMs,
    };
    if (result.status === "ok") fields.lastSuccessAt = finishedAt;
    await redis.hset(key, fields);
  } catch (err) {
    console.warn(`[cron:${name}] could not record finish:`, err instanceof Error ? err.message : err);
  }
}

// ── Cron schedule maths (used by /api/health) ───────────────
/**
 * Turn a 5-field cron expression into "how many minutes between runs".
 * Handles the shapes we actually use in vercel.json:
 *   "*\/30 * * * *"  -> 30          "0 *\/6 * * *" -> 360
 *   "0 0,12 * * *"   -> 720         "30 3 * * *"   -> 1440 (daily)
 *   "0 6 * * 1"      -> 10080 (weekly)
 * Anything it cannot parse is treated as daily.
 */
export function cronIntervalMinutes(expr: string): number {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return 24 * 60;
  const [minute, hour, , , dow] = parts;

  if (minute.startsWith("*/")) {
    const n = Number(minute.slice(2));
    return Number.isFinite(n) && n > 0 ? n : 60;
  }
  if (hour.startsWith("*/")) {
    const n = Number(hour.slice(2));
    return Number.isFinite(n) && n > 0 ? n * 60 : 60;
  }
  if (hour === "*") return 60; // "M * * * *" = hourly
  if (hour.includes(",")) {
    // smallest gap between the listed hours, wrapping past midnight
    const hs = hour.split(",").map(Number).filter((h) => Number.isFinite(h)).sort((a, b) => a - b);
    if (hs.length >= 2) {
      let gap = 24;
      for (let i = 1; i < hs.length; i++) gap = Math.min(gap, hs[i] - hs[i - 1]);
      gap = Math.min(gap, 24 - hs[hs.length - 1] + hs[0]);
      return gap * 60;
    }
  }
  if (dow !== "*") return 7 * 24 * 60; // specific weekday = weekly
  return 24 * 60; // "M H * * *" = daily
}

/** Read one cron's run record (used by /api/health). Returns null if never recorded. */
export async function getCronRun(name: string): Promise<CronRunRecord | null> {
  if (!redis) return null;
  try {
    const raw = await redis.hgetall<Record<string, string | number>>(cronRunKey(name));
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      startedAt: raw.startedAt ? String(raw.startedAt) : undefined,
      finishedAt: raw.finishedAt ? String(raw.finishedAt) : undefined,
      lastSuccessAt: raw.lastSuccessAt ? String(raw.lastSuccessAt) : undefined,
      status: raw.status ? (String(raw.status) as CronStatus) : undefined,
      count: raw.count !== undefined && raw.count !== "" ? Number(raw.count) : undefined,
      error: raw.error ? String(raw.error) : undefined,
      durationMs: raw.durationMs !== undefined && raw.durationMs !== "" ? Number(raw.durationMs) : undefined,
    };
  } catch {
    return null;
  }
}

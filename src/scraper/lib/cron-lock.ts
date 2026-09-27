/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// A Redis lock so two runs of the same slow cron (a Vercel retry, or a
// manual trigger during the scheduled run) never write at the same time.
// SET NX with a TTL a little longer than the route's maxDuration, so a
// run that Vercel kills cannot hold the lock for ever. Without Redis the
// lock is skipped (local runs).
// ═══════════════════════════════════════════════════════════
import { redis } from "@/lib/redis";

export const cronLockKey = (name: string) => `lock:cron:${name}`;

/** True when this run may go ahead. */
export async function acquireCronLock(name: string, ttlSeconds: number): Promise<boolean> {
  if (!redis) return true;
  try {
    const ok = await redis.set(cronLockKey(name), String(Date.now()), { nx: true, ex: ttlSeconds });
    return ok === "OK";
  } catch {
    // Redis down: better to run than to never run.
    return true;
  }
}

export async function releaseCronLock(name: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(cronLockKey(name));
  } catch {
    /* expires by itself */
  }
}

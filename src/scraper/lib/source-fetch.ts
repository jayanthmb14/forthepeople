/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// One polite HTTP helper for the government-portal collectors
// (JJM, UDISE+, NREGA, …).
//
//   • every call has a hard timeout (AbortSignal.timeout);
//   • one retry, after a short pause, on a network error or a
//     502 / 503 / 504 (government portals blip);
//   • at most one request every `minGapMs` (default 2.5 s) per host,
//     as CLAUDE.md asks ("one request every 2–3 s per source domain");
//   • never throws: the caller gets { ok:false, error } and writes
//     nothing (CLAUDE.md: never fabricate when a source fails).
// ═══════════════════════════════════════════════════════════

export const COLLECTOR_UA = "ForThePeople.in civic data collector (+https://forthepeople.in)";

export interface SourceFetchOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Retries on network errors and 502/503/504. Default 1. */
  retries?: number;
  /** Minimum gap between two requests to the same host. Default 2,500 ms. */
  minGapMs?: number;
  /** Stop (without trying) when Date.now() is past this. */
  deadlineMs?: number;
}

export interface SourceFetchResult {
  ok: boolean;
  status: number;
  text: string;
  ms: number;
  error?: string;
  /** Set-Cookie pairs ("name=value"), for ASP.NET / JSF session portals. */
  cookies: string[];
}

const lastHit = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRY_STATUS = new Set([502, 503, 504]);

async function waitForHost(host: string, minGapMs: number): Promise<void> {
  const last = lastHit.get(host);
  const now = Date.now();
  if (last !== undefined && now - last < minGapMs) await sleep(minGapMs - (now - last));
  lastHit.set(host, Date.now());
}

/** Fetch a URL politely. Never throws. */
export async function fetchSource(url: string, opts: SourceFetchOptions = {}): Promise<SourceFetchResult> {
  const { method = "GET", headers = {}, body, timeoutMs = 20_000, retries = 1, minGapMs = 2_500, deadlineMs } = opts;
  const host = new URL(url).host;
  const started = Date.now();
  let lastError = "";
  let lastStatus = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (deadlineMs !== undefined && Date.now() > deadlineMs) {
      return { ok: false, status: lastStatus, text: "", ms: Date.now() - started, error: lastError || "time budget used up", cookies: [] };
    }
    if (attempt > 0) await sleep(2_000);
    await waitForHost(host, minGapMs);
    try {
      const res = await fetch(url, {
        method,
        headers: { "User-Agent": COLLECTOR_UA, ...headers },
        body,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      lastStatus = res.status;
      const cookies = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).filter(Boolean);
      if (res.ok) return { ok: true, status: res.status, text, ms: Date.now() - started, cookies };
      lastError = `HTTP ${res.status}`;
      if (!RETRY_STATUS.has(res.status)) break;
    } catch (err) {
      lastError = err instanceof Error ? (err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : err.message) : String(err);
    }
  }
  return { ok: false, status: lastStatus, text: "", ms: Date.now() - started, error: lastError, cookies: [] };
}

/** Parse a JSON body; null when it is not JSON. */
export function parseJsonSafe<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

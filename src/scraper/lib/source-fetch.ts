/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// One polite HTTP helper for the government-portal collectors
// (JJM, UDISE+, NREGA, GePNIC, PPAC, UPSC / SSC exams, …).
//
//   • every call has a hard timeout (AbortSignal.timeout);
//   • one retry, after a short pause, on a network error or a
//     500 / 502 / 503 / 504 (government portals blip);
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
  /**
   * "follow" (default) or "manual": with "manual" a 3xx is not followed and
   * comes back as ok:false "HTTP 30x" (upsc.gov.in answers a moved page with
   * a redirect to its home page, which must not be read as the exam page).
   */
  redirect?: "follow" | "manual";
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

/** Start time of the latest request per host, reserved before waiting. */
const lastStart = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// 500 too: the NIC portals (GePNIC, NREGA) return a stray 500 now and then.
const RETRY_STATUS = new Set([500, 502, 503, 504]);

/**
 * Wait until `minGapMs` after the previous request to this host. The slot is
 * reserved before sleeping, so callers that start together queue up one gap
 * apart instead of all firing when the first gap ends.
 */
async function waitForHost(host: string, minGapMs: number): Promise<void> {
  const now = Date.now();
  const prev = lastStart.get(host);
  const at = prev === undefined ? now : Math.max(now, prev + minGapMs);
  lastStart.set(host, at);
  if (at > now) await sleep(at - now);
}

/** Fetch a URL politely. Never throws. */
export async function fetchSource(url: string, opts: SourceFetchOptions = {}): Promise<SourceFetchResult> {
  const { method = "GET", headers = {}, body, timeoutMs = 20_000, retries = 1, minGapMs = 2_500, deadlineMs, redirect = "follow" } = opts;
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
        // Node's fetch sends "Accept-Language: *", which makes the GePNIC
        // (Java/Tapestry) portals answer 500; send what a browser sends.
        headers: {
          "User-Agent": COLLECTOR_UA,
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-IN,en;q=0.9",
          ...headers,
        },
        body,
        redirect,
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

export interface SourceBytesResult {
  ok: boolean;
  status: number;
  bytes: Uint8Array;
  /** The response's Content-Type (lower case), or "". */
  contentType: string;
  ms: number;
  error?: string;
}

/**
 * Fetch a file (a PDF) politely: the same user agent, timeout, per-host
 * gap and single retry as fetchSource(), but the body is kept as bytes.
 * A body larger than `maxBytes` (default 8 MB) is refused. Never throws.
 */
export async function fetchSourceBytes(
  url: string,
  opts: Omit<SourceFetchOptions, "method" | "body"> & { maxBytes?: number } = {},
): Promise<SourceBytesResult> {
  const { headers = {}, timeoutMs = 30_000, retries = 1, minGapMs = 2_500, deadlineMs, maxBytes = 8 * 1024 * 1024 } = opts;
  const host = new URL(url).host;
  const started = Date.now();
  let lastError = "";
  let lastStatus = 0;
  const empty = new Uint8Array(0);

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (deadlineMs !== undefined && Date.now() > deadlineMs) {
      return { ok: false, status: lastStatus, bytes: empty, contentType: "", ms: Date.now() - started, error: lastError || "time budget used up" };
    }
    if (attempt > 0) await sleep(2_000);
    await waitForHost(host, minGapMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": COLLECTOR_UA, Accept: "application/pdf,*/*;q=0.8", "Accept-Language": "en-IN,en;q=0.9", ...headers },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = res.status;
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > maxBytes) {
        await res.body?.cancel().catch(() => {});
        return { ok: false, status: res.status, bytes: empty, contentType: "", ms: Date.now() - started, error: `file too large (${declared} bytes)` };
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
      if (bytes.byteLength > maxBytes) {
        return { ok: false, status: res.status, bytes: empty, contentType, ms: Date.now() - started, error: `file too large (${bytes.byteLength} bytes)` };
      }
      if (res.ok) return { ok: true, status: res.status, bytes, contentType, ms: Date.now() - started };
      lastError = `HTTP ${res.status}`;
      if (!RETRY_STATUS.has(res.status)) break;
    } catch (err) {
      lastError = err instanceof Error ? (err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : err.message) : String(err);
    }
  }
  return { ok: false, status: lastStatus, bytes: empty, contentType: "", ms: Date.now() - started, error: lastError };
}

/** Parse a JSON body; null when it is not JSON. */
export function parseJsonSafe<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * A cookie-keeping client for portals that tie links to a session
 * (ASP.NET, Tapestry/GePNIC). Same politeness as fetchSource(); throws
 * on failure so a collector can stop that portal and write nothing.
 */
export class CookieSession {
  private jar = new Map<string, string>();
  constructor(private readonly opts: { deadlineMs?: number; referer?: string } = {}) {}

  private cookieHeader(): Record<string, string> {
    return this.jar.size ? { Cookie: Array.from(this.jar, ([k, v]) => `${k}=${v}`).join("; ") } : {};
  }

  private keep(pairs: string[]) {
    for (const p of pairs) {
      const i = p.indexOf("=");
      if (i > 0) this.jar.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
    }
  }

  async request(url: string, init: Omit<SourceFetchOptions, "deadlineMs"> = {}): Promise<string> {
    const res = await fetchSource(url, {
      ...init,
      headers: { ...(this.opts.referer ? { Referer: this.opts.referer } : {}), ...this.cookieHeader(), ...(init.headers ?? {}) },
      deadlineMs: this.opts.deadlineMs,
    });
    this.keep(res.cookies);
    if (!res.ok) throw new Error(`${new URL(url).host}: ${res.error ?? `HTTP ${res.status}`}`);
    return res.text;
  }
}

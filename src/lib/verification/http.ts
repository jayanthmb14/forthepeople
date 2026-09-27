/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Polite HTTP for the verifiers
//
//  - one request at a time per host, at least MIN_GAP_MS apart
//    (CLAUDE.md: at most one request every 2–3 s per source domain);
//  - a per-call timeout, and never past the run's deadline;
//  - a User-Agent that says who we are (Wikimedia asks for one).
// Read-only GET/POST; nothing here writes anywhere.
// ═══════════════════════════════════════════════════════════

export const VERIFIER_USER_AGENT = "ForThePeople.in-verifier/1.0 (https://forthepeople.in; data verification)";
const MIN_GAP_MS = 2_000;
const DEFAULT_TIMEOUT_MS = 15_000;

const nextSlot = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class DeadlineError extends Error {
  constructor() {
    super("time budget used up");
    this.name = "DeadlineError";
  }
}

export interface PoliteInit extends RequestInit {
  timeoutMs?: number;
  /** Epoch ms after which no request is started. */
  deadlineMs?: number;
  minGapMs?: number;
}

/** fetch() with a per-host gap, a timeout and the run deadline. Throws on network errors and timeouts. */
export async function politeFetch(url: string, init: PoliteInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, deadlineMs, minGapMs = MIN_GAP_MS, ...rest } = init;
  const host = new URL(url).host;
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, slot + minGapMs);
  if (deadlineMs !== undefined && slot + 1_000 > deadlineMs) throw new DeadlineError();
  if (slot > now) await sleep(slot - now);
  const remaining = deadlineMs === undefined ? timeoutMs : Math.min(timeoutMs, deadlineMs - Date.now());
  if (remaining <= 500) throw new DeadlineError();
  const headers = new Headers(rest.headers);
  if (!headers.has("User-Agent")) headers.set("User-Agent", VERIFIER_USER_AGENT);
  return fetch(url, { ...rest, headers, signal: AbortSignal.timeout(remaining) });
}

/** politeFetch + status check + JSON parse. */
export async function fetchJson<T>(url: string, init: PoliteInit = {}): Promise<T> {
  const res = await politeFetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  return (await res.json()) as T;
}

/** Short, single-line error text for notes and logs. */
export function errText(err: unknown): string {
  const msg = err instanceof Error ? `${err.name === "TimeoutError" ? "timeout: " : ""}${err.message}` : String(err);
  return msg.replace(/\s+/g, " ").slice(0, 160);
}

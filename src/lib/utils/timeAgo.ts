/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * timeAgoLabel — the ONE relative-time formatter for "Refreshed Xh ago"
 * labels across the homepage, footer, stats tiles and district pages.
 *
 * Honesty rules (audit 2026-09, finding 3.9):
 *   - The label is ALWAYS the real age: "just now", "Xm ago", "Xh ago",
 *     "Xd ago". There is no "Live" fallback any more. A pulsing "Live" pill
 *     over 5-month-old data was the single biggest credibility problem the
 *     audit found, so it is gone by design.
 *   - `isLive` is true ONLY when the record is younger than LIVE_WINDOW_MINUTES
 *     (30 min). Consumers use it to decide whether a green dot is deserved.
 *   - `isStale` is true when the record is older than `staleThresholdMinutes`
 *     (default 120 = 2h) OR the timestamp is missing/invalid. Consumers use
 *     it to grey things out or hide a "recent" indicator.
 *   - Missing / invalid timestamps return label "—" so the UI can print
 *     "Refreshed —" instead of inventing a time.
 */

export interface TimeAgoResult {
  /** Display text: "—", "just now", "Xm ago", "Xh ago" or "Xd ago". */
  label: string;
  /** True when the timestamp is older than the stale threshold, or missing. */
  isStale: boolean;
  /** True ONLY when the timestamp is under 30 minutes old. */
  isLive: boolean;
}

export interface TimeAgoOptions {
  /** Minutes after which `isStale` becomes true. Default 120 (2h). */
  staleThresholdMinutes?: number;
  /** Pass a fixed "now" (ms epoch) for testability. Default Date.now(). */
  nowMs?: number;
}

/** Anything younger than this may show a green "live" dot. */
export const LIVE_WINDOW_MINUTES = 30;

const UNKNOWN: TimeAgoResult = { label: "—", isStale: true, isLive: false };

/** Parse a Date | ISO string into ms epoch, or null when unusable. */
function toMs(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const ts = typeof date === "string" ? new Date(date) : date;
  const ms = ts.getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function timeAgoLabel(
  date: string | Date | null | undefined,
  opts?: TimeAgoOptions,
): TimeAgoResult {
  const staleAfter = opts?.staleThresholdMinutes ?? 120;
  const ms = toMs(date);
  if (ms === null) return UNKNOWN;

  const now = opts?.nowMs ?? Date.now();
  // Future timestamps (clock skew between Neon and the browser) count as 0.
  const minutesAgo = Math.max(0, (now - ms) / 60000);

  const isLive = minutesAgo < LIVE_WINDOW_MINUTES;
  const isStale = minutesAgo >= staleAfter;

  let label: string;
  if (minutesAgo < 1) {
    label = "just now";
  } else if (minutesAgo < 60) {
    label = `${Math.round(minutesAgo)}m ago`;
  } else if (minutesAgo < 60 * 24) {
    label = `${Math.round(minutesAgo / 60)}h ago`;
  } else {
    label = `${Math.round(minutesAgo / (60 * 24))}d ago`;
  }

  return { label, isStale, isLive };
}

/**
 * Absolute "as of" stamp for data that is not fresh, e.g. "as of 20 Apr" or
 * "as of 20 Apr 2025" when the reading is from a previous year. Always in
 * IST so a reader in any timezone sees the same date the source published.
 * Returns "" for missing/invalid input so callers can render nothing.
 */
export function asOfLabel(
  date: string | Date | null | undefined,
  opts?: { nowMs?: number; prefix?: string },
): string {
  const ms = toMs(date);
  if (ms === null) return "";
  const now = new Date(opts?.nowMs ?? Date.now());
  const d = new Date(ms);
  const sameYear = d.getUTCFullYear() === now.getUTCFullYear();
  const text = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Asia/Kolkata",
  });
  const prefix = opts?.prefix ?? "as of";
  return prefix ? `${prefix} ${text}` : text;
}

/**
 * True when the timestamp is known and younger than `minutes`. Use this in
 * components instead of calling Date.now() in render (React Compiler's
 * purity rule) — e.g. `isWithinMinutes(reading.recordedAt, 6 * 60)` decides
 * whether the weather page may show its LIVE badge.
 */
export function isWithinMinutes(
  date: string | Date | null | undefined,
  minutes: number,
  nowMs: number = Date.now(),
): boolean {
  const ms = toMs(date);
  if (ms === null) return false;
  return nowMs - ms < minutes * 60_000;
}

/** Age in whole days (null when unknown). Handy for "under 30 days" filters. */
export function ageInDays(
  date: string | Date | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  const ms = toMs(date);
  if (ms === null) return null;
  return Math.max(0, (nowMs - ms) / 86_400_000);
}

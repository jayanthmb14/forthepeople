/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Small date helpers. timeAgoLabel is the English "Xm/Xh/Xd ago" formatter
 * for admin screens (the feedback inbox, the fact checker). Citizen pages
 * use the translated formatters instead (fmtAgo in components/india/format.ts,
 * ReadingAge / AsOfText in the district kit); ageInDays and
 * calendarDaysAgoIST serve "N days ago" counts on the overview, home and
 * tender cards.
 *
 * Honesty rules for timeAgoLabel (audit 2026-09, finding 3.9):
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
const LIVE_WINDOW_MINUTES = 30;

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
 * Whole calendar days from a date to today, both read as India (IST) dates:
 * 22 Jun → 28 Sep is 98 whatever the hour. For "N days ago" text, so the
 * district overview and the home price ticker give the same count (Sept
 * 2026 audit: the overview floored elapsed hours and said 97). Null when
 * unknown.
 */
export function calendarDaysAgoIST(
  date: string | Date | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  const ms = toMs(date);
  if (ms === null) return null;
  const IST = 5.5 * 3_600_000;
  const day = (x: number) => Math.floor((x + IST) / 86_400_000);
  return Math.max(0, day(nowMs) - day(ms));
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

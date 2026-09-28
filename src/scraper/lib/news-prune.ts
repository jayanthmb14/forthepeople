/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Which stored news rows the news job may delete (pure;
// tests/news-prune.test.ts).
//
// The job accepts articles up to NEWS_MAX_AGE_DAYS old and skips those
// whose URL is already stored. It used to keep only the newest 50 rows per
// district, so in busy districts (Kolkata, Mumbai: ~47 rows in 3 days) an
// article pruned while still inside the window looked new on the next run:
// a new row, another AI classification and translation, another UpdateLog
// count, then pruned again (v5.5). Now a row inside the window is kept —
// up to NEWS_HARD_MAX rows, so storage stays bounded.
// ═══════════════════════════════════════════════════════════

/** Articles older than this are never taken from a feed. */
export const NEWS_MAX_AGE_DAYS = 3;
/** Always kept per district, whatever their age. */
export const NEWS_KEEP = 50;
/** Never more than this per district, even inside the freshness window. */
export const NEWS_HARD_MAX = 150;

/**
 * Ids to delete, given a district's rows AFTER its newest NEWS_KEEP (newest
 * first). A row goes when it is older than the freshness window, or when
 * it is past NEWS_HARD_MAX in the district's list.
 */
export function newsIdsToPrune(rowsAfterKeep: Array<{ id: string; publishedAt: Date }>, nowMs: number): string[] {
  const windowStart = nowMs - NEWS_MAX_AGE_DAYS * 86_400_000;
  return rowsAfterKeep
    .filter((r, i) => NEWS_KEEP + i >= NEWS_HARD_MAX || r.publishedAt.getTime() < windowStart)
    .map((r) => r.id);
}

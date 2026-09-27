/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// How old an AI module analysis may be and still be shown. One rule for the
// card on the page (AIInsightCard) and the public JSON (/api/data/insight):
// the Sept 2026 audit found the API still serving Mar–Apr 2026 analyses
// built from seeded rows that the pages had long stopped showing ("35,230
// pending cases" in Mandya's courts while NJDG said 84,106).

/** After this many days an analysis is not shown: the figures on the page
 *  may have moved on, and an old paragraph above newer numbers reads as
 *  current. */
export const MAX_INSIGHT_DAYS = 30;

/** True when an analysis generated at `generatedAt` is too old to show (or has no valid date). */
export function insightTooOld(generatedAt: Date | string | null | undefined, now: number = Date.now()): boolean {
  if (!generatedAt) return true;
  const ms = new Date(generatedAt).getTime();
  if (!Number.isFinite(ms)) return true;
  return (now - ms) / 86_400_000 > MAX_INSIGHT_DAYS;
}

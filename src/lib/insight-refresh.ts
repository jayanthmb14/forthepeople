/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// When the generate-insights cron regenerates a module insight (pure;
// tests/insight-refresh.test.ts).
//
// Every module: when it has no insight yet or its insight has expired
// (its TTL is in src/lib/insight-config.ts).
// Leaders (Apr 15 2026 rule): a hard 7-day age limit, and during an
// active election period in the district's state it refreshes daily —
// regardless of whether the leaders data changed.
//
// Sept 2026 fix: the cron guessed an insight's age as expiresAt − 24 h,
// but leaders insights live 7 days, so a leaders insight was regenerated
// about 13 days after it was made, and never daily during an election
// (only expired rows reached the work list). The real generatedAt is used
// now, and a still-valid leaders insight enters the work list when an
// election is live and it is a day old.
// ═══════════════════════════════════════════════════════════

const DAY_MS = 86_400_000;
/** Leaders insight age limit outside elections. */
export const LEADERS_MAX_AGE_MS = 7 * DAY_MS;
/** Leaders insight age limit during an active election period. */
export const LEADERS_ELECTION_MAX_AGE_MS = 1 * DAY_MS;

export interface StoredInsightTimes {
  generatedAt: Date | null;
  expiresAt: Date | null;
}

/** Missing or expired: the rule for every module. */
export function insightExpired(t: StoredInsightTimes, now: Date): boolean {
  return !t.expiresAt || t.expiresAt.getTime() <= now.getTime();
}

/** Should the leaders insight be regenerated now? */
export function leadersNeedsRefresh(t: StoredInsightTimes & { electionLive: boolean; now: Date }): boolean {
  if (!t.generatedAt || insightExpired(t, t.now)) return true;
  const ageMs = t.now.getTime() - t.generatedAt.getTime();
  return ageMs >= (t.electionLive ? LEADERS_ELECTION_MAX_AGE_MS : LEADERS_MAX_AGE_MS);
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron run → ScraperLog row (pure helpers; the DB write lives in
// src/lib/cron-auth.ts → cronStarted()/cronFinished()).
//
// Every Vercel cron records ONE ScraperLog row per run so the admin
// "scraper health" panel and the public verification section can say
// truthfully when a feed last ran and what it wrote:
//
//   jobName        short job name (see scraperJobName): "weather", "crops",
//                  "dams", "alerts", "exams", "news", "insights", …
//                  Per-district failure rows use "<job>/<districtSlug>".
//   status         "running"  → started; still "running" after the route's
//                                maxDuration means Vercel killed it
//                  "success"  → every district / item worked
//                  "partial"  → some failed, or the time budget ran out
//                  "skipped"  → nothing to collect (e.g. no source yet)
//                  "error"    → nothing worked
//   recordsNew     rows written          recordsUpdated  rows changed
//   duration       ms                    error           short summary
// ═══════════════════════════════════════════════════════════

/** What a cron route reports when it finishes. */
export type RunOutcome = "ok" | "partial" | "skipped" | "error";

export interface RunFailure {
  district: string;
  error?: string;
}

/** "scrape-weather" → "weather", "generate-insights" → "insights", "update-exams" → "exams". */
export function scraperJobName(cronName: string): string {
  return cronName.replace(/^(scrape|update|generate)-/, "");
}

/** RunOutcome → the ScraperLog.status value. */
export function scraperLogStatus(outcome: RunOutcome): "success" | "partial" | "skipped" | "error" {
  return outcome === "ok" ? "success" : outcome;
}

/**
 * Decide a run's outcome from its per-district results.
 *   nothing attempted            → "skipped"
 *   every attempt failed         → "error"
 *   some failed / budget ran out → "partial"
 *   otherwise                    → "ok"
 */
export function runOutcome(r: { attempted: number; failed: number; budgetExhausted?: boolean }): RunOutcome {
  if (r.attempted === 0) return r.budgetExhausted ? "partial" : "skipped";
  if (r.failed >= r.attempted) return "error";
  if (r.failed > 0 || r.budgetExhausted) return "partial";
  return "ok";
}

/**
 * One short line for ScraperLog.error, e.g.
 * "2 of 10 districts failed: pune (HTTP 502); chennai (timeout)".
 * Returns null when nothing failed.
 */
export function summariseFailures(failures: RunFailure[], attempted: number, maxLen = 500): string | null {
  if (failures.length === 0) return null;
  const head = `${failures.length} of ${attempted} ${attempted === 1 ? "district" : "districts"} failed`;
  const parts = failures.map((f) => (f.error ? `${f.district} (${f.error.replace(/\s+/g, " ").slice(0, 80)})` : f.district));
  const line = `${head}: ${parts.join("; ")}`;
  return line.length > maxLen ? `${line.slice(0, maxLen - 1)}…` : line;
}

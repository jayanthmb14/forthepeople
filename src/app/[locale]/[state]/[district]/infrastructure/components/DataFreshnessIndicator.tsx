/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — how fresh the project list is (v5).
 * The newest update of any kind across the projects (a news report, our
 * own check, a tracked update) — the page header's date. The calm "This
 * is N days old" line itself comes from the district shell
 * (StaleDataNotice), once, above every module page.
 */

import type { InfraProject } from "@/hooks/useRealtimeData";
import { lastUpdateAt } from "@/lib/civic/project-facts";

/** Project news should move at least every two months. */
export const NEWS_MAX_DAYS = 60;

/** The newest update across a list of projects, as an ISO string (or null). */
export function newestUpdate(projects: InfraProject[]): string | null {
  let best: number | null = null;
  for (const p of projects) {
    const t = lastUpdateAt(p);
    if (t !== null && (best === null || t > best)) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

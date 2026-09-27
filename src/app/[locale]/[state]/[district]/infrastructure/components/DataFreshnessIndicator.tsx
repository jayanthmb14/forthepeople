/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — how fresh the project list is (v5).
 * The newest update of any kind across the projects (a news report, our
 * own check, a tracked update). Older than NEWS_MAX_DAYS → the calm amber
 * "This is N days old. We could not find newer data." note; no date at
 * all → "Date not published by the source". Within the limit → nothing
 * (the page header already shows the date).
 */

"use client";

import type { InfraProject } from "@/hooks/useRealtimeData";
import { StaleNote } from "@/components/district/calm-parts";
import { lastUpdateAt } from "@/lib/civic/project-facts";

/** Projects news should move at least every two months. */
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

export default function DataFreshnessIndicator({ projects }: { projects: InfraProject[] }) {
  if (projects.length === 0) return null;
  return <StaleNote asOf={newestUpdate(projects)} maxAgeDays={NEWS_MAX_DAYS} showUnknown style={{ marginBottom: 16 }} />;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The courts page's data hook: /api/data/court-pendency (NJDG snapshot,
// or this year's CourtStat rows when the snapshot is missing).
"use client";

import { useDistrictData } from "@/hooks/useDistrictData";
import type { CourtsSnapshot } from "@/lib/courts/snapshot";

export interface CourtFallbackRow {
  courtName: string;
  year: number;
  filed: number;
  disposed: number;
  pending: number;
  /** "2026-09-27" — when the collector read NJDG. */
  readOn: string | null;
}

export interface CourtPendencyPayload {
  /** False when we have no NJDG source mapped for this district. */
  covered: boolean;
  snapshot: CourtsSnapshot | null;
  rows: CourtFallbackRow[];
}

export function useCourtPendency(district: string, state: string) {
  return useDistrictData<CourtPendencyPayload>("court-pendency", district, state);
}

/** The five age bands, youngest first, and the hue each is drawn in (fresh → old). */
export const AGE_HUES = ["teal", "sky", "yellow", "amber", "rose"] as const;

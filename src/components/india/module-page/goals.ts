/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * "How close to the goal" on the India module pages — which published rows
 * are compared with which published goal. Pure (no database), so it is
 * tested in tests/india-goals.test.ts.
 *
 * A goal must be compared with the SAME thing it counts (Sept 2026 audit):
 *   • The 500 GW goal for 2030 is NON-FOSSIL capacity — renewables plus
 *     large hydro plus nuclear (MNRE via PIB; India passed 300 GW
 *     non-fossil on 31 Jul 2026). Renewables alone (243 GW) showed 49 %
 *     instead of about 61 %.
 *   • The National Forest Policy 1988 goal is one third of the land under
 *     forest OR TREE cover. Forest cover alone (21.76 %) showed 66 %
 *     instead of 76 % (21.76 + 3.41 = 25.17 %, FSI ISFR 2023).
 * So "now" may be the sum of several rows. Every part must be published,
 * with a value, in the goal's unit — otherwise no gauge is drawn.
 */

import type { IndicatorRow } from "./data";

export interface GoalPair {
  /** Rows added together for "now". */
  now: string[];
  /** The published goal row (same unit). */
  goal: string;
  /** page_india-module message key naming a summed "now" (vis.goalLabel.*). */
  labelKey?: string;
}

export const GOAL_PAIRS: Record<string, GoalPair[]> = {
  "wildlife-forests": [{ now: ["forest_cover_pct", "tree_cover_pct"], goal: "forest_cover_target_pct", labelKey: "vis.goalLabel.forestTree" }],
  "health-overview": [{ now: ["life_expectancy_years"], goal: "life_expectancy_target_2030" }],
  "energy-power": [
    {
      now: ["renewables_capacity_gw", "hydro_capacity_gw", "nuclear_capacity_gw"],
      goal: "re_target_gw_2030",
      labelKey: "vis.goalLabel.nonFossil",
    },
  ],
  "infra-roads": [{ now: ["nh_length_km"], goal: "nh_target_km_2027" }],
  "justice-police": [{ now: ["police_per_lakh_population"], goal: "un_target_per_lakh" }],
};

export interface GoalProgress {
  /** The single "now" row, or the first part of a sum. */
  first: IndicatorRow;
  goal: IndicatorRow;
  nowValue: number;
  /** now ÷ goal × 100. */
  pct: number;
  /** Oldest date among the "now" parts (a sum is only as new as its oldest part). */
  asOf: string;
  labelKey?: string;
}

/**
 * The progress for one pair, or null when any part or the goal is missing,
 * has no value, or is in another unit.
 */
export function goalProgress(pair: GoalPair, byKey: Map<string, IndicatorRow>): GoalProgress | null {
  const goal = byKey.get(pair.goal);
  if (!goal || goal.value === null || !Number.isFinite(goal.value) || goal.value <= 0) return null;
  const parts = pair.now.map((k) => byKey.get(k));
  if (parts.length === 0) return null;
  let sum = 0;
  let asOf = "";
  for (const p of parts) {
    if (!p || p.value === null || !Number.isFinite(p.value) || p.unit !== goal.unit) return null;
    sum += p.value;
    if (!asOf || p.asOf < asOf) asOf = p.asOf;
  }
  return {
    first: parts[0] as IndicatorRow,
    goal,
    nowValue: sum,
    pct: (sum / goal.value) * 100,
    asOf,
    labelKey: pair.now.length > 1 ? pair.labelKey : undefined,
  };
}

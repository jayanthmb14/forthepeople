/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * "How close to the goal" pairs (src/components/india/module-page/goals.ts).
 */
import { describe, expect, it } from "vitest";
import { GOAL_PAIRS, goalProgress } from "@/components/india/module-page/goals";
import type { IndicatorRow } from "@/components/india/module-page/data";

function row(metricKey: string, value: number | null, unit: string, asOf = "2026-08-31T00:00:00.000Z"): IndicatorRow {
  return {
    moduleSlug: "x",
    metricKey,
    metricLabel: metricKey,
    value,
    textValue: null,
    unit,
    asOf,
    fetchedAt: asOf,
    source: "test",
    sourceUrl: "",
    quality: "published",
    previousValue: null,
    previousAsOf: null,
    methodologyUrl: null,
  };
}
const map = (rows: IndicatorRow[]) => new Map(rows.map((r) => [r.metricKey, r]));

describe("goal pairs", () => {
  it("the 500 GW goal counts renewables + hydro + nuclear (non-fossil), not renewables alone", () => {
    const [pair] = GOAL_PAIRS["energy-power"];
    const g = goalProgress(
      pair,
      map([
        row("renewables_capacity_gw", 243.49, "gigawatts"),
        row("hydro_capacity_gw", 52.06, "gigawatts"),
        row("nuclear_capacity_gw", 8.78, "gigawatts"),
        row("re_target_gw_2030", 500, "gigawatts"),
      ]),
    );
    expect(g).not.toBeNull();
    expect(g!.nowValue).toBeCloseTo(304.33, 2);
    expect(Math.round(g!.pct)).toBe(61);
    expect(g!.labelKey).toBe("vis.goalLabel.nonFossil");
  });

  it("the one-third goal counts forest AND tree cover (NFP 1988)", () => {
    const [pair] = GOAL_PAIRS["wildlife-forests"];
    const g = goalProgress(
      pair,
      map([row("forest_cover_pct", 21.76, "percent"), row("tree_cover_pct", 3.41, "percent"), row("forest_cover_target_pct", 33, "percent")]),
    );
    expect(Math.round(g!.pct)).toBe(76);
  });

  it("draws nothing when a part is missing, has no value, or is in another unit", () => {
    const [pair] = GOAL_PAIRS["energy-power"];
    const goal = row("re_target_gw_2030", 500, "gigawatts");
    expect(goalProgress(pair, map([row("renewables_capacity_gw", 243.49, "gigawatts"), goal]))).toBeNull();
    expect(
      goalProgress(
        pair,
        map([row("renewables_capacity_gw", 243.49, "gigawatts"), row("hydro_capacity_gw", null, "gigawatts"), row("nuclear_capacity_gw", 8.78, "gigawatts"), goal]),
      ),
    ).toBeNull();
    expect(
      goalProgress(
        pair,
        map([row("renewables_capacity_gw", 243.49, "gigawatts"), row("hydro_capacity_gw", 52.06, "megawatts"), row("nuclear_capacity_gw", 8.78, "gigawatts"), goal]),
      ),
    ).toBeNull();
  });

  it("a sum is dated by its oldest part", () => {
    const [pair] = GOAL_PAIRS["wildlife-forests"];
    const g = goalProgress(
      pair,
      map([
        row("forest_cover_pct", 21.76, "percent", "2024-12-21T00:00:00.000Z"),
        row("tree_cover_pct", 3.41, "percent", "2024-12-20T00:00:00.000Z"),
        row("forest_cover_target_pct", 33, "percent"),
      ]),
    );
    expect(g!.asOf).toBe("2024-12-20T00:00:00.000Z");
  });
});

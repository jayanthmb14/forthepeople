/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import {
  DATASETS,
  fyStartDate,
  isPrimary,
  judgeDataset,
  liveFeedSummary,
  ruleFor,
  yearEndDate,
  type DatasetFreshness,
} from "@/lib/freshness";
import { MODULE_FRESHNESS, SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";

const NOW = new Date("2026-09-27T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe("judgeDataset", () => {
  const weather = ruleFor("weather"); // 6 h

  it("is current inside the expected age", () => {
    expect(judgeDataset({ rows: 5, dataDate: hoursAgo(2), rule: weather, now: NOW }).status).toBe("current");
  });

  it("is late past the expected age and counts days", () => {
    const j = judgeDataset({ rows: 5, dataDate: hoursAgo(160 * 24), rule: weather, now: NOW });
    expect(j.status).toBe("late");
    expect(j.ageDays).toBe(160);
    expect(j.lateByDays).toBe(159);
  });

  it("is not collected when there are no rows, whatever the date", () => {
    expect(judgeDataset({ rows: 0, dataDate: hoursAgo(1), rule: weather, now: NOW }).status).toBe("not_collected");
  });

  it("honours an explicit not-collected flag", () => {
    expect(judgeDataset({ rows: 3, dataDate: hoursAgo(1), rule: weather, notCollected: true, now: NOW }).status).toBe(
      "not_collected",
    );
  });

  it("is unknown when rows exist but no date does", () => {
    expect(judgeDataset({ rows: 8, dataDate: null, rule: ruleFor("buses"), now: NOW }).status).toBe("unknown");
  });

  it("never marks reference content late", () => {
    expect(judgeDataset({ rows: 3, dataDate: hoursAgo(9999), rule: ruleFor("famous"), now: NOW }).status).toBe("reference");
  });

  it("treats future dates (scheduled releases) as age zero", () => {
    const j = judgeDataset({ rows: 1, dataDate: hoursAgo(-48), rule: ruleFor("canals"), now: NOW });
    expect(j.status).toBe("current");
    expect(j.ageDays).toBe(0);
  });
});

describe("periods", () => {
  it("reads the start of a financial year in several spellings", () => {
    expect(fyStartDate("2025-26")?.toISOString()).toBe("2025-04-01T00:00:00.000Z");
    expect(fyStartDate("FY 2024-2025")?.toISOString()).toBe("2024-04-01T00:00:00.000Z");
    expect(fyStartDate("")).toBeNull();
    expect(fyStartDate("n/a")).toBeNull();
  });

  it("ends a calendar year on 31 December", () => {
    expect(yearEndDate(2024)?.toISOString()).toBe("2024-12-31T00:00:00.000Z");
    expect(yearEndDate(null)).toBeNull();
  });

  it("keeps this year's budget current and last year's late", () => {
    const budget = ruleFor("budget");
    expect(judgeDataset({ rows: 5, dataDate: fyStartDate("2026-27"), rule: budget, now: NOW }).status).toBe("current");
    expect(judgeDataset({ rows: 5, dataDate: fyStartDate("2025-26"), rule: budget, now: NOW }).status).toBe("late");
  });

  it("keeps the 2011 census inside its 20-year window", () => {
    expect(judgeDataset({ rows: 1, dataDate: yearEndDate(2011), rule: ruleFor("census"), now: NOW }).status).toBe("current");
  });
});

describe("registry", () => {
  it("gives every dataset a known module and exactly one main dataset per module", () => {
    const slugs = new Set(SIDEBAR_MODULES.map((m) => m.slug));
    const mains = new Map<string, number>();
    for (const d of DATASETS) {
      expect(slugs.has(d.module)).toBe(true);
      if (isPrimary(d.key)) mains.set(d.module, (mains.get(d.module) ?? 0) + 1);
    }
    for (const n of mains.values()) expect(n).toBe(1);
  });

  it("has a rule for every main dataset", () => {
    for (const d of DATASETS) if (isPrimary(d.key)) expect(MODULE_FRESHNESS[d.module]).toBeDefined();
  });

  it("uses the owner's thresholds for the fast feeds", () => {
    expect(MODULE_FRESHNESS.weather.maxAgeHours).toBe(6);
    expect(MODULE_FRESHNESS.news.maxAgeHours).toBe(24);
    expect(MODULE_FRESHNESS.alerts.maxAgeHours).toBe(24);
    expect(MODULE_FRESHNESS.water.maxAgeHours).toBe(72);
    expect(MODULE_FRESHNESS.crops.maxAgeHours).toBe(168);
  });
});

describe("liveFeedSummary", () => {
  const row = (key: string, status: DatasetFreshness["status"]) => ({ key, status }) as DatasetFreshness;

  it("counts current fast feeds and skips feeds not collected here", () => {
    const s = liveFeedSummary([
      row("weather", "late"),
      row("mandi", "current"),
      row("dams", "not_collected"),
      row("news", "current"),
      row("alerts", "current"),
      row("budget", "current"),
    ]);
    expect(s).toEqual({ current: 3, total: 4 });
  });
});

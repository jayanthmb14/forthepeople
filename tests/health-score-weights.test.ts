/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it, vi } from "vitest";

// health-score.ts imports the Prisma client; the helpers under test are pure.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/scraper/lib/district-snapshot", () => ({ readDistrictSnapshot: async () => null }));

import { getDistrictType } from "@/lib/health-score";

describe("getDistrictType (which report-card weights a district gets)", () => {
  it("uses the Census urban share first", () => {
    // Mandya: 1.8 M people but 17 % urban — rural, not "urban" (Sept 2026 audit).
    expect(getDistrictType(1_805_769, 364, 17.08)).toBe("rural");
    // Chennai, Kolkata, Hyderabad, New Delhi: all-urban districts are metros.
    expect(getDistrictType(4_646_732, 26_553, 100)).toBe("metro");
    expect(getDistrictType(142_004, 4_057, 100)).toBe("metro");
    // Mysuru: 41.5 % urban.
    expect(getDistrictType(3_001_127, 476, 41.5)).toBe("urban");
    // Pune: 61 % urban but 9.4 M people.
    expect(getDistrictType(9_429_408, 603, 60.89)).toBe("metro");
  });

  it("falls back to population and density without an urban share", () => {
    expect(getDistrictType(null, null, null)).toBe("rural");
    expect(getDistrictType(undefined, undefined)).toBe("rural");
    expect(getDistrictType(6_000_000, 100, null)).toBe("metro");
    expect(getDistrictType(2_000_000, 100, null)).toBe("urban");
    expect(getDistrictType(800_000, 600, null)).toBe("semi-urban");
  });
});

describe("report-card measures with nothing behind them are placeholders, not findings", () => {
  it("health alerts: never collected (no official source publishes district health advisories)", async () => {
    const { healthAlertsMetric } = await import("@/lib/health-score");
    expect(healthAlertsMetric()).toMatchObject({ noData: true, score: 50 });
  });

  it("power outages: a placeholder until a checked outage row exists; then outages in 30 days count", async () => {
    const { powerReliabilityMetric } = await import("@/lib/health-score");
    expect(powerReliabilityMetric(0, 0)).toMatchObject({ noData: true, score: 50 });
    expect(powerReliabilityMetric(12, 0)).toMatchObject({ value: 0, score: 100 });
    expect(powerReliabilityMetric(12, 4)).toMatchObject({ value: 4, score: 80 });
    expect(powerReliabilityMetric(12, 4).noData).toBeUndefined();
  });

  it("soil records and agri advisories: none on file is a placeholder, not a score of 0", async () => {
    const { soilHealthMetric, agriAdvisoriesMetric } = await import("@/lib/health-score");
    expect(soilHealthMetric(0)).toMatchObject({ noData: true, score: 50 });
    expect(soilHealthMetric(10)).toMatchObject({ value: 10, score: 50 });
    expect(soilHealthMetric(10).noData).toBeUndefined();
    expect(agriAdvisoriesMetric(0)).toMatchObject({ noData: true, score: 50 });
    expect(agriAdvisoriesMetric(3)).toMatchObject({ value: 3, score: 60 });
  });

  it("dataCoverage counts only measures backed by data", async () => {
    const { dataCoverage, healthAlertsMetric, powerReliabilityMetric, soilHealthMetric } = await import("@/lib/health-score");
    expect(dataCoverage([healthAlertsMetric(), powerReliabilityMetric(0, 0), soilHealthMetric(4)])).toEqual({ measured: 1, total: 3 });
  });
});

describe("cropPriceStability (report card: how steady mandi prices were over 30 days)", () => {
  const day = (d: number) => new Date(Date.UTC(2026, 8, d));
  const row = (commodity: string, d: number, modalPrice: number, market = "Mandya") => ({ commodity, variety: null, market, date: day(d), modalPrice });

  it("steady prices per crop score high, however far apart the crops' prices are", async () => {
    const { cropPriceStability } = await import("@/lib/health-score");
    // Onion ₹1,500, wheat ₹2,400, areca ₹45,000 — each flat for three days.
    const rows = ["Onion:1500", "Wheat:2400", "Arecanut:45000"].flatMap((x) => {
      const [c, p] = x.split(":");
      return [1, 2, 3].map((d) => row(c, d, Number(p)));
    });
    const m = cropPriceStability(rows);
    expect(m.noData).toBeUndefined();
    expect(m.value).toBe(0);
    expect(m.score).toBe(100);
  });

  it("measures change over time within one crop and market", async () => {
    const { cropPriceStability } = await import("@/lib/health-score");
    // 1000, 1200, 800: mean 1000, population std-dev 163.3 → CV 16.3 % → score 51.
    const m = cropPriceStability([row("Tomato", 1, 1000), row("Tomato", 2, 1200), row("Tomato", 3, 800)]);
    expect(m.value).toBe(16);
    expect(m.score).toBe(51);
  });

  it("is a placeholder without at least three dated prices for one crop in one market", async () => {
    const { cropPriceStability } = await import("@/lib/health-score");
    const oneEach = [row("Onion", 1, 1500), row("Wheat", 1, 2400), row("Tomato", 2, 900), row("Tomato", 3, 950, "Other APMC")];
    expect(cropPriceStability(oneEach)).toMatchObject({ noData: true });
    expect(cropPriceStability([])).toMatchObject({ noData: true });
  });
});

describe("storedWeights (the health-score API's category weights)", () => {
  it("returns the weights the grade was computed with (metro: infrastructure 13, agriculture 5, digital 7)", async () => {
    const { storedWeights } = await import("@/lib/health-score");
    const metro = { governance: 15, education: 12, health: 12, infrastructure: 13, waterSanitation: 10, economy: 10, safety: 10, agriculture: 5, digitalAccess: 7, citizenWelfare: 6 };
    expect(storedWeights(metro)).toEqual(metro);
  });

  it("falls back to the base weight for a missing or broken entry", async () => {
    const { storedWeights } = await import("@/lib/health-score");
    const w = storedWeights({ agriculture: 11, digitalAccess: "x" });
    expect(w.agriculture).toBe(11);
    expect(w.digitalAccess).toBe(5);
    expect(w.governance).toBe(15);
    expect(storedWeights(null).infrastructure).toBe(12);
  });
});

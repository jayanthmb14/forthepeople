/**
 * Unit tests for src/lib/badge-level.ts — supporter badge tiers by months
 * active. Uses fake timers so the "now" side of the calculation is fixed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateBadgeLevel, getMonthsActive, BADGE_COLORS } from "@/lib/badge-level";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // the module's own 30-day month
const NOW = new Date("2026-09-27T00:00:00.000Z");
const monthsAgo = (m: number) => new Date(NOW.getTime() - m * MONTH_MS);

describe("calculateBadgeLevel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("founders are platinum immediately, even with no activation date", () => {
    expect(calculateBadgeLevel(null, "founder")).toBe("platinum");
    expect(calculateBadgeLevel(monthsAgo(0), "founder")).toBe("platinum");
  });

  it("returns null with no activation date or under 3 months", () => {
    expect(calculateBadgeLevel(null)).toBeNull();
    expect(calculateBadgeLevel(monthsAgo(0))).toBeNull();
    expect(calculateBadgeLevel(monthsAgo(2))).toBeNull();
  });

  it("steps bronze → silver → gold → platinum at 3 / 6 / 12 / 24 months", () => {
    expect(calculateBadgeLevel(monthsAgo(3))).toBe("bronze");
    expect(calculateBadgeLevel(monthsAgo(5))).toBe("bronze");
    expect(calculateBadgeLevel(monthsAgo(6))).toBe("silver");
    expect(calculateBadgeLevel(monthsAgo(12))).toBe("gold");
    expect(calculateBadgeLevel(monthsAgo(24))).toBe("platinum");
  });

  it("getMonthsActive floors to whole 30-day months", () => {
    expect(getMonthsActive(null)).toBe(0);
    expect(getMonthsActive(monthsAgo(7.9))).toBe(7);
  });

  it("every badge level has a colour set", () => {
    for (const level of ["bronze", "silver", "gold", "platinum"]) {
      expect(BADGE_COLORS[level]).toMatchObject({ bg: expect.any(String), text: expect.any(String), border: expect.any(String) });
    }
  });
});

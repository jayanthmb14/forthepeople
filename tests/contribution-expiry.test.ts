/**
 * Unit tests for src/lib/contribution-expiry.ts — expiry / grace-period maths
 * for one-time supporter contributions. Uses fake timers so "now" is fixed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateOneTimeExpiry,
  calculateFounderGrace,
  calculateStandardGrace,
  daysUntil,
  formatExpiryLabel,
} from "@/lib/contribution-expiry";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-09-27T12:00:00.000Z");

describe("calculateOneTimeExpiry", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");

  it("gives 30 days below ₹500", () => {
    expect(calculateOneTimeExpiry(100, from).getTime()).toBe(from.getTime() + 30 * DAY_MS);
    expect(calculateOneTimeExpiry(499, from).getTime()).toBe(from.getTime() + 30 * DAY_MS);
  });

  it("gives 60 days from ₹500 and 90 days from ₹2000", () => {
    expect(calculateOneTimeExpiry(500, from).getTime()).toBe(from.getTime() + 60 * DAY_MS);
    expect(calculateOneTimeExpiry(1999, from).getTime()).toBe(from.getTime() + 60 * DAY_MS);
    expect(calculateOneTimeExpiry(2000, from).getTime()).toBe(from.getTime() + 90 * DAY_MS);
  });
});

describe("grace periods", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  it("founder = 90 days, standard = 30 days", () => {
    expect(calculateFounderGrace(from).getTime()).toBe(from.getTime() + 90 * DAY_MS);
    expect(calculateStandardGrace(from).getTime()).toBe(from.getTime() + 30 * DAY_MS);
  });
});

describe("daysUntil / formatExpiryLabel (fixed clock)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing or invalid dates", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil("not-a-date")).toBeNull();
    expect(formatExpiryLabel(null)).toBeNull();
  });

  it("counts whole days ahead (ceil) and accepts ISO strings", () => {
    expect(daysUntil(new Date(NOW.getTime() + 5 * DAY_MS))).toBe(5);
    expect(daysUntil(new Date(NOW.getTime() + 4.2 * DAY_MS))).toBe(5);
    expect(daysUntil(new Date(NOW.getTime() - 2 * DAY_MS).toISOString())).toBe(-2);
  });

  it("labels past, imminent and distant expiries differently", () => {
    expect(formatExpiryLabel(new Date(NOW.getTime() - DAY_MS))).toBe("Expired");
    expect(formatExpiryLabel(new Date(NOW.getTime() + 1 * DAY_MS))).toBe("Expires in 1 day");
    expect(formatExpiryLabel(new Date(NOW.getTime() + 5 * DAY_MS))).toBe("Expires in 5 days");
    expect(formatExpiryLabel(new Date(NOW.getTime() + 40 * DAY_MS))).toMatch(/^Active until /);
  });
});

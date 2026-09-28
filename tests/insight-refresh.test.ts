/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */
import { describe, expect, it } from "vitest";
import { insightExpired, leadersNeedsRefresh } from "@/lib/insight-refresh";

const now = new Date("2026-09-28T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("leadersNeedsRefresh", () => {
  it("regenerates a leaders insight 7 days after it was made (no election)", () => {
    expect(leadersNeedsRefresh({ generatedAt: daysAgo(7), expiresAt: now, electionLive: false, now })).toBe(true);
    // Even if its expiresAt were later, 7 days of age is the hard limit.
    expect(leadersNeedsRefresh({ generatedAt: daysAgo(7), expiresAt: inDays(1), electionLive: false, now })).toBe(true);
  });

  it("refreshes daily while an election is live, before the insight expires", () => {
    expect(leadersNeedsRefresh({ generatedAt: daysAgo(2), expiresAt: inDays(5), electionLive: true, now })).toBe(true);
    expect(leadersNeedsRefresh({ generatedAt: daysAgo(0.5), expiresAt: inDays(6.5), electionLive: true, now })).toBe(false);
  });

  it("keeps a 3-day-old insight outside elections", () => {
    expect(leadersNeedsRefresh({ generatedAt: daysAgo(3), expiresAt: inDays(4), electionLive: false, now })).toBe(false);
  });

  it("generates a missing insight", () => {
    expect(leadersNeedsRefresh({ generatedAt: null, expiresAt: null, electionLive: false, now })).toBe(true);
  });

  it("the old guess (expiresAt − 24 h) would have waited until day 13 — the real age does not", () => {
    // Generated 8 days ago with the 7-day TTL: expired a day ago.
    const generatedAt = daysAgo(8);
    const expiresAt = daysAgo(1);
    const oldGuessAgeMs = now.getTime() - (expiresAt.getTime() - 24 * 3600_000);
    expect(oldGuessAgeMs).toBeLessThan(7 * 86_400_000); // the bug: "2 days old"
    expect(leadersNeedsRefresh({ generatedAt, expiresAt, electionLive: false, now })).toBe(true);
  });
});

describe("insightExpired", () => {
  it("is true when missing or at/after expiry", () => {
    expect(insightExpired({ generatedAt: null, expiresAt: null }, now)).toBe(true);
    expect(insightExpired({ generatedAt: daysAgo(1), expiresAt: now }, now)).toBe(true);
    expect(insightExpired({ generatedAt: daysAgo(1), expiresAt: inDays(1) }, now)).toBe(false);
  });
});

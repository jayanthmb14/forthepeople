/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Cron schedule maths (src/lib/cron-auth.ts), used by /api/health and the
// admin System Health tab. The tab's freshness colours must follow
// vercel.json, not the old Railway schedules (weather 5 min, crops 15 min).
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/redis", () => ({ redis: null, default: null }));

import { cronIntervalMinutes, cronIntervalsFor } from "@/lib/cron-auth";
import vercelConfig from "../vercel.json";

describe("cronIntervalMinutes", () => {
  it("reads the schedule shapes vercel.json uses", () => {
    expect(cronIntervalMinutes("*/30 * * * *")).toBe(30);
    expect(cronIntervalMinutes("10 */4 * * *")).toBe(240);
    expect(cronIntervalMinutes("0 0,12 * * *")).toBe(720);
    expect(cronIntervalMinutes("30 3 * * *")).toBe(1440);
    expect(cronIntervalMinutes("0 6 * * 1")).toBe(7 * 24 * 60);
  });
});

describe("cronIntervalsFor (System Health expected intervals)", () => {
  const jobs = { weather: "scrape-weather", news: "scrape-news", crops: "scrape-crops", insights: "generate-insights" };

  it("derives each module's interval from vercel.json", () => {
    expect(cronIntervalsFor(vercelConfig.crons, jobs)).toEqual({ weather: 30, news: 240, crops: 1440, insights: 720 });
  });

  it("leaves out a key whose cron is not scheduled", () => {
    expect(cronIntervalsFor([{ path: "/api/cron/scrape-weather", schedule: "*/30 * * * *" }], jobs)).toEqual({ weather: 30 });
  });
});

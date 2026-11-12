/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// On Cloudflare one 5-minute Cron Trigger runs each vercel.json cron whose
// schedule matches that minute (cloudflare/worker.ts). A schedule that fires
// at a minute the 5-minute tick never reaches would silently never run.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cronMatches } from "@/lib/cron-match";

const vercel = JSON.parse(readFileSync(path.resolve(__dirname, "..", "vercel.json"), "utf8")) as {
  crons: Array<{ path: string; schedule: string }>;
};
const utc = (iso: string) => new Date(iso + "Z");

describe("cronMatches", () => {
  it("handles *, */n, lists, ranges and stepped ranges", () => {
    expect(cronMatches("*/30 * * * *", utc("2026-11-12T10:30:00"))).toBe(true);
    expect(cronMatches("*/30 * * * *", utc("2026-11-12T10:35:00"))).toBe(false);
    expect(cronMatches("40 1,13 * * *", utc("2026-11-12T13:40:00"))).toBe(true);
    expect(cronMatches("40 1,13 * * *", utc("2026-11-12T12:40:00"))).toBe(false);
    expect(cronMatches("15 */6 * * *", utc("2026-11-12T18:15:00"))).toBe(true);
    expect(cronMatches("15 */6 * * *", utc("2026-11-12T19:15:00"))).toBe(false);
    expect(cronMatches("0 9-17/4 * * *", utc("2026-11-12T13:00:00"))).toBe(true);
    expect(cronMatches("0 9-17/4 * * *", utc("2026-11-12T15:00:00"))).toBe(false);
  });

  it("reads day-of-week with Sunday as 0 or 7", () => {
    // 2026-11-15 is a Sunday, 2026-11-16 a Monday.
    expect(cronMatches("0 6 * * 0", utc("2026-11-15T06:00:00"))).toBe(true);
    expect(cronMatches("0 6 * * 7", utc("2026-11-15T06:00:00"))).toBe(true);
    expect(cronMatches("0 6 * * 1", utc("2026-11-16T06:00:00"))).toBe(true);
    expect(cronMatches("0 6 * * 1", utc("2026-11-15T06:00:00"))).toBe(false);
  });

  it("rejects malformed expressions", () => {
    expect(() => cronMatches("* * * *", new Date())).toThrow();
    expect(() => cronMatches("*/0 * * * *", new Date())).toThrow();
  });
});

describe("vercel.json crons on the 5-minute Cloudflare tick", () => {
  it("every schedule fires only on minutes the tick reaches", () => {
    for (const c of vercel.crons) {
      let fires = 0;
      for (let m = 0; m < 60; m++) {
        const at = new Date(Date.UTC(2026, 10, 16, 6, m)); // a Monday, 06:xx UTC
        for (let h = 0; h < 24; h++) {
          at.setUTCHours(h);
          if (cronMatches(c.schedule, at)) {
            fires++;
            expect(m % 5, `${c.path} fires at minute ${m}`).toBe(0);
          }
        }
      }
      // Weekly crons may not fire on this particular Monday; all others must.
      if (!/ \d+$/.test(c.schedule.trim())) expect(fires, c.path).toBeGreaterThan(0);
    }
  });
});

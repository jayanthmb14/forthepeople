/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// vercel.json is the only schedule that runs. Every other place that
// names a cron — the route's header comment, PORTAL_COLLECTORS (the
// collector registry) and the data-sources page's DATASETS — must agree
// with it. (The registry's old test compared it with the route comment,
// which could itself be wrong: health-score's said weekly for months.)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PORTAL_COLLECTORS } from "@/scraper/lib/collector-registry";
import { DATASETS } from "@/lib/constants/dataset-collection";

const ROOT = path.resolve(__dirname, "..");
const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8")) as {
  crons: Array<{ path: string; schedule: string }>;
};
const scheduleOf = new Map(vercel.crons.map((c) => [c.path, c.schedule]));
const routeDirs = readdirSync(path.join(ROOT, "src/app/api/cron"));

describe("vercel.json crons ↔ cron routes", () => {
  it("every scheduled path has a route, once", () => {
    expect(new Set(vercel.crons.map((c) => c.path)).size).toBe(vercel.crons.length);
    for (const c of vercel.crons) {
      expect(existsSync(path.join(ROOT, "src/app", c.path, "route.ts")), c.path).toBe(true);
      expect(c.schedule.trim().split(/\s+/), c.path).toHaveLength(5);
    }
  });

  it("every cron route is scheduled", () => {
    for (const dir of routeDirs) expect(scheduleOf.has(`/api/cron/${dir}`), dir).toBe(true);
  });

  it("a route header that names a schedule names vercel.json's", () => {
    for (const dir of routeDirs) {
      const src = readFileSync(path.join(ROOT, "src/app/api/cron", dir, "route.ts"), "utf8");
      const m = /schedule "([^"]+)"/.exec(src.slice(0, 1500));
      if (m) expect(m[1], dir).toBe(scheduleOf.get(`/api/cron/${dir}`));
    }
  });
});

describe("other lists of crons agree with vercel.json", () => {
  it("PORTAL_COLLECTORS", () => {
    for (const c of PORTAL_COLLECTORS) expect(c.schedule, c.key).toBe(scheduleOf.get(c.cronPath));
  });

  it("DATASETS (the data-sources page) only names scheduled crons", () => {
    for (const d of DATASETS) {
      if (d.cron) expect(scheduleOf.has(d.cron), `${d.key}: ${d.cron}`).toBe(true);
    }
  });
});

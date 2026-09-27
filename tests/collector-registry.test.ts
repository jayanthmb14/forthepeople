/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The v5.1 portal-collector registry (src/scraper/lib/collector-registry.ts)
// must point at cron routes that exist and carry sane schedules.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PORTAL_COLLECTORS, tenderDistricts } from "@/scraper/lib/collector-registry";

describe("PORTAL_COLLECTORS", () => {
  it("every entry has a route whose header names the same schedule", () => {
    for (const c of PORTAL_COLLECTORS) {
      const file = path.join(__dirname, "..", "src/app", c.cronPath, "route.ts");
      expect(existsSync(file), file).toBe(true);
      expect(readFileSync(file, "utf8")).toContain(`schedule "${c.schedule}"`);
      expect(c.schedule.split(" ")).toHaveLength(5);
      expect(c.expectedMaxAgeMinutes).toBeGreaterThan(60);
      expect(c.sourceUrl).toMatch(/^https:\/\/[a-z0-9.-]+\.(gov|nic)\.in\//);
    }
  });

  it("has unique keys and cron paths", () => {
    expect(new Set(PORTAL_COLLECTORS.map((c) => c.key)).size).toBe(PORTAL_COLLECTORS.length);
    expect(new Set(PORTAL_COLLECTORS.map((c) => c.cronPath)).size).toBe(PORTAL_COLLECTORS.length);
  });

  it("lists the districts whose tenders are followed", () => {
    expect(tenderDistricts()).toEqual(expect.arrayContaining(["pune", "mumbai", "chennai", "kolkata", "new-delhi"]));
  });
});

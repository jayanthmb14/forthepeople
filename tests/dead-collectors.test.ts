/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The Railway scheduler (and the jobs only it ran) and the first tender
// pipeline (orchestrator, engines, PDF parsers) never ran in production
// and were deleted on 2026-09-28. `npm run scraper` loaded .env
// (production) and hit sources far more often than the politeness rule
// allows, so neither may come back by a stray merge.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");

describe("deleted collectors stay deleted", () => {
  it("no Railway scheduler, old tender engines or src/cron CLIs", () => {
    for (const p of [
      "src/scraper/scheduler.ts",
      "src/scraper/tender-orchestrator.ts",
      "src/scraper/engines",
      "src/scraper/parsers",
      "src/cron",
    ]) {
      expect(existsSync(path.join(ROOT, p)), p).toBe(false);
    }
  });

  it("no npm script starts a scheduler", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
    expect(Object.keys(pkg.scripts)).not.toContain("scraper");
    expect(Object.values(pkg.scripts).join("\n")).not.toMatch(/scheduler/);
  });
});

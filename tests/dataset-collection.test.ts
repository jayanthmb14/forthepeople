/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The "Where our data comes from" page says a dataset arrives
// automatically only when a cron really collects it. These checks keep
// src/lib/constants/dataset-collection.ts honest against vercel.json and
// the dams collector's district list.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTO_DAM_DISTRICTS, DATASETS, collectionFor } from "@/lib/constants/dataset-collection";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";

const root = path.resolve(__dirname, "..");
const cronPaths = new Set<string>(
  (JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8")).crons ?? []).map((c: { path: string }) => c.path),
);

describe("dataset-collection", () => {
  it("marks a dataset automatic only when vercel.json runs its cron", () => {
    for (const d of DATASETS.filter((x) => x.collection === "auto")) {
      expect(d.cron, `${d.key} is "auto" but names no cron`).toBeTruthy();
      expect(cronPaths.has(d.cron as string), `${d.key}: ${d.cron} is not in vercel.json`).toBe(true);
      expect(d.every, `${d.key} is "auto" but says nothing about how often`).toBeTruthy();
    }
  });

  it("uses unique keys and real module slugs", () => {
    const keys = DATASETS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    const slugs = new Set(SIDEBAR_MODULES.map((m) => m.slug));
    for (const d of DATASETS) if (d.slug) expect(slugs.has(d.slug), `${d.key}: unknown page ${d.slug}`).toBe(true);
  });

  it("falls back for districts a collector does not cover", () => {
    const dams = DATASETS.find((d) => d.key === "dams");
    expect(dams).toBeDefined();
    expect(collectionFor(dams!, "mandya")).toBe("auto");
    expect(collectionFor(dams!, "pune")).toBe("hand");
  });

  it("matches the dams collector's district list", () => {
    const src = fs.readFileSync(path.join(root, "src/scraper/jobs/dams.ts"), "utf8");
    const block = src.match(/KARNATAKA_DISTRICT_DAMS[^=]*=\s*\{([\s\S]*?)\n\};/);
    if (!block) return; // the collector was restructured; update this check with it
    const covered = [...block[1].matchAll(/^\s*"?([a-z0-9-]+)"?\s*:/gm)].map((m) => m[1]).sort();
    expect(covered).toEqual([...AUTO_DAM_DISTRICTS].sort());
  });
});

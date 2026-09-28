/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isSlug } from "@/lib/read-api";

// /api/data/[module] answers 404 for a module outside MODULES before any
// cache or database work, so the list must name every case of the switch.
const src = readFileSync(join(__dirname, "../src/app/api/data/[module]/route.ts"), "utf8");

describe("/api/data/[module] module list", () => {
  it("MODULES names exactly the modules the switch answers", () => {
    const listBody = /const MODULES = new Set\(\[([\s\S]*?)\]\)/.exec(src)?.[1] ?? "";
    const listed = [...listBody.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]).sort();
    const fetchBody = src.slice(src.indexOf("async function fetchModule"));
    const cases = [...fetchBody.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]).sort();
    expect(listed.length).toBeGreaterThan(20);
    expect(listed).toEqual(cases);
  });

  it("no longer puts ?taluk= in the cache key", () => {
    expect(src).not.toMatch(/searchParams\.get\("taluk"\)|sp\.get\("taluk"\)/);
  });
});

describe("isSlug", () => {
  it("accepts district and state slugs only", () => {
    for (const ok of ["mandya", "bengaluru-urban", "new-delhi", "tamil-nadu"]) expect(isSlug(ok)).toBe(true);
    for (const bad of ["", "Mandya", "mandya;drop", "a b", "../x", "x".repeat(65), null, undefined]) expect(isSlug(bad)).toBe(false);
  });
});

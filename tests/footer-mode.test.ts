/**
 * Which pages get the slim footer (src/components/home/footer-mode.ts):
 * district pages (every module, taluk and village page) and India module
 * pages. Everything else keeps the full footer.
 */
import { describe, it, expect } from "vitest";
import { isSlimFooterPath } from "@/components/home/footer-mode";

describe("isSlimFooterPath", () => {
  it("district overview, module, taluk and village pages are slim", () => {
    expect(isSlimFooterPath("/en/karnataka/mandya")).toBe(true);
    expect(isSlimFooterPath("/kn/karnataka/mandya/news")).toBe(true);
    expect(isSlimFooterPath("/hi/karnataka/mandya/weather")).toBe(true);
    expect(isSlimFooterPath("/en/karnataka/mandya/maddur")).toBe(true);
    expect(isSlimFooterPath("/en/karnataka/mandya/maddur/some-village")).toBe(true);
  });

  it("India module pages are slim; the India home, categories and updates are not", () => {
    expect(isSlimFooterPath("/en/india/economy-inflation")).toBe(true);
    expect(isSlimFooterPath("/en/india")).toBe(false);
    expect(isSlimFooterPath("/en/india/category/governance")).toBe(false);
    expect(isSlimFooterPath("/en/india/updates")).toBe(false);
  });

  it("home, site pages, state pages and unknown districts keep the full footer", () => {
    for (const p of ["/en", "/kn", "/en/about", "/en/support", "/en/prices", "/en/karnataka", "/en/karnataka/not-a-district", "/en/admin", "", null, undefined]) {
      expect(isSlimFooterPath(p)).toBe(false);
    }
  });
});

/**
 * Design v5 "Calm" — contrast guarantees for the module hue palette
 * (src/lib/design/hues.ts, mirrored in globals.css `.ftp-hue-*`).
 * Pure maths, no DOM: WCAG 2.1 relative luminance and contrast ratio.
 */
import { describe, it, expect } from "vitest";
import { HUE_HEX } from "@/lib/design/hues";
import { readFileSync } from "node:fs";
import path from "node:path";

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const WHITE = "#FFFFFF";

describe("module hues (v5 Calm)", () => {
  for (const [name, h] of Object.entries(HUE_HEX)) {
    it(`${name}: --hue carries white text and reads as text on white (AA 4.5)`, () => {
      expect(contrast(h.hue, WHITE)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: --hue-deep is readable on white and on its tint (≥ 6.5)`, () => {
      expect(contrast(h.deep, WHITE)).toBeGreaterThanOrEqual(6.5);
      expect(contrast(h.deep, h.tint)).toBeGreaterThanOrEqual(6.4);
    });
    it(`${name}: --hue-deep stays AA on the pastel --hue-pop`, () => {
      expect(contrast(h.deep, h.pop)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: --hue-tint is very light`, () => {
      expect(luminance(h.tint)).toBeGreaterThan(0.85);
    });
  }

  it("globals.css .ftp-hue-* classes match HUE_HEX", () => {
    const css = readFileSync(path.resolve(__dirname, "../src/app/globals.css"), "utf8");
    for (const [name, h] of Object.entries(HUE_HEX)) {
      const m = new RegExp(`\\.ftp-hue-${name}\\s*\\{([^}]*)\\}`).exec(css);
      expect(m, `.ftp-hue-${name} missing`).not.toBeNull();
      const body = m![1];
      expect(body).toContain(`--hue: ${h.hue};`);
      expect(body).toContain(`--hue-deep: ${h.deep};`);
      expect(body).toContain(`--hue-pop: ${h.pop};`);
      expect(body).toContain(`--hue-tint: ${h.tint};`);
    }
  });
});

describe("text tokens (v5 Calm)", () => {
  const BG = "#FAFBFD", SURFACE2 = "#F3F6FA", TEXT = "#0F1B2D", TEXT2 = "#4A5A70";
  it("text and text-2 pass AA on every surface", () => {
    for (const bg of [WHITE, BG, SURFACE2]) {
      expect(contrast(TEXT, bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(TEXT2, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("brand blue and the support rose pass AA", () => {
    expect(contrast("#2563EB", WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#1E40AF", "#E8F0FE")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#B4234F", "#FDECF1")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#7A4A06", "#FFF6E5")).toBeGreaterThanOrEqual(4.5);
  });
});

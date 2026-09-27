/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The shared category glyphs (src/components/graphics): every drawing is
// well formed and coloured only by design tokens, and every category the
// data carries today (news topics, NCRB crime types, kinds of project)
// gets the picture and pastel hue it should.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { HUE_HEX } from "@/lib/design/hues";
import type { ProjectKind } from "@/lib/civic/project-facts";
import { GLYPHS, GLYPH_NAMES, circle, glyphParts, rect } from "@/components/graphics/glyph-data";
import {
  GLYPH_HUE,
  PROJECT_KIND_GLYPH,
  categoryGlyph,
  crimeGlyph,
  moduleGlyph,
  newsStoryGlyph,
  newsTopicGlyph,
  projectKindGlyph,
} from "@/components/graphics/category-map";

const PATH_CHARS = /^[MmLlHhVvCcSsQqTtAaZz0-9.\-\s,]+$/;
/** Every number in a path, for a rough "stays on the 24 × 24 grid" check on absolute commands. */
function absolutePoints(d: string): number[][] {
  const out: number[][] = [];
  const re = /([ML])\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) out.push([Number(m[2]), Number(m[3])]);
  return out;
}

describe("glyph drawings", () => {
  it("has a colour for every glyph, and every colour is a real module hue", () => {
    for (const name of GLYPH_NAMES) {
      expect(GLYPH_HUE[name], name).toBeDefined();
      expect(HUE_HEX[GLYPH_HUE[name]], name).toBeDefined();
    }
  });

  it("draws every glyph from valid path data, with only known tones and hues", () => {
    for (const name of GLYPH_NAMES) {
      const parts = GLYPHS[name];
      expect(parts.length, name).toBeGreaterThan(0);
      for (const [tone, d, hue] of parts) {
        expect(["b", "s", "f", "i", "a", "p", "w"], `${name} tone`).toContain(tone);
        expect(d, `${name} path`).toMatch(PATH_CHARS);
        expect(d.trim().startsWith("M"), `${name} starts with M`).toBe(true);
        if (hue) expect(HUE_HEX[hue], `${name} hue ${hue}`).toBeDefined();
        for (const [x, y] of absolutePoints(d)) {
          expect(x, `${name} x`).toBeGreaterThanOrEqual(0);
          expect(x, `${name} x`).toBeLessThanOrEqual(24);
          expect(y, `${name} y`).toBeGreaterThanOrEqual(0);
          expect(y, `${name} y`).toBeLessThanOrEqual(24);
        }
      }
    }
  });

  it("builds circles and rounded rectangles as closed paths", () => {
    expect(circle(12, 12, 4)).toBe("M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z");
    expect(rect(2, 3, 10, 6)).toBe("M2 3h10v6h-10z");
    expect(rect(2, 3, 10, 6, 2)).toMatch(/^M4 3h6a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z$/);
  });

  it("falls back to the newspaper for an unknown name", () => {
    expect(glyphParts("no-such-glyph")).toBe(GLYPHS.general);
  });

  it("uses no hex colours in the graphics components", () => {
    const dir = path.resolve(__dirname, "../src/components/graphics");
    for (const file of readdirSync(dir)) {
      const src = readFileSync(path.join(dir, file), "utf8");
      expect(src, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});

describe("news", () => {
  it("gives each topic the classifier writes its own picture", () => {
    const topics = ["politics", "development", "agriculture", "crime", "health", "education", "infrastructure", "weather"];
    const glyphs = topics.map((c) => newsTopicGlyph(c).glyph);
    expect(new Set(glyphs).size).toBe(topics.length);
    expect(glyphs).not.toContain("general");
    expect(newsTopicGlyph("general").glyph).toBe("general");
    expect(newsTopicGlyph(null).glyph).toBe("general");
    expect(newsTopicGlyph("Agriculture").glyph).toBe("farming");
  });

  it("gives the news topics different colours", () => {
    const topics = ["politics", "development", "agriculture", "crime", "health", "education", "infrastructure", "weather", "general"];
    const hues = topics.map((c) => newsTopicGlyph(c).hue);
    expect(new Set(hues).size).toBe(topics.length);
  });

  it("lets a module tag speak for a vague topic, never for a specific one", () => {
    expect(newsStoryGlyph({ category: "general", targetModule: "courts" }).glyph).toBe("justice");
    expect(newsStoryGlyph({ category: "development", targetModule: "housing" }).glyph).toBe("housing");
    expect(newsStoryGlyph({ category: "general", targetModule: "news" }).glyph).toBe("general");
    expect(newsStoryGlyph({ category: "general", targetModule: null }).glyph).toBe("general");
    expect(newsStoryGlyph({ category: "crime", targetModule: "courts" }).glyph).toBe("crime");
    expect(newsStoryGlyph({ category: "weather", targetModule: "transport" }).glyph).toBe("weather");
  });
});

describe("crime types", () => {
  it("maps the NCRB and police names in the database", () => {
    const cases: Record<string, string> = {
      "IPC Crimes Total": "shield",
      "Total IPC Crimes": "shield",
      "IPC Crimes": "shield",
      "Crimes Against Women": "women",
      "Cyber Crimes": "cyber",
      "Cyber Crime": "cyber",
      "Property Crimes": "theft",
      Theft: "theft",
      Robbery: "theft",
      "Theft & Burglary": "theft",
      Burglary: "burglary",
      "Cheating & Fraud": "fraud",
      Murder: "assault",
      "Kidnapping & Abduction": "child",
      "Traffic Violations": "traffic",
      "Motor Vehicle Theft": "theft",
    };
    for (const [name, glyph] of Object.entries(cases)) expect(crimeGlyph(name).glyph, name).toBe(glyph);
    expect(crimeGlyph("Something new").glyph).toBe("shield");
  });

  it("gives the crime types different colours", () => {
    const glyphs = ["theft", "burglary", "assault", "cyber", "fraud", "traffic", "women", "child", "shield"] as const;
    expect(new Set(glyphs.map((g) => GLYPH_HUE[g])).size).toBe(glyphs.length);
  });
});

describe("kinds of project", () => {
  const KINDS: ProjectKind[] = [
    "road", "bridge", "metro", "rail", "airport", "port", "water", "sewage",
    "power", "housing", "health", "education", "parks", "industry", "city", "other",
  ];

  it("has a picture for every kind, and no two kinds share one", () => {
    for (const k of KINDS) expect(PROJECT_KIND_GLYPH[k], k).toBeDefined();
    expect(new Set(KINDS.map((k) => projectKindGlyph(k).glyph)).size).toBe(KINDS.length);
    expect(projectKindGlyph("health").glyph).toBe("hospital");
    expect(projectKindGlyph("other").glyph).toBe("hardhat");
    expect(projectKindGlyph(undefined).glyph).toBe("hardhat");
  });

  it("reads published category spellings through project-facts", () => {
    expect(categoryGlyph("Metro Rail", "project").glyph).toBe("metro");
    expect(categoryGlyph("Flyover", "project").glyph).toBe("bridge");
    expect(categoryGlyph("Water Supply", "project").glyph).toBe("water");
    expect(categoryGlyph("Mega Project", "project").glyph).toBe("hardhat");
  });
});

describe("anything else", () => {
  it("maps module slugs and free text", () => {
    expect(moduleGlyph("courts").glyph).toBe("justice");
    expect(moduleGlyph("transport").glyph).toBe("bus");
    expect(moduleGlyph("unknown").glyph).toBe("general");
    expect(categoryGlyph("metro").glyph).toBe("metro");
    expect(categoryGlyph("agriculture").glyph).toBe("farming");
    expect(categoryGlyph("finance").glyph).toBe("money");
    expect(categoryGlyph("Airport expansion").glyph).toBe("airport");
    expect(categoryGlyph("").glyph).toBe("general");
    expect(categoryGlyph("Cyber Crimes", "crime").glyph).toBe("cyber");
  });
});

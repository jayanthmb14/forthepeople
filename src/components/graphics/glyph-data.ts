/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Category glyphs — the drawings (pure data, no React)
// ═══════════════════════════════════════════════════════════════════════
//  One small, crafted picture per category, so a 5-year-old and a
//  60-year-old can tell news, crime and project kinds apart at a glance
//  without reading (v5.1 "Warm Calm": illustrated SVG marks, no emoji).
//
//  Every glyph is drawn on the same 24 × 24 grid, 2–3 units of padding,
//  round caps and joins, in a soft duotone:
//
//    b  body     pastel fill (--hue-pop) + ink outline (--hue-deep)
//    s  stroke   ink outline only (details, lines)
//    f  fill     pastel fill only (soft shapes)
//    i  ink      solid ink (wheels, dots)
//    a  accent   solid mid tone (--hue): a small highlight
//    p  paper    white fill (--ftp-surface) + ink outline (windows, doors)
//    w  shine    white line only (a highlight on a pastel shape)
//
//  A part may name another hue ("yellow" for the sun, "cyan" for water);
//  it is drawn with that hue's variables (.ftp-hue-<name> on the path), so
//  colours still come only from the design tokens. Rendered by
//  <Glyph> / <CategoryGlyph> (./CategoryGlyph.tsx); chosen for a category
//  by ./category-map.ts.

import type { Hue } from "@/lib/design/hues";

export type GlyphTone = "b" | "s" | "f" | "i" | "a" | "p" | "w";
/** One path of a glyph: tone, path data, optional hue override. */
export type GlyphPart = readonly [tone: GlyphTone, d: string, hue?: Hue];

/** Round to 2 decimals so the path strings stay short. */
const n = (v: number) => String(Math.round(v * 100) / 100);

/** A circle as path data. */
export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
}

/** A rounded rectangle as path data. */
export function rect(x: number, y: number, w: number, h: number, r = 0): string {
  const rr = Math.min(r, w / 2, h / 2);
  if (rr <= 0) return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
  const a = (dx: number, dy: number) => `a${n(rr)} ${n(rr)} 0 0 1 ${n(dx)} ${n(dy)}`;
  return (
    `M${n(x + rr)} ${n(y)}h${n(w - 2 * rr)}${a(rr, rr)}v${n(h - 2 * rr)}${a(-rr, rr)}` +
    `h${n(-(w - 2 * rr))}${a(-rr, -rr)}v${n(-(h - 2 * rr))}${a(rr, -rr)}z`
  );
}

/** The shield shared by "women's safety" and "all crimes / safety". */
const SHIELD = "M12 2.8 19 5.5v5.8c0 4.5-3 8.1-7 9.7-4-1.6-7-5.2-7-9.7V5.5z";

export const GLYPHS = {
  // ── News topics ─────────────────────────────────────────────────────
  /** General news: a folded newspaper. */
  general: [
    ["b", rect(3, 4.5, 14.5, 15.5, 2)],
    ["s", "M17.5 8.5H20a1 1 0 0 1 1 1V18a2 2 0 0 1-2 2h-1.5"],
    ["a", rect(6, 7.5, 5, 4, 0.8)],
    ["s", "M13.2 8h1.8M13.2 11h1.8M6 14.5h9M6 17h9"],
  ],
  /** Politics and elections: a ballot paper going into a box. */
  politics: [
    ["p", "M8 12.5V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7.5"],
    ["s", "M10.2 8.2l1.3 1.3 2.6-2.6"],
    ["b", rect(3.5, 11, 17, 9.5, 2)],
    ["s", "M9 14.5h6"],
  ],
  /** Crime and police news: a police siren. */
  crime: [
    ["s", "M12 2.5v2M4.6 5.3 6 6.7M19.4 5.3 18 6.7M2.5 12.5h2M19.5 12.5h2"],
    ["b", "M6.5 17.5v-5a5.5 5.5 0 0 1 11 0v5z"],
    ["w", "M9.2 12.6a2.8 2.8 0 0 1 2.8-2.8"],
    ["b", rect(4, 17.5, 16, 3.5, 1)],
  ],
  /** Accidents: a car with a bump mark. */
  accident: [
    ["b", "M3.5 17.5v-3.2c0-.5.2-1 .5-1.4l2.1-3.6a2 2 0 0 1 1.7-1h6.4a2 2 0 0 1 1.7 1l2.1 3.6c.3.4.5.9.5 1.4v3.2a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"],
    ["p", "M7.2 12.8l1.3-2.6h5l1.3 2.6z"],
    ["i", circle(7, 18.5, 1.8)],
    ["i", circle(15, 18.5, 1.8)],
    ["s", "M20 3v2.6M22.4 6l-2 1.3M17.4 4.2l1 1.9"],
  ],
  /** Weather: the sun behind a cloud. */
  weather: [
    ["b", circle(9, 9, 3.6), "yellow"],
    ["s", "M9 2.6v1.3M3.9 4.1l.9.9M2.6 9h1.3M14.1 4.1l-.9.9", "yellow"],
    ["b", "M7.5 20h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A2.9 2.9 0 0 0 7.5 20z"],
  ],
  /** Farming: a sprout in the soil. */
  farming: [
    ["b", "M4.5 20.5a7.5 3.5 0 0 1 15 0z", "amber"],
    ["s", "M12 18v-7.5"],
    ["b", "M12 14c-3.8 0-6.2-2.3-6.6-5.8 3.8-.2 6.6 1.9 6.6 5.8z"],
    ["b", "M12 11.5c0-3.9 2.4-6.6 6.6-7 .1 4-2.5 7-6.6 7z"],
  ],
  /** Health: a medical cross. */
  health: [
    ["b", "M9.5 3.5h5a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4v-4a1 1 0 0 1 1-1z"],
    ["s", "M7.5 12h2.2l1.2-1.8 2 3.6 1.2-1.8h2.4"],
  ],
  /** Education: a graduation cap. */
  education: [
    ["b", "M6.5 11.2v4.3c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.3L12 13.8z"],
    ["b", "M12 4.5 2.5 9 12 13.5 21.5 9z"],
    ["s", "M21.5 9v5.5"],
    ["i", circle(21.5, 15.3, 1)],
  ],
  /** Something being built: a construction crane. */
  construction: [
    ["b", rect(6, 4, 3, 16.5, 0.6)],
    ["s", "M3.5 5.5h17M6 9l3 3M6 13l3 3"],
    ["s", "M17.5 5.5v6"],
    ["b", rect(15.5, 11.5, 4, 3.2, 0.6)],
    ["b", rect(9, 6.5, 3, 2.5, 0.4)],
    ["b", rect(3.5, 19, 8, 2, 0.6)],
  ],
  /** Business and trade: a shop with an awning. */
  business: [
    ["b", "M5 10.5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"],
    ["b", "M3.5 9.5 5 4.5h14l1.5 5a2.13 2.13 0 0 1-4.25 0a2.13 2.13 0 0 1-4.25 0a2.13 2.13 0 0 1-4.25 0a2.13 2.13 0 0 1-4.25 0z"],
    ["s", "M8.5 4.5 7.8 9.5M12 4.5v5M15.5 4.5l.7 5"],
    ["p", rect(10, 14, 4, 6.5, 0.6)],
  ],
  /** Civic life, the town and its offices: a town hall. */
  civic: [
    ["b", "M3.5 9 12 4l8.5 5z"],
    ["b", rect(4, 9, 16, 2, 0.5)],
    ["s", "M6.5 11v6.5M10.2 11v6.5M13.8 11v6.5M17.5 11v6.5"],
    ["b", rect(3.5, 17.5, 17, 3, 0.8)],
  ],
  /** Development: bars going up. */
  growth: [
    ["b", rect(4, 14, 4, 6.5, 1)],
    ["b", rect(10, 11, 4, 9.5, 1)],
    ["b", rect(16, 7.5, 4, 13, 1)],
    ["s", "M3.5 10.5 8.5 6l3 2.5 6-5.5M14.5 3h3v3", "green"],
  ],
  /** Courts: the scales of justice. */
  justice: [
    ["s", "M12 4.5V19.5M5 6.5h14"],
    ["s", "M5 6.5 2.8 12.5M5 6.5l2.2 6M19 6.5l-2.2 6M19 6.5l2.2 6"],
    ["b", "M2.5 12.5a2.5 2 0 0 0 5 0z"],
    ["b", "M16.5 12.5a2.5 2 0 0 0 5 0z"],
    ["b", rect(8, 19.5, 8, 2, 0.8)],
    ["i", circle(12, 3.8, 1)],
  ],
  /** Money and budgets: a rupee coin. */
  money: [
    ["b", circle(12, 12, 8.5)],
    ["s", "M9.3 8.3h5.6M9.3 10.8h5.6M10.2 8.3c2 0 3.2.9 3.2 2.3s-1.2 2.4-3.2 2.4h-.9l4.2 3.7"],
  ],
  /** Buses and trains: a bus from the side. */
  bus: [
    ["b", "M3 6.5a2 2 0 0 1 2-2h12.5A3.5 3.5 0 0 1 21 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"],
    ["p", rect(5, 7, 3.2, 3.5, 0.5)],
    ["p", rect(9.4, 7, 3.2, 3.5, 0.5)],
    ["p", rect(13.8, 7, 5, 3.5, 0.5)],
    ["s", "M3 13.5h18"],
    ["i", circle(7, 18, 1.8)],
    ["i", circle(16.5, 18, 1.8)],
  ],

  // ── Crime types ─────────────────────────────────────────────────────
  /** Theft, robbery, property crime: a money bag. */
  theft: [
    ["b", "M9 8.5 7.8 4.8a.8.8 0 0 1 .8-1h6.8a.8.8 0 0 1 .8 1L15 8.5z"],
    ["b", "M9 8.5h6l3 5.5c1.6 3.2-.5 6.5-4 6.5h-4c-3.5 0-5.6-3.3-4-6.5z"],
    ["s", "M8.5 8.5h7"],
    ["s", "M10.3 12.8h3.6M10.3 14.4h3.6M11 12.8c1.4 0 2.1.6 2.1 1.6s-.8 1.6-2.1 1.6h-.7l2.6 2.4"],
  ],
  /** Burglary: a house with a padlock. */
  burglary: [
    ["b", "M4 11 12 4.5l8 6.5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"],
    ["s", "M10.5 13.5v-1.3a1.5 1.5 0 0 1 3 0v1.3", "amber"],
    ["b", rect(9.3, 13.5, 5.4, 4.6, 1), "amber"],
    ["i", circle(12, 15.8, 0.7), "amber"],
  ],
  /** Hurt, assault, murder: a plaster. */
  assault: [
    ["b", "M10.94 18.72 18.72 10.94a4 4 0 0 0-5.66-5.66L5.28 13.06a4 4 0 0 0 5.66 5.66z"],
    ["p", "M12 8.8l3.2 3.2-3.2 3.2-3.2-3.2z"],
    ["i", circle(12, 12, 0.6)],
  ],
  /** Cyber crime and phone scams: a phone with a warning. */
  cyber: [
    ["b", rect(6.5, 2.5, 11, 19, 2.5)],
    ["s", "M10.8 5h2.4"],
    ["b", "M12 8.3l4 7H8z", "orange"],
    ["s", "M12 10.8v2", "orange"],
    ["i", circle(12, 14.1, 0.55), "orange"],
    ["s", "M10.5 18.5h3"],
  ],
  /** Cheating and fraud: a paper with a red cross. */
  fraud: [
    ["b", "M6.5 3h7.5l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z"],
    ["s", "M14 3v4h4M8 11h6M8 14h3.5"],
    ["b", circle(16.5, 17.5, 3.6), "rose"],
    ["s", "M15.2 16.2l2.6 2.6M17.8 16.2l-2.6 2.6", "rose"],
  ],
  /** Traffic: a traffic light. */
  traffic: [
    ["b", rect(8, 2.5, 8, 16.5, 2.8)],
    ["s", "M12 19v3"],
    ["a", circle(12, 6.5, 1.8), "rose"],
    ["a", circle(12, 10.8, 1.8), "yellow"],
    ["a", circle(12, 15.1, 1.8), "green"],
  ],
  /** Crimes against women, women's safety: a shield with the women's sign. */
  women: [
    ["b", SHIELD],
    ["p", circle(12, 9.8, 2.7)],
    ["s", "M12 12.5v4.8M9.9 15.2h4.2"],
  ],
  /** Children, kidnapping and missing people: a child. */
  child: [
    ["b", circle(12, 6, 2.8)],
    ["b", "M8.5 20.5v-6a3.5 3.5 0 0 1 7 0v6z"],
    ["s", "M8.5 14.8 5.5 12.5M15.5 14.8l3-2.3"],
  ],
  /** All crimes, police, safety: a shield with a tick. */
  shield: [
    ["b", SHIELD],
    ["s", "M8.8 12.2l2.2 2.2 4.3-4.4"],
  ],

  // ── Kinds of project ────────────────────────────────────────────────
  /** Roads and highways. */
  road: [
    ["b", "M8.5 3.5h7l5 17h-17z"],
    ["s", "M12 6v2M12 11v2.5M12 16.5v3"],
  ],
  /** Bridges and flyovers. */
  bridge: [
    ["s", "M4 13.5C6 7 18 7 20 13.5"],
    ["s", "M8 9.6v3.9M12 8.8v4.7M16 9.6v3.9M6 16.1v3.4M18 16.1v3.4"],
    ["b", rect(2, 13.5, 20, 2.6, 0.8)],
    ["s", "M2.5 21c1.5-.9 3-.9 4.5 0s3 .9 4.5 0 3-.9 4.5 0 3 .9 4.5 0", "cyan"],
  ],
  /** Metro: a metro train from the front. */
  metro: [
    ["b", rect(5.5, 3, 13, 14.5, 3.5)],
    ["p", rect(7.5, 5.5, 9, 5, 1.2)],
    ["i", circle(9, 13.7, 1.1)],
    ["i", circle(15, 13.7, 1.1)],
    ["s", "M8.5 17.5 6.5 21M15.5 17.5l2 3.5M5 21h14"],
  ],
  /** Railways: a train on its track. */
  rail: [
    ["b", "M3 6.5h13.5A4.5 4.5 0 0 1 21 11v5H3z"],
    ["p", rect(5, 8.5, 3, 3, 0.6)],
    ["p", rect(9.5, 8.5, 3, 3, 0.6)],
    ["p", rect(14, 8.5, 3, 3, 0.6)],
    ["i", circle(6.5, 17.5, 1.7)],
    ["i", circle(11.5, 17.5, 1.7)],
    ["i", circle(16.5, 17.5, 1.7)],
    ["s", "M2 20.5h20"],
  ],
  /** Airports: a plane from above. */
  airport: [
    ["b", "M12 2.5c.9 0 1.5 1 1.5 2.2v4.6l7 4.2v2.1l-7-2.2v4.6l2.2 1.6V21L12 20.1 8.3 21v-1.4l2.2-1.6v-4.6l-7 2.2v-2.1l7-4.2V4.7c0-1.2.6-2.2 1.5-2.2z"],
  ],
  /** Ports and harbours: an anchor. */
  port: [
    ["b", circle(12, 5.3, 2.1)],
    ["s", "M12 7.4v13.1M8.5 10.5h7"],
    ["s", "M4.5 13.5c.4 4.1 3.6 7 7.5 7s7.1-2.9 7.5-7M3 15.2l1.5-1.9 1.9 1.4M21 15.2l-1.5-1.9-1.9 1.4"],
  ],
  /** Water supply, dams, lakes: a drop of water. */
  water: [
    ["b", "M12 3c3.6 4.3 6.2 7.7 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 10.7 8.4 7.3 12 3z"],
    ["w", "M9.2 14.5a2.9 2.9 0 0 0 2.3 2.8"],
  ],
  /** Drains and sewage: a pipe letting water out. */
  sewage: [
    ["b", "M3 6h8.5a5.5 5.5 0 0 1 5.5 5.5V13h-4.5v-1.5a1 1 0 0 0-1-1H3z"],
    ["b", rect(11.8, 13, 5.9, 1.6, 0.5)],
    ["a", circle(14.7, 17.6, 1.1), "cyan"],
    ["a", circle(14.7, 20.8, 0.8), "cyan"],
  ],
  /** Power and energy: a lightning bolt. */
  power: [
    ["b", "M13.5 2.5 5.5 13.2h5.6L10 21.5l8.5-11h-5.8z"],
  ],
  /** Housing: a house. */
  housing: [
    ["b", "M4.5 10.5 12 4.3l7.5 6.2v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"],
    ["s", "M2.8 11.8 12 4.2l9.2 7.6"],
    ["p", rect(10, 14, 4, 6.5, 0.8)],
    ["p", rect(6.3, 12.3, 2.4, 2.4, 0.4)],
    ["p", rect(15.3, 12.3, 2.4, 2.4, 0.4)],
  ],
  /** City projects, public buildings, smart city: tall buildings. */
  city: [
    ["b", rect(3.5, 9, 7, 12, 1)],
    ["b", rect(12, 3.5, 8.5, 17.5, 1)],
    ["s", "M6 12h2M6 15h2M6 18h2M14.5 6.5h3.5M14.5 9.5h3.5M14.5 12.5h3.5M14.5 15.5h3.5"],
    ["s", "M2 21h20"],
  ],
  /** Hospitals: a building with a cross. */
  hospital: [
    ["b", rect(4, 6, 16, 15, 1.8)],
    ["a", "M10.6 8.5h2.8v2.6H16v2.8h-2.6v2.6h-2.8v-2.6H8v-2.8h2.6z"],
    ["p", rect(10.3, 17.5, 3.4, 3.5, 0.5)],
  ],
  /** Schools and colleges: a school with a flag. */
  school: [
    ["b", "M4 11 12 6.5l8 4.5v10H4z"],
    ["s", "M12 6.5v-4"],
    ["a", "M12 2.5h3.3l-.9 1.1.9 1.1H12z"],
    ["p", circle(12, 11.5, 1.6)],
    ["p", rect(10.2, 15.5, 3.6, 5.5, 0.6)],
    ["s", "M6.5 14.5h1.8M15.7 14.5h1.8"],
  ],
  /** Parks, lakes, heritage, sports: a tree. */
  parks: [
    ["b", "M12 3a4.8 4.8 0 0 1 4.6 6.2 3.9 3.9 0 0 1-1.1 7.3h-7a3.9 3.9 0 0 1-1.1-7.3A4.8 4.8 0 0 1 12 3z"],
    ["s", "M12 12v9M12 15.2l-2.2-1.8M12 14.2l2-1.5", "amber"],
    ["s", "M6.5 21h11"],
  ],
  /** Industry and factories. */
  industry: [
    ["b", "M3 20.5v-8.8l5 3v-3l5 3v-3l5 3V5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v15.5z"],
    ["p", rect(5.2, 16.5, 2, 2, 0.3)],
    ["p", rect(10.2, 16.5, 2, 2, 0.3)],
    ["p", rect(15.2, 16.5, 2, 2, 0.3)],
  ],
  /** Other building work: a hard hat. */
  hardhat: [
    ["b", "M4 16.5a8 8 0 0 1 16 0z"],
    ["b", rect(2.5, 16.5, 19, 3, 1.5)],
    ["s", "M10.5 8.7V13M13.5 8.7V13"],
  ],

  // ── India dashboard (national topics) ───────────────────────────────
  /** People, population, living standards: two people. */
  people: [
    ["b", circle(16.2, 7.6, 2.6)],
    ["b", "M11.8 18.5v-1.6a4.4 4.4 0 0 1 8.8 0v1.6z"],
    ["b", circle(9, 8.6, 3.1)],
    ["b", "M3 20.5v-1.8a6 6 0 0 1 12 0v1.8z"],
  ],
  /** India and the world, trade: a globe. */
  globe: [
    ["b", circle(12, 12, 8.8)],
    ["s", "M12 3.2c2.5 2.4 3.8 5.3 3.8 8.8s-1.3 6.4-3.8 8.8c-2.5-2.4-3.8-5.3-3.8-8.8s1.3-6.4 3.8-8.8z"],
    ["s", "M3.2 12h17.6M4.6 7.5h14.8M4.6 16.5h14.8"],
  ],
  /** Wildlife: a paw print. */
  paw: [
    ["b", "M12 11.8c-3.1 0-6 2.9-6 5.7 0 1.8 1.3 3 3 3 1 0 1.9-.5 3-.5s2 .5 3 .5c1.7 0 3-1.2 3-3 0-2.8-2.9-5.7-6-5.7z"],
    ["b", circle(4.9, 10.4, 1.9)],
    ["b", circle(8.9, 5.9, 2.1)],
    ["b", circle(15.1, 5.9, 2.1)],
    ["b", circle(19.1, 10.4, 1.9)],
  ],
  /** Space, startups, new ideas: a rocket. */
  rocket: [
    ["b", "M8 13.2 4.8 16.4v3.3l3.4-1.7z"],
    ["b", "M16 13.2l3.2 3.2v3.3l-3.4-1.7z"],
    ["a", "M10.2 18h3.6l-.5 2.4L12 22.2l-1.3-1.8z", "orange"],
    ["b", "M12 2.3c2.9 2.1 4.3 5.3 4.3 9.3V18H7.7v-6.4c0-4 1.4-7.2 4.3-9.3z"],
    ["p", circle(12, 9.6, 1.9)],
  ],
  /** Solar and renewable power: the sun. */
  sun: [
    ["s", "M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"],
    ["b", circle(12, 12, 4.6)],
    ["w", "M9.6 11.6a2.5 2.5 0 0 1 2.2-2.2"],
  ],
  /** Sport, awards, first place: a medal on a ribbon (a hue gives gold, silver or bronze). */
  medal: [
    ["b", "M7.2 2.8h3.6l2.4 6.4H9.6z", "blue"],
    ["b", "M16.8 2.8h-3.6l-2.4 6.4h3.6z", "blue"],
    ["b", circle(12, 15, 5.7)],
    ["a", "M12 11.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"],
  ],
  /** Books, the Constitution, sources: an open book. */
  book: [
    ["b", "M12 6.6C10 5.1 7.1 4.6 3 4.9v13.6c4.1-.3 7 .2 9 1.7z"],
    ["b", "M12 6.6c2-1.5 4.9-2 9-1.7v13.6c-4.1-.3-7 .2-9 1.7z"],
    ["s", "M5.6 8.6c1.6 0 3 .3 4 .8M5.6 11.6c1.6 0 3 .3 4 .8M14.4 9.4c1-.5 2.4-.8 4-.8M14.4 12.4c1-.5 2.4-.8 4-.8"],
  ],
  /** Maps, area, states and districts: a folded map with a pin. */
  map: [
    ["b", "M3 6.6 8.6 4.5l6.8 2.1L21 4.5v13l-5.6 2.1-6.8-2.1L3 19.6z"],
    ["s", "M8.6 4.5v13M15.4 6.6v13"],
    ["b", "M12 7.2a2.7 2.7 0 0 1 2.7 2.7c0 2-2.7 4.6-2.7 4.6s-2.7-2.6-2.7-4.6A2.7 2.7 0 0 1 12 7.2z", "rose"],
    ["p", circle(12, 9.9, 0.9), "rose"],
  ],
  /** Prisons, things kept locked: a padlock. */
  lock: [
    ["s", "M8 10.5V8a4 4 0 0 1 8 0v2.5"],
    ["b", rect(5, 10.5, 14, 10.5, 2.5)],
    ["i", circle(12, 14.9, 1.4)],
    ["s", "M12 15.8v2.4"],
  ],
  /** Science and research: a flask. */
  flask: [
    ["p", "M9.5 3.5v5.3L4.7 17.4A2.1 2.1 0 0 0 6.5 20.5h11a2.1 2.1 0 0 0 1.8-3.1L14.5 8.8V3.5z"],
    ["f", "M6.9 13.5h10.2l2.2 3.9a2.1 2.1 0 0 1-1.8 3.1h-11a2.1 2.1 0 0 1-1.8-3.1z"],
    ["s", "M9.5 3.5v5.3L4.7 17.4A2.1 2.1 0 0 0 6.5 20.5h11a2.1 2.1 0 0 0 1.8-3.1L14.5 8.8V3.5"],
    ["s", "M8.3 3.5h7.4"],
    ["a", circle(10.8, 16.8, 0.9)],
    ["a", circle(13.9, 18, 0.7)],
  ],
  /** Phones, digital services, telecom: a smartphone. */
  phone: [
    ["b", rect(6.5, 2.5, 11, 19, 2.5)],
    ["p", rect(8.3, 5.6, 7.4, 11.2, 1)],
    ["s", "M10.8 4.1h2.4"],
    ["i", circle(12, 19, 0.9)],
  ],
  /** Jobs and investment: a briefcase. */
  briefcase: [
    ["s", "M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5"],
    ["b", rect(3, 6.5, 18, 13.5, 2.2)],
    ["s", "M3 12.5h18"],
    ["p", rect(10.4, 11, 3.2, 3, 0.6)],
  ],
  /** Fisheries: a fish. */
  fish: [
    ["b", "M2.5 7.5 7.2 12l-4.7 4.5z"],
    ["b", "M6 12c2.4-3.4 5.6-5.5 9-5.5 3.3 0 5.9 2.4 6.5 5.5-.6 3.1-3.2 5.5-6.5 5.5-3.4 0-6.6-2.1-9-5.5z"],
    ["s", "M12.3 8.4c.8 1 1.2 2.3 1.2 3.6s-.4 2.6-1.2 3.6"],
    ["i", circle(17.2, 10.8, 0.9)],
  ],
  /** Livestock and dairy: a cow's face. */
  cow: [
    ["s", "M7.8 6.4C5.9 6 4.6 4.7 4.4 2.8M16.2 6.4c1.9-.4 3.2-1.7 3.4-3.6"],
    ["b", "M7.2 8.6 2.6 8.9c.3 2 1.9 3.2 4.3 3z"],
    ["b", "M16.8 8.6l4.6.3c-.3 2-1.9 3.2-4.3 3z"],
    ["b", "M7 13.8V9.2C7 6.9 9.2 5.2 12 5.2s5 1.7 5 4v4.6z"],
    ["p", rect(6.4, 12.6, 11.2, 8, 3.6)],
    ["i", circle(9.6, 9.8, 0.85)],
    ["i", circle(14.4, 9.8, 0.85)],
    ["i", circle(10, 16.6, 0.8)],
    ["i", circle(14, 16.6, 0.8)],
  ],
  /** Languages: a speech bubble. */
  speech: [
    ["b", "M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v7.5a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"],
    ["s", "M8 8h8M8 11.5h5"],
  ],
  /** Culture and the arts: a lotus. */
  lotus: [
    ["b", "M12 18.5c-1.6-3.9-4.4-6.4-8.5-7 .2 4.5 3.5 7 8.5 7z"],
    ["b", "M12 18.5c1.6-3.9 4.4-6.4 8.5-7-.2 4.5-3.5 7-8.5 7z"],
    ["b", "M12 4.5c2.1 1.9 3.2 4.4 3.2 7.2s-1.1 5.1-3.2 6.8c-2.1-1.7-3.2-4-3.2-6.8s1.1-5.3 3.2-7.2z"],
    ["s", "M4.5 21h15", "cyan"],
  ],
} as const satisfies Record<string, readonly GlyphPart[]>;

export type GlyphName = keyof typeof GLYPHS;

export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];

/** The parts of a glyph (unknown names fall back to the newspaper). */
export function glyphParts(name: GlyphName | string): readonly GlyphPart[] {
  return (GLYPHS as Record<string, readonly GlyphPart[]>)[name] ?? GLYPHS.general;
}

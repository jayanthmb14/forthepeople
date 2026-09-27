/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Pin layout for the India map (DrillDownMap) — pure, no React, no DOM
// ═══════════════════════════════════════════════════════════════════════
//
//  - project(): the map's own Mercator projection (the same numbers
//    DrillDownMap gives react-simple-maps), in map units (800 × 900 box).
//  - fanOut(): live-district pins that sit too close together (Bengaluru
//    Urban, Mandya, Mysuru; Mumbai and Pune) are spread on a small ring
//    around their middle, each keeping its compass direction as far as
//    possible (so Chennai stays east, Mysuru south), and tied to its real
//    place by a thin line in the map.
//  - placeLabels(): a small name beside each pin — right, left, above or
//    below, whichever first fits without covering another pin or name, or
//    no name at all when nothing fits (then it appears when you zoom in).
//  tests/map-pins.test.ts.

export const MAP_W = 800;
export const MAP_H = 900;
export const MAP_CENTER: [number, number] = [82.75, 22.7];
export const MAP_SCALE = 1350;
/** Map units per degree of longitude. */
export const UNITS_PER_DEG = (MAP_SCALE * Math.PI) / 180;

const rad = (d: number) => (d * Math.PI) / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));

/** [lng, lat] → [x, y] in map units (d3 geoMercator, center MAP_CENTER, scale MAP_SCALE). */
export function project(lng: number, lat: number): [number, number] {
  return [MAP_W / 2 + MAP_SCALE * rad(lng - MAP_CENTER[0]), MAP_H / 2 - MAP_SCALE * (mercY(lat) - mercY(MAP_CENTER[1]))];
}

export interface Placed {
  pinLat: number;
  pinLng: number;
  /** True when the pin was moved off its real place (a crowded group). */
  moved: boolean;
}

/**
 * Spread crowded pins. Two pins are "crowded" when closer than `crowdDeg`
 * degrees (groups grow greedily); each group goes on a ring of `ringDeg`
 * around its middle, in the pins' own compass order, rotated to stay as
 * close as possible to where each pin really is.
 */
export function fanOut<T extends { lat: number; lng: number }>(pins: readonly T[], crowdDeg: number, ringDeg: number): Array<T & Placed> {
  const out = pins.map((p) => ({ ...p, pinLat: p.lat, pinLng: p.lng, moved: false }));
  const seen = new Set<number>();
  for (let i = 0; i < out.length; i++) {
    if (seen.has(i)) continue;
    const group = [i];
    for (let grew = true; grew; ) {
      grew = false;
      for (let j = 0; j < out.length; j++) {
        if (seen.has(j) || group.includes(j)) continue;
        if (group.some((g) => Math.hypot(out[g].lat - out[j].lat, out[g].lng - out[j].lng) < crowdDeg)) {
          group.push(j);
          grew = true;
        }
      }
    }
    group.forEach((g) => seen.add(g));
    if (group.length < 2) continue;
    const cLat = group.reduce((s, g) => s + out[g].lat, 0) / group.length;
    const cLng = group.reduce((s, g) => s + out[g].lng, 0) / group.length;
    const n = group.length;
    const step = (2 * Math.PI) / n;
    const sorted = group
      .map((g) => ({ g, a: Math.atan2(out[g].lat - cLat, out[g].lng - cLng) }))
      .sort((x, y) => x.a - y.a || x.g - y.g);
    // The rotation that keeps each pin nearest its own direction: the
    // circular mean of (own angle − its slot).
    let sx = 0;
    let sy = 0;
    sorted.forEach((s, k) => {
      sx += Math.cos(s.a - k * step);
      sy += Math.sin(s.a - k * step);
    });
    const base = sx === 0 && sy === 0 ? -Math.PI / 2 : Math.atan2(sy, sx);
    sorted.forEach((s, k) => {
      const a = base + k * step;
      out[s.g].pinLat = cLat + ringDeg * Math.sin(a);
      out[s.g].pinLng = cLng + ringDeg * Math.cos(a);
      out[s.g].moved = true;
    });
  }
  return out;
}

export type LabelSide = "right" | "left" | "top" | "bottom";

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Rough width of a label in px (bold sans; Indic scripts count their marks, which errs wide). */
export function labelWidth(name: string, font: number): number {
  return Math.ceil([...name].length * font * 0.6);
}

/**
 * Choose a side for each pin's name. Positions are screen pixels. A side is
 * taken when its box does not cover any pin (a square of `dot` around it),
 * a name placed before or an `avoid` area, and (when `bounds` is given)
 * stays inside it.
 * Pins with more neighbours are placed first. null = no room.
 */
export function placeLabels(
  items: ReadonlyArray<{ key: string; x: number; y: number; name: string }>,
  opts: {
    font: number;
    dot: number;
    gap: number;
    bounds?: { w: number; h: number };
    /** Screen areas no name may cover (the zoom buttons). */
    avoid?: ReadonlyArray<{ x0: number; y0: number; x1: number; y1: number }>;
  },
): Record<string, LabelSide | null> {
  const { font, dot, gap, bounds, avoid = [] } = opts;
  const h = Math.round(font * 1.3);
  const pinBoxes = items.map((p) => ({ key: p.key, box: { x0: p.x - dot, y0: p.y - dot, x1: p.x + dot, y1: p.y + dot } }));
  const near = (p: { x: number; y: number }) => items.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < 120).length;
  const order = [...items].sort((a, b) => near(b) - near(a) || a.x - b.x);
  const placed: Box[] = [];
  const out: Record<string, LabelSide | null> = {};
  for (const p of order) {
    const w = labelWidth(p.name, font);
    const boxes: Record<LabelSide, Box> = {
      right: { x0: p.x + gap, y0: p.y - h / 2, x1: p.x + gap + w, y1: p.y + h / 2 },
      left: { x0: p.x - gap - w, y0: p.y - h / 2, x1: p.x - gap, y1: p.y + h / 2 },
      top: { x0: p.x - w / 2, y0: p.y - gap - h, x1: p.x + w / 2, y1: p.y - gap },
      bottom: { x0: p.x - w / 2, y0: p.y + gap, x1: p.x + w / 2, y1: p.y + gap + h },
    };
    const side =
      (["right", "left", "top", "bottom"] as const).find((s) => {
        const b = boxes[s];
        if (bounds && (b.x0 < 2 || b.y0 < 2 || b.x1 > bounds.w - 2 || b.y1 > bounds.h - 2)) return false;
        if (pinBoxes.some((q) => q.key !== p.key && overlaps(b, q.box))) return false;
        if (avoid.some((a) => overlaps(b, a))) return false;
        return !placed.some((q) => overlaps(b, q));
      }) ?? null;
    out[p.key] = side;
    if (side) placed.push(boxes[side]);
  }
  return out;
}

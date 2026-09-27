/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The India map's pins (src/components/map/pin-layout.ts): the projection,
 * spreading crowded pins in their own compass order, and placing each
 * district's name where it fits.
 */
import { describe, expect, it } from "vitest";
import { MAP_CENTER, fanOut, labelWidth, placeLabels, project } from "@/components/map/pin-layout";

const KARNATAKA_AND_CHENNAI = [
  { key: "karnataka/mandya", lat: 12.524, lng: 76.897 },
  { key: "karnataka/bengaluru-urban", lat: 12.972, lng: 77.595 },
  { key: "karnataka/mysuru", lat: 12.296, lng: 76.639 },
  { key: "tamil-nadu/chennai", lat: 13.083, lng: 80.271 },
];

describe("project", () => {
  it("puts the map centre in the middle of the 800 × 900 box, north up, east right", () => {
    const [x, y] = project(MAP_CENTER[0], MAP_CENTER[1]);
    expect(x).toBeCloseTo(400, 6);
    expect(y).toBeCloseTo(450, 6);
    const [dx, dy] = project(77.209, 28.614); // New Delhi: north-west of the centre
    expect(dx).toBeLessThan(400);
    expect(dy).toBeLessThan(450);
  });
});

describe("fanOut", () => {
  it("spreads a crowded group on a ring, each pin keeping its direction", () => {
    const out = fanOut(KARNATAKA_AND_CHENNAI, 2.9, 2.4);
    const cLat = KARNATAKA_AND_CHENNAI.reduce((s, p) => s + p.lat, 0) / 4;
    const cLng = KARNATAKA_AND_CHENNAI.reduce((s, p) => s + p.lng, 0) / 4;
    for (const p of out) {
      expect(p.moved).toBe(true);
      expect(Math.hypot(p.pinLat - cLat, p.pinLng - cLng)).toBeCloseTo(2.4, 6);
      // the real place is kept for the leader line
      expect(KARNATAKA_AND_CHENNAI.find((q) => q.key === p.key)).toMatchObject({ lat: p.lat, lng: p.lng });
    }
    const at = (k: string) => out.find((p) => p.key === k)!;
    expect(at("tamil-nadu/chennai").pinLng).toBeGreaterThan(cLng + 2); // stays east
    expect(at("karnataka/mysuru").pinLat).toBeLessThan(cLat - 1); // goes south
    expect(at("karnataka/bengaluru-urban").pinLat).toBeGreaterThan(cLat + 1); // goes north
  });

  it("leaves pins that are far apart where they are", () => {
    const out = fanOut(
      [
        { key: "delhi", lat: 28.614, lng: 77.209 },
        { key: "lucknow", lat: 26.847, lng: 80.946 },
      ],
      1.6,
      1.9,
    );
    expect(out.map((p) => [p.moved, p.pinLat, p.pinLng])).toEqual([
      [false, 28.614, 77.209],
      [false, 26.847, 80.946],
    ]);
  });
});

describe("placeLabels", () => {
  const opts = { font: 11.5, dot: 11, gap: 11 };

  it("puts a name on the right, or on the left when the right is taken", () => {
    const sides = placeLabels(
      [
        { key: "a", x: 100, y: 100, name: "New Delhi" },
        { key: "b", x: 160, y: 108, name: "Lucknow" },
      ],
      opts,
    );
    expect(sides).toEqual({ a: "left", b: "right" });
  });

  it("keeps names inside the map and off the zoom buttons; no room → no name", () => {
    const one = [{ key: "a", x: 20, y: 60, name: "Mumbai" }];
    expect(placeLabels(one, { ...opts, bounds: { w: 300, h: 300 } }).a).toBe("right");
    expect(placeLabels(one, { ...opts, bounds: { w: 300, h: 300 }, avoid: [{ x0: 0, y0: 0, x1: 120, y1: 140 }] }).a).toBeNull();
  });

  it("estimates a name's width from its length", () => {
    expect(labelWidth("Mandya", 10)).toBe(36);
  });
});

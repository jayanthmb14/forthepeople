/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Fit a GeoJSON collection into a fixed map frame (Mercator), so every state
// fills its card the same way — a small state is not a speck, a tall one is
// not cut off. Replaces the old step-table (span < 3 → scale 4000 …).

type Coords = number[] | Coords[];
export interface GeoFeature {
  geometry: { type?: string; coordinates: Coords } | null;
  properties?: Record<string, unknown> | null;
}

const RAD = Math.PI / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));
const invMercY = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RAD;

function eachPoint(c: Coords, fn: (lng: number, lat: number) => void): void {
  if (typeof c[0] === "number") fn(c[0] as number, c[1] as number);
  else for (const sub of c as Coords[]) eachPoint(sub, fn);
}

function bbox(features: GeoFeature[]): [number, number, number, number] {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const f of features) {
    if (!f.geometry) continue;
    eachPoint(f.geometry.coordinates, (lng, lat) => {
      if (lng < x0) x0 = lng;
      if (lng > x1) x1 = lng;
      if (lat < y0) y0 = lat;
      if (lat > y1) y1 = lat;
    });
  }
  return [x0, y0, x1, y1];
}

/** d3 Mercator `center` + `scale` that fit all features inside width × height, minus `pad`. */
export function fitMercator(
  geo: { features: GeoFeature[] },
  width: number,
  height: number,
  pad = 16,
): { center: [number, number]; scale: number } {
  const [x0, y0, x1, y1] = bbox(geo.features);
  if (x0 > x1) return { center: [78, 22], scale: 1000 };
  const dx = Math.max((x1 - x0) * RAD, 1e-6);
  const dy = Math.max(mercY(y1) - mercY(y0), 1e-6);
  const scale = Math.min((width - 2 * pad) / dx, (height - 2 * pad) / dy);
  return { center: [(x0 + x1) / 2, invMercY((mercY(y0) + mercY(y1)) / 2)], scale };
}

/** A point to pin a feature on: the centre of its largest polygon's bounding box. */
export function pinPoint(f: GeoFeature): [number, number] | null {
  const g = f.geometry;
  if (!g) return null;
  const polys = (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []) as Coords[];
  let best: [number, number] | null = null;
  let bestArea = -1;
  for (const p of polys) {
    const [x0, y0, x1, y1] = bbox([{ geometry: { type: "Polygon", coordinates: p } }]);
    const area = (x1 - x0) * (y1 - y0);
    if (area > bestArea) {
      bestArea = area;
      best = [(x0 + x1) / 2, (y0 + y1) / 2];
    }
  }
  return best;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { INDIA_STATE_NAME_TO_SLUG } from "./aliases";

// ═══════════════════════════════════════════════════════════════════════
//  locate.ts — pure geometry helpers for "Your district" (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Everything in this file is a plain function with no React, no fetch and
//  no browser APIs, so it can be unit-tested with node and reused on the
//  server if ever needed. Coordinates follow the GeoJSON convention:
//  [longitude, latitude]. Function arguments take (lng, lat) in that order.
//

/** A GeoJSON position: [longitude, latitude]. */
export type Position = [number, number];

export interface PolygonGeometry {
  type: "Polygon";
  /** First ring is the outer boundary; later rings are holes. */
  coordinates: Position[][];
}

export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Position[][][];
}

export type Geometry = PolygonGeometry | MultiPolygonGeometry;

export interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown> | null;
  geometry: Geometry | null;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

/**
 * Ray-casting test: is the point inside this ring?
 * Standard even–odd algorithm; points exactly on an edge may go either way,
 * which is fine for "which state am I in".
 */
function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Is the point inside one Polygon's outer ring and outside its holes? */
function pointInSinglePolygon(lng: number, lat: number, rings: Position[][]): boolean {
  if (!rings.length || !pointInRing(lng, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) {
    if (pointInRing(lng, lat, rings[h])) return false;
  }
  return true;
}

/**
 * pointInPolygon(lng, lat, geometry) — true when the point lies inside a
 * Polygon or any part of a MultiPolygon.
 */
export function pointInPolygon(lng: number, lat: number, geometry: Geometry | null | undefined): boolean {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return pointInSinglePolygon(lng, lat, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((poly) => pointInSinglePolygon(lng, lat, poly));
  return false;
}

/** Read the display name off a state feature (public/geo/india-states.json uses `name`). */
export function featureName(feature: GeoFeature): string | null {
  const p = feature.properties ?? {};
  const n = p.name ?? p.NAME_1 ?? p.ST_NM ?? p.st_nm;
  return typeof n === "string" ? n : null;
}

/**
 * findStateForPoint(lng, lat, geojson) — name of the first state feature
 * that contains the point, or null when the point is outside every feature
 * (i.e. not in India, or in the sea).
 */
export function findStateForPoint(lng: number, lat: number, geojson: GeoFeatureCollection): string | null {
  for (const f of geojson.features) {
    if (pointInPolygon(lng, lat, f.geometry)) return featureName(f);
  }
  return null;
}

/**
 * State name (as written in the GeoJSON files) → registry slug used in
 * src/lib/constants/districts.ts. One shared table for every map and for
 * location lookup: src/lib/geo/aliases.ts.
 */
export const STATE_NAME_TO_SLUG: Record<string, string> = INDIA_STATE_NAME_TO_SLUG;

/** Registry slug for a GeoJSON state name, or null when unknown. */
export function stateSlugFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  return STATE_NAME_TO_SLUG[name] ?? STATE_NAME_TO_SLUG[name.trim()] ?? null;
}

/** A point on the earth, in degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371.0088;

/**
 * haversineKm(a, b) — great-circle distance between two points in km.
 * Accurate to well under 1 % for the distances we care about.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A district we can measure distance to. Built by district-centroids.ts. */
export interface DistrictCandidate {
  slug: string;
  stateSlug: string;
  name: string;
  lat: number;
  lng: number;
  /** True when the district is live on the site. */
  active: boolean;
}

export interface NearestResult {
  candidate: DistrictCandidate;
  distanceKm: number;
}

/**
 * nearestDistrict(lng, lat, candidates, options?) — the closest candidate
 * by great-circle distance. Pass `{ activeOnly: true }` to find the nearest
 * LIVE district, or `{ stateSlug }` to restrict to one state.
 * Returns null when no candidate matches.
 */
export function nearestDistrict(
  lng: number,
  lat: number,
  candidates: DistrictCandidate[],
  options: { activeOnly?: boolean; stateSlug?: string } = {},
): NearestResult | null {
  const here = { lat, lng };
  let best: NearestResult | null = null;
  for (const c of candidates) {
    if (options.activeOnly && !c.active) continue;
    if (options.stateSlug && c.stateSlug !== options.stateSlug) continue;
    const d = haversineKm(here, c);
    if (!best || d < best.distanceKm) best = { candidate: c, distanceKm: d };
  }
  return best;
}

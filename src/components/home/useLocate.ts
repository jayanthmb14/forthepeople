/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  useLocate — "Use my location" → the district the visitor is in
// ═══════════════════════════════════════════════════════════════════════
//
//  Shared by the home hero and the header's district finder.
//
//    const loc = useLocate();
//    <button onClick={loc.locate} disabled={loc.busy}>Use my location</button>
//    {loc.status.kind !== "idle" && <LocateResult status={loc.status} … />}
//
//  Steps, all inside the browser:
//    1. Ask navigator.permissions what the site may do. "denied" → we do
//       not call the Geolocation API at all; the result card explains how
//       to switch location on for this site. "prompt" → the browser asks.
//       "granted" → we just locate. (Browsers without the Permissions API
//       go straight to step 2.)
//    2. navigator.geolocation gives a lat/lng.
//    3. public/geo/india-states.json finds the state; the state's district
//       shapes (public/geo/<state>-districts.json) find the district. If a
//       state has no shape file, the nearest district HQ is used
//       (src/lib/geo/district-centroids.ts); failing that, the state only.
//
//  Coordinates never leave the browser: no request carries them and
//  nothing is stored.
//
//  Needs `Permissions-Policy: geolocation=(self)` (next.config.ts,
//  vercel.json). With geolocation=() the API is blocked for the whole page.
//
"use client";

import { useCallback, useState } from "react";
import { INDIA_STATES, getState } from "@/lib/constants/districts";
import { findStateForPoint, nearestDistrict, pointInPolygon, stateSlugFromName } from "@/lib/geo/locate";
import type { DistrictCandidate, GeoFeatureCollection } from "@/lib/geo/locate";
import { buildCandidates } from "@/lib/geo/district-centroids";
import { geoToRegistrySlug, stateGeoUrl } from "@/lib/geo/aliases";

/** A place the visitor was found in. */
export interface LocatedDistrict {
  slug: string;
  stateSlug: string;
  name: string;
  stateName: string;
  active: boolean;
}

/** Message keys in the "locate" namespace. */
export type LocateErrorKey = "errMap" | "errNoState" | "errUnsupported" | "errTimeout" | "errUnknown";

export type LocateStatus =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "found-live"; district: LocatedDistrict }
  | {
      kind: "found-coming";
      /** Null when only the state is known. */
      district: LocatedDistrict | null;
      stateName: string;
      stateSlug: string;
      nearestLive: { slug: string; stateSlug: string; name: string; km: number } | null;
    }
  | { kind: "denied" }
  | { kind: "error"; message: LocateErrorKey };

// ── Geo data, fetched on first use and cached for the page's life ──

let statesPromise: Promise<GeoFeatureCollection> | null = null;
function loadStates(): Promise<GeoFeatureCollection> {
  if (!statesPromise) {
    statesPromise = fetch("/geo/india-states.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoFeatureCollection>;
      })
      .catch((e) => {
        statesPromise = null; // allow a retry
        throw e;
      });
  }
  return statesPromise;
}

const districtShapes = new Map<string, Promise<GeoFeatureCollection | null>>();
function loadDistrictShapes(stateSlug: string): Promise<GeoFeatureCollection | null> {
  let p = districtShapes.get(stateSlug);
  if (!p) {
    p = fetch(stateGeoUrl(stateSlug))
      .then((r) => (r.ok ? (r.json() as Promise<GeoFeatureCollection>) : null))
      .catch(() => null);
    districtShapes.set(stateSlug, p);
  }
  return p;
}

/** The registry district whose boundary holds the point, or null. */
async function districtByBoundary(stateSlug: string, lng: number, lat: number): Promise<string | null> {
  const shapes = await loadDistrictShapes(stateSlug);
  if (!shapes) return null;
  for (const f of shapes.features) {
    if (!pointInPolygon(lng, lat, f.geometry)) continue;
    const raw = (f.properties as Record<string, unknown> | null)?.slug;
    const slug = typeof raw === "string" ? geoToRegistrySlug(stateSlug, raw) : null;
    if (slug && getState(stateSlug)?.districts.some((d) => d.slug === slug)) return slug;
  }
  return null;
}

let candidatesCache: DistrictCandidate[] | null = null;
function candidates(): DistrictCandidate[] {
  if (!candidatesCache) candidatesCache = buildCandidates(INDIA_STATES);
  return candidatesCache;
}

/** Position → status. Never throws. */
export async function resolvePosition(lat: number, lng: number): Promise<LocateStatus> {
  let geo: GeoFeatureCollection;
  try {
    geo = await loadStates();
  } catch {
    return { kind: "error", message: "errMap" };
  }

  const stateName = findStateForPoint(lng, lat, geo);
  const stateSlug = stateSlugFromName(stateName);
  const state = stateSlug ? getState(stateSlug) : undefined;
  if (!stateName || !stateSlug || !state) return { kind: "error", message: "errNoState" };

  const all = candidates();
  const exactSlug = await districtByBoundary(stateSlug, lng, lat);
  const exact = exactSlug ? state.districts.find((d) => d.slug === exactSlug) : undefined;
  const near = exact ? null : nearestDistrict(lng, lat, all, { stateSlug });
  const live = nearestDistrict(lng, lat, all, { activeOnly: true });
  const nearestLive = live
    ? { slug: live.candidate.slug, stateSlug: live.candidate.stateSlug, name: live.candidate.name, km: Math.round(live.distanceKm) }
    : null;

  if (exact || near) {
    const d: LocatedDistrict = exact
      ? { slug: exact.slug, stateSlug, name: exact.name, stateName: state.name, active: exact.active }
      : { slug: near!.candidate.slug, stateSlug, name: near!.candidate.name, stateName: state.name, active: near!.candidate.active };
    if (d.active) return { kind: "found-live", district: d };
    return { kind: "found-coming", district: d, stateName: state.name, stateSlug, nearestLive };
  }
  return { kind: "found-coming", district: null, stateName: state.name, stateSlug, nearestLive };
}

/** "granted" | "prompt" | "denied", or null when the browser cannot say. */
async function permissionState(): Promise<PermissionState | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return null;
    const p = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return p.state;
  } catch {
    return null; // Safari < 16 and some webviews throw for "geolocation"
  }
}

export interface UseLocate {
  status: LocateStatus;
  /** True while asking the browser or matching the map. */
  busy: boolean;
  locate: () => void;
  /** Back to idle (closes the result card). */
  reset: () => void;
}

export function useLocate(): UseLocate {
  const [status, setStatus] = useState<LocateStatus>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "error", message: "errUnsupported" });
      return;
    }
    setBusy(true);
    setStatus({ kind: "locating" });
    void (async () => {
      if ((await permissionState()) === "denied") {
        setBusy(false);
        setStatus({ kind: "denied" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const next = await resolvePosition(pos.coords.latitude, pos.coords.longitude);
          setBusy(false);
          setStatus(next);
        },
        (err) => {
          setBusy(false);
          if (err.code === err.PERMISSION_DENIED) setStatus({ kind: "denied" });
          else if (err.code === err.TIMEOUT) setStatus({ kind: "error", message: "errTimeout" });
          else setStatus({ kind: "error", message: "errUnknown" });
        },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 5 * 60_000 },
      );
    })();
  }, []);

  const reset = useCallback(() => {
    setBusy(false);
    setStatus({ kind: "idle" });
  }, []);

  return { status, busy, locate, reset };
}

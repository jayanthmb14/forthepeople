/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  YourDistrictStrip — "Find my district" row for the home page (§5)
// ═══════════════════════════════════════════════════════════════════════
//
//  One 56 px row between the ticker and the hero:
//
//    [ Find my district ]   You are in Mandya, Karnataka  [Open Mandya →]   Remember my district (o )
//
//  How it works, entirely inside the browser:
//    1. navigator.geolocation gives a lat/lng.
//    2. public/geo/india-states.json is fetched on first use and the point
//       is tested against each state polygon (src/lib/geo/locate.ts).
//    3. The nearest district HQ in that state is picked from
//       src/lib/geo/district-centroids.ts. If the state has no centroids yet
//       we stop at the state level.
//    4. Live district → "Open <district>". Not live → "Vote for <district>"
//       plus the nearest live district and its distance.
//    5. With "Remember my district" on, the result is saved to
//       localStorage (ftp.myDistrict) so the header can show a pill.
//
//  Coordinates never leave the browser. No request carries them; only a
//  district slug and name are ever stored, and only if the visitor asks.
//
//  States: idle · locating · found-live · found-coming · denied · error
//
//  Mounted on the home page through YourDistrictBand.tsx, which supplies
//  the vote counts and the "C+ 54 · 31°C" extras from the shared home
//  fetches (home-data.ts). On phones every control is 44 px tall
//  (home.module.css → .strip).
//
"use client";

import { useState } from "react";
import { ArrowRight, LocateFixed, MapPin } from "lucide-react";
import { Pill, ToolbarButton } from "@/components/district/ui";
import { INDIA_STATES, getState } from "@/lib/constants/districts";
import { findStateForPoint, nearestDistrict, stateSlugFromName } from "@/lib/geo/locate";
import type { DistrictCandidate, GeoFeatureCollection, NearestResult } from "@/lib/geo/locate";
import { buildCandidates } from "@/lib/geo/district-centroids";
import { useMyDistrict } from "@/hooks/useMyDistrict";
import type { MyDistrict } from "@/hooks/useMyDistrict";
import styles from "./home.module.css";

export { useMyDistrict } from "@/hooks/useMyDistrict";

const GEO_URL = "/geo/india-states.json";
const PRIVACY_NOTE =
  "Your coordinates never leave your browser. The state map is downloaded to your device and matched there. Only the district name is remembered, and only if you switch that on.";

/** Lazy, once-per-page load of the state polygons. */
let geoPromise: Promise<GeoFeatureCollection> | null = null;
function loadStates(): Promise<GeoFeatureCollection> {
  if (!geoPromise) {
    geoPromise = fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GeoFeatureCollection>;
      })
      .catch((e) => {
        geoPromise = null; // allow a retry next time
        throw e;
      });
  }
  return geoPromise;
}

/** Candidates are static registry data; build them once. */
let candidatesCache: DistrictCandidate[] | null = null;
function candidates(): DistrictCandidate[] {
  if (!candidatesCache) candidatesCache = buildCandidates(INDIA_STATES);
  return candidatesCache;
}

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "found-live"; district: MyDistrict }
  | {
      kind: "found-coming";
      /** null when we only know the state. */
      district: MyDistrict | null;
      stateName: string;
      stateSlug: string;
      nearestLive: NearestResult | null;
    }
  | { kind: "denied" }
  | { kind: "error"; message: string };

export interface YourDistrictStripProps {
  locale: string;
  /** "strip" (full-width row) or "hero" (the card inside the home hero, v4). */
  variant?: "strip" | "hero";
  /**
   * Optional vote counts keyed by district slug, e.g. { kanpur: 47531 }.
   * When present, the coming-soon copy adds "N people have asked for it."
   */
  votes?: Record<string, number>;
  /**
   * Optional extra facts for a live district (e.g. "C+ 54 · Paddy ₹19/kg ·
   * 38°C"). Rendered after the location line. Supplied by the page so this
   * component stays free of data fetching.
   */
  extras?: (district: MyDistrict) => React.ReactNode;
}

/**
 * Resolve a position to a district. Pure apart from the GeoJSON fetch, so
 * it is easy to reason about: returns the next Status, never throws.
 */
async function resolvePosition(lat: number, lng: number): Promise<Status> {
  let geo: GeoFeatureCollection;
  try {
    geo = await loadStates();
  } catch {
    return { kind: "error", message: "The state map could not be loaded. Please try again." };
  }

  const stateName = findStateForPoint(lng, lat, geo);
  const stateSlug = stateSlugFromName(stateName);
  const state = stateSlug ? getState(stateSlug) : undefined;
  if (!stateName || !stateSlug || !state) {
    return { kind: "error", message: "We could not match your location to an Indian state. Choose your district from the list or the map." };
  }

  const all = candidates();
  const inState = nearestDistrict(lng, lat, all, { stateSlug });
  const nearestLive = nearestDistrict(lng, lat, all, { activeOnly: true });
  const savedAt = new Date().toISOString();

  if (inState) {
    const d: MyDistrict = {
      slug: inState.candidate.slug,
      stateSlug,
      name: inState.candidate.name,
      stateName: state.name,
      active: inState.candidate.active,
      savedAt,
    };
    if (d.active) return { kind: "found-live", district: d };
    return { kind: "found-coming", district: d, stateName: state.name, stateSlug, nearestLive };
  }

  // State-level fallback: no centroids for this state yet.
  return { kind: "found-coming", district: null, stateName: state.name, stateSlug, nearestLive };
}

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

export default function YourDistrictStrip({ locale, votes, extras, variant = "strip" }: YourDistrictStripProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const my = useMyDistrict();

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "error", message: "Your browser does not support location. Choose your district from the list or the map." });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = await resolvePosition(pos.coords.latitude, pos.coords.longitude);
        setStatus(next);
        if (next.kind === "found-live") my.save(next.district);
        else if (next.kind === "found-coming" && next.district) my.save(next.district);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus({ kind: "denied" });
        else if (err.code === err.TIMEOUT) setStatus({ kind: "error", message: "Finding your location took too long. Please try again." });
        else setStatus({ kind: "error", message: "Your location could not be determined right now. Choose your district from the list or the map." });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  const textStyle: React.CSSProperties = { fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" };
  const mutedStyle: React.CSSProperties = { fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" };

  function renderStatus() {
    switch (status.kind) {
      case "idle":
        return (
          <span style={mutedStyle}>
            Tap to find the district you are in. Your coordinates never leave your browser.
          </span>
        );
      case "locating":
        return (
          <span style={mutedStyle} aria-live="polite">
            Finding your district…
          </span>
        );
      case "found-live": {
        const d = status.district;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} aria-live="polite">
            <span style={textStyle}>
              You are in <strong style={{ fontWeight: 500 }}>{d.name}</strong>, {d.stateName}
            </span>
            {extras && <span style={mutedStyle}>{extras(d)}</span>}
            <ToolbarButton href={`/${locale}/${d.stateSlug}/${d.slug}`} icon={ArrowRight}>
              Open {d.name}
            </ToolbarButton>
          </span>
        );
      }
      case "found-coming": {
        const d = status.district;
        const count = d && votes ? votes[d.slug] : undefined;
        const live = status.nearestLive;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} aria-live="polite">
            <span style={textStyle}>
              {d ? (
                <>
                  You are in <strong style={{ fontWeight: 500 }}>{d.name}</strong>, {d.stateName}. {d.name} is not live yet.
                  {count !== undefined && <> {formatCount(count)} people have asked for it.</>}
                </>
              ) : (
                <>
                  You are in <strong style={{ fontWeight: 500 }}>{status.stateName}</strong>. No district there is live yet.
                </>
              )}
            </span>
            {d && (
              <ToolbarButton href={`/${locale}/vote-district?d=${d.slug}`} icon={ArrowRight}>
                Vote for {d.name}
              </ToolbarButton>
            )}
            {live && (
              <a
                href={`/${locale}/${live.candidate.stateSlug}/${live.candidate.slug}`}
                style={{ ...mutedStyle, color: "var(--ftp-brand)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Nearest live district: {live.candidate.name}, <span className="ftp-num">{Math.round(live.distanceKm)}</span> km
              </a>
            )}
          </span>
        );
      }
      case "denied":
        return (
          <span style={mutedStyle} role="status">
            Location is off. Choose your district from the list or the map.
          </span>
        );
      case "error":
        return (
          <span style={mutedStyle} role="status">
            {status.message}
          </span>
        );
    }
  }

  const remember = (
    <label title={PRIVACY_NOTE} className={styles.stripRemember} style={mutedStyle}>
      <span>Remember my district</span>
      <button
        type="button"
        role="switch"
        aria-checked={my.remember}
        aria-label="Remember my district"
        onClick={() => my.setRemember(!my.remember)}
        style={{
          position: "relative",
          width: 36,
          height: 20,
          borderRadius: "var(--ftp-radius-pill)",
          border: "1px solid var(--ftp-border-strong)",
          background: my.remember ? "var(--ftp-brand)" : "var(--ftp-surface-2)",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 2,
            left: my.remember ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border-strong)",
            transition: "left 180ms var(--ftp-ease-out)",
          }}
        />
      </button>
    </label>
  );

  if (variant === "hero") {
    // v4 hero card: one big location button, the status line under it,
    // and the remember switch. Same logic as the strip.
    return (
      <section aria-label="Your district" className={styles.heroLocate}>
        <button
          type="button"
          onClick={locate}
          disabled={status.kind === "locating"}
          className={styles.heroLocateBtn}
        >
          <span className="ftp-emoji" aria-hidden style={{ fontSize: 20 }}>📍</span>
          {status.kind === "locating" ? "Finding you…" : "Go to my location"}
        </button>
        <div className={styles.heroLocateStatus} aria-live="polite">
          {my.district && status.kind === "idle" && (
            <Pill tone="brand" icon={MapPin} title={PRIVACY_NOTE}>
              My district: {my.district.name}
            </Pill>
          )}
          {renderStatus()}
        </div>
        {remember}
      </section>
    );
  }

  return (
    <section aria-label="Your district" className={styles.strip}>
      <div className={`ftp-container ${styles.stripRow}`}>
        {/* Left: the one button */}
        <ToolbarButton icon={LocateFixed} onClick={locate} disabled={status.kind === "locating"} ariaLabel="Find my district using your location">
          Find my district
        </ToolbarButton>

        {/* Centre: status */}
        <div className={styles.stripStatus}>
          {my.district && status.kind === "idle" && (
            <Pill tone="brand" icon={MapPin} title={PRIVACY_NOTE}>
              My district: {my.district.name}
            </Pill>
          )}
          {renderStatus()}
        </div>

        {/* Right: remember switch */}
        {remember}
      </div>
    </section>
  );
}

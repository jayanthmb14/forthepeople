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
import { useTranslations } from "next-intl";
import { ArrowRight, LocateFixed, MapPin } from "lucide-react";
import { Pill, ToolbarButton } from "@/components/district/ui";
import { INDIA_STATES, getState } from "@/lib/constants/districts";
import { findStateForPoint, nearestDistrict, pointInPolygon, stateSlugFromName } from "@/lib/geo/locate";
import type { DistrictCandidate, GeoFeatureCollection, NearestResult } from "@/lib/geo/locate";
import { buildCandidates } from "@/lib/geo/district-centroids";
import { useMyDistrict } from "@/hooks/useMyDistrict";
import type { MyDistrict } from "@/hooks/useMyDistrict";
import DistrictPopup from "./DistrictPopup";
import styles from "./home.module.css";
import { geoToRegistrySlug, stateGeoUrl } from "@/lib/geo/aliases";

export { useMyDistrict } from "@/hooks/useMyDistrict";

const GEO_URL = "/geo/india-states.json";

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

/** District boundaries for one state (/geo/<state>-districts.json), cached per state. */
const districtGeo = new Map<string, Promise<GeoFeatureCollection | null>>();
function loadDistrictShapes(stateSlug: string): Promise<GeoFeatureCollection | null> {
  let p = districtGeo.get(stateSlug);
  if (!p) {
    p = fetch(stateGeoUrl(stateSlug))
      .then((r) => (r.ok ? (r.json() as Promise<GeoFeatureCollection>) : null))
      .catch(() => null);
    districtGeo.set(stateSlug, p);
  }
  return p;
}

/**
 * The district whose boundary contains the point (exact), or null when the
 * shape file is missing or the point falls in a gap between polygons.
 */
async function districtByBoundary(stateSlug: string, lng: number, lat: number): Promise<string | null> {
  const shapes = await loadDistrictShapes(stateSlug);
  if (!shapes) return null;
  for (const f of shapes.features) {
    if (pointInPolygon(lng, lat, f.geometry)) {
      const raw = (f.properties as Record<string, unknown> | null)?.slug;
      const slug = typeof raw === "string" ? geoToRegistrySlug(stateSlug, raw) : null;
      if (slug && getState(stateSlug)?.districts.some((d) => d.slug === slug)) return slug;
    }
  }
  return null;
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
    return { kind: "error", message: "errMap" };
  }

  const stateName = findStateForPoint(lng, lat, geo);
  const stateSlug = stateSlugFromName(stateName);
  const state = stateSlug ? getState(stateSlug) : undefined;
  if (!stateName || !stateSlug || !state) {
    return { kind: "error", message: "errNoState" };
  }

  const all = candidates();
  // Exact answer first: the district boundary that contains the point.
  // Only when that is unavailable, fall back to the nearest district centre.
  const exactSlug = await districtByBoundary(stateSlug, lng, lat);
  const exact = exactSlug ? state.districts.find((d) => d.slug === exactSlug) : undefined;
  const inState = exact ? null : nearestDistrict(lng, lat, all, { stateSlug });
  const nearestLive = nearestDistrict(lng, lat, all, { activeOnly: true });
  const savedAt = new Date().toISOString();

  if (exact || inState) {
    const d: MyDistrict = {
      slug: exact ? exact.slug : inState!.candidate.slug,
      stateSlug,
      name: exact ? exact.name : inState!.candidate.name,
      stateName: state.name,
      active: exact ? exact.active : inState!.candidate.active,
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
  const t = useTranslations("locate");
  const privacy = t("privacy");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // The "Your district" card pops up once a location has been resolved.
  const [popupOpen, setPopupOpen] = useState(false);
  const my = useMyDistrict();

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "error", message: "errUnsupported" });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = await resolvePosition(pos.coords.latitude, pos.coords.longitude);
        setStatus(next);
        if (next.kind === "found-live" || next.kind === "found-coming") setPopupOpen(true);
        if (next.kind === "found-live") my.save(next.district);
        else if (next.kind === "found-coming" && next.district) my.save(next.district);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus({ kind: "denied" });
        else if (err.code === err.TIMEOUT) setStatus({ kind: "error", message: "errTimeout" });
        else setStatus({ kind: "error", message: "errUnknown" });
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
            {t("idle")}
          </span>
        );
      case "locating":
        return (
          <span style={mutedStyle} aria-live="polite">
            {t("locating")}
          </span>
        );
      case "found-live": {
        const d = status.district;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} aria-live="polite">
            <span style={textStyle}>
              {t.rich("youAreIn", { district: d.name, state: d.stateName, b: (c) => <strong style={{ fontWeight: 600 }}>{c}</strong> })}
            </span>
            {extras && <span style={mutedStyle}>{extras(d)}</span>}
            <ToolbarButton href={`/${locale}/${d.stateSlug}/${d.slug}`} icon={ArrowRight}>
              {t("open", { name: d.name })}
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
                  {t.rich("notLive", { district: d.name, state: d.stateName, b: (c) => <strong style={{ fontWeight: 600 }}>{c}</strong> })}
                  {count !== undefined && <> {t("asked", { count: formatCount(count) })}</>}
                </>
              ) : (
                <>
                  {t.rich("stateOnly", { state: status.stateName, b: (c) => <strong style={{ fontWeight: 600 }}>{c}</strong> })}
                </>
              )}
            </span>
            {d && (
              <ToolbarButton href={`/${locale}/vote-district?d=${d.slug}`} icon={ArrowRight}>
                {t("voteFor", { name: d.name })}
              </ToolbarButton>
            )}
            {live && (
              <a
                href={`/${locale}/${live.candidate.stateSlug}/${live.candidate.slug}`}
                style={{ ...mutedStyle, color: "var(--ftp-brand)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {t("nearest", { name: live.candidate.name, km: Math.round(live.distanceKm) })}
              </a>
            )}
          </span>
        );
      }
      case "denied":
        return (
          <span style={mutedStyle} role="status">
            {t("denied")}
          </span>
        );
      case "error":
        return (
          <span style={mutedStyle} role="status">
            {t(status.message)}
          </span>
        );
    }
  }

  const remember = (
    <label title={privacy} className={styles.stripRemember} style={mutedStyle}>
      <span>{t("remember")}</span>
      <button
        type="button"
        role="switch"
        aria-checked={my.remember}
        aria-label={t("remember")}
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
      <section aria-label={t("yourDistrict")} className={styles.heroLocate}>
        <button
          type="button"
          onClick={locate}
          disabled={status.kind === "locating"}
          className={styles.heroLocateBtn}
        >
          <span className="ftp-emoji" aria-hidden style={{ fontSize: 20 }}>📍</span>
          {status.kind === "locating" ? t("findingYou") : t("goToLocation")}
        </button>
        <div className={styles.heroLocateStatus} aria-live="polite">
          {my.district && status.kind === "idle" && (
            <Pill tone="brand" icon={MapPin} title={privacy}>
              {t("myDistrict", { name: my.district.name })}
            </Pill>
          )}
          {renderStatus()}
        </div>
        {remember}
        {popupOpen && (status.kind === "found-live" || status.kind === "found-coming") && (
          <DistrictPopup
            district={status.district}
            stateOnly={status.kind === "found-coming" ? { name: status.stateName, slug: status.stateSlug } : undefined}
            asked={status.kind === "found-coming" && status.district && votes ? votes[status.district.slug] : undefined}
            nearestLive={
              status.kind === "found-coming" && status.nearestLive
                ? {
                    name: status.nearestLive.candidate.name,
                    slug: status.nearestLive.candidate.slug,
                    stateSlug: status.nearestLive.candidate.stateSlug,
                    km: Math.round(status.nearestLive.distanceKm),
                  }
                : null
            }
            extras={status.kind === "found-live" && extras ? extras(status.district) : undefined}
            onClose={() => setPopupOpen(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section aria-label={t("yourDistrict")} className={styles.strip}>
      <div className={`ftp-container ${styles.stripRow}`}>
        {/* Left: the one button */}
        <ToolbarButton icon={LocateFixed} onClick={locate} disabled={status.kind === "locating"} ariaLabel={t("findAria")}>
          {t("find")}
        </ToolbarButton>

        {/* Centre: status */}
        <div className={styles.stripStatus}>
          {my.district && status.kind === "idle" && (
            <Pill tone="brand" icon={MapPin} title={privacy}>
              {t("myDistrict", { name: my.district.name })}
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

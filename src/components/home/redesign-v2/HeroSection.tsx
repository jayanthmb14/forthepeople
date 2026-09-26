/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 17 v11 — hero RESTRUCTURE.
 *
 * Phase B (Fixes #1, #2): Title block at top, full-width centered.
 *   H1 has 3 phrases each with its own 2-shade gradient (blue → purple →
 *   emerald). Banner-style "Explore the whole India" CTA pill below.
 *
 * Phase C (Fix #3): Map + districts row beneath title, 50/50 split.
 *   Map column uses aspect-ratio: 800/900 to match the SVG's natural
 *   viewBox so the map fills the frame with no empty space at top and
 *   no scale-transform-induced ocean cropping.
 *
 * Phase D (Fix #4): District rows render ALL content always (head row,
 *   tagline, bullets) at a stable min-height. overflow:hidden + zero
 *   transform/z-index on hover guarantees no content bleed onto
 *   neighboring rows. Hover only changes border + bg + soft shadow.
 *
 * Temperature + freshness come from /api/data/homepage-preview (existing
 * 5-min cached endpoint, no schema/API change).
 *
 * Audit 2026-09 (findings 3.7 / 3.9): the "recent reading" dot used to
 * render when `isLive` — which, under the old timeAgo, meant STALE — so
 * every 5-month-old district got a green dot. It now shows only when the
 * newest record is genuinely recent (`!isStale`). Temperatures carry an
 * honest "as of <date>" tooltip instead of "Latest weather reading", and a
 * district with no (or nulled-out stale) weather simply shows no temp.
 */

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DISTRICT_META } from "@/lib/data/district-meta";
import { asOfLabel, timeAgoLabel } from "@/lib/utils/timeAgo";
import { getCoveragePhrase } from "@/lib/platform-facts";
import { getDistrictIcon } from "@/components/district/icons";
import HeroShareIdea from "./HeroShareIdea";

const DrillDownMap = dynamic(() => import("@/components/map/DrillDownMap"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        background: "#F0F7FF",
      }}
    />
  ),
});

// Session 18 v12 Phase G (Fix #7): NEW badge valid 30 days from goLiveDate.
const NEW_BADGE_DAYS = 30;

function isWithin30Days(date: string | null | undefined): boolean {
  if (!date) return false;
  const ts = new Date(date).getTime();
  if (!Number.isFinite(ts)) return false;
  const ageDays = (Date.now() - ts) / 86_400_000;
  return ageDays <= NEW_BADGE_DAYS;
}

interface PreviewLive {
  /** Latest temperature, or null when the district has no recent reading. */
  temp: number | null;
  /** When that temperature was recorded (null if the API does not send it). */
  tempRecordedAt: string | null;
  /** Newest news timestamp — drives the "recent" dot. */
  mostRecentAt: string | null;
}
type PreviewMap = Record<string, PreviewLive>;

// /api/data/homepage-preview row. `weather` is null when the district has
// no reading, or when the API decided the reading is too old to show.
interface HomepagePreviewRow {
  slug: string;
  weather?: { temp: number | null; recordedAt?: string | null } | null;
  news?: { publishedAt: string } | null;
}

interface ActiveDistrict {
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  goLiveDate?: string | null;
}

export interface HeroSectionProps {
  locale: string;
  districts?: ActiveDistrict[];
}

export default function HeroSection({ locale, districts = [] }: HeroSectionProps) {
  // Session 18 v12 Phase G: districts ordered newest-first (was alphabetical).
  const sortedDistricts = useMemo(() => {
    return [...districts].sort((a, b) => {
      const ax = a.goLiveDate ? new Date(a.goLiveDate).getTime() : 0;
      const bx = b.goLiveDate ? new Date(b.goLiveDate).getTime() : 0;
      return bx - ax;
    });
  }, [districts]);

  const [preview, setPreview] = useState<PreviewMap>({});
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/data/homepage-preview");
        if (!res.ok) return;
        const data = (await res.json()) as { districtPreviews?: HomepagePreviewRow[] };
        if (cancelled) return;
        const next: PreviewMap = {};
        for (const r of data.districtPreviews ?? []) {
          next[r.slug] = {
            temp: r.weather?.temp ?? null,
            tempRecordedAt: r.weather?.recordedAt ?? null,
            mostRecentAt: r.news?.publishedAt ?? null,
          };
        }
        setPreview(next);
      } catch {
        /* swallow — rows render without temp/freshness */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="ftp-section-wrap ftp-hero-wrap"
    >
      <style>{`
        /* Session 17 v11 Phase B: title block on top */
        .ftp-hero-wrap {
          background: linear-gradient(to bottom, #FFFFFF 0%, #FAFAF8 100%);
          padding: 32px 0;
        }
        .ftp-hero-titleblock {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .ftp-hero-h1 {
          margin: 0;
          font-size: 38px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.025em;
          color: #0F172A;
          text-align: center;
        }
        /* Session 18 v12 Phase E (Fix #4): single navy color + one blue accent on "data" */
        .ftp-h1-accent {
          background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        .ftp-h1-flag {
          font-size: 0.9em;
          -webkit-text-fill-color: initial;
          color: initial;
        }
        .ftp-hero-subtitle {
          margin: 0;
          font-size: 14px;
          color: #6B7280;
          max-width: 540px;
          line-height: 1.5;
        }
        .ftp-hero-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          transition: transform 200ms ease, box-shadow 200ms ease;
          margin-top: 4px;
        }
        .ftp-hero-banner-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
        }
        .ftp-banner-icon { font-size: 16px; line-height: 1; }
        .ftp-banner-arrow {
          font-size: 16px;
          transition: transform 200ms ease;
        }
        .ftp-hero-banner-cta:hover .ftp-banner-arrow { transform: translateX(3px); }

        /* Session 17 v11 Phase C → Session 19 v13 Phase E: map dominates 60/40
           default, 65/35 on ≥1440px (matches production scale ~1054×1186) */
        /* Session 19.2 Phase E: stretch so map + district list match heights */
        .ftp-hero-row {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 24px;
          align-items: stretch;
        }
        @media (min-width: 1440px) {
          .ftp-hero-row { grid-template-columns: 65% 35%; }
        }
        .ftp-hero-map-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        /* Session 19.2 Phase D: SVG zoomed to crop dead blue around India */
        .ftp-hero-map-frame {
          width: 100%;
          aspect-ratio: 800 / 900;
          background: #F0F7FF;
          border: 1px solid #DBEAFE;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          display: flex;
          touch-action: pinch-zoom;
          /* Step 23: ambient warm halo (outer) + brass tint (inner). Pulses
             slowly via box-shadow only — GPU-cheap. */
          box-shadow:
            0 0 60px 12px rgba(244, 217, 164, 0.18),
            0 0 24px 4px rgba(201, 164, 90, 0.14);
          animation: ftp-map-glow-pulse 4.5s ease-in-out infinite;
        }
        @keyframes ftp-map-glow-pulse {
          0%, 100% {
            box-shadow:
              0 0 60px 12px rgba(244, 217, 164, 0.18),
              0 0 24px 4px rgba(201, 164, 90, 0.14);
          }
          50% {
            box-shadow:
              0 0 80px 18px rgba(244, 217, 164, 0.26),
              0 0 32px 6px rgba(201, 164, 90, 0.20);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-hero-map-frame {
            animation: none;
          }
        }
        .ftp-hero-map-frame svg {
          width: 100%;
          height: 100%;
          display: block;
          transform: scale(1.18);
          transform-origin: center center;
          transition: transform 300ms ease;
        }
        .ftp-hero-map-frame:hover svg {
          transform: scale(1.22);
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-hero-map-frame svg { transition: none; }
          .ftp-hero-map-frame:hover svg { transform: scale(1.18); }
        }
        .ftp-hero-map-hint {
          font-size: 11px;
          color: #9B9B9B;
          text-align: center;
        }

        .ftp-hero-districts-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
          /* Session 19.2 Phase E: fill row height so column matches map */
          height: 100%;
          min-height: 0;
        }
        .ftp-hero-districts-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
          padding-bottom: 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        /* "ACTIVE" = the district has launched. It is NOT a data-freshness
           claim — that lives on the per-row dot and the district status bar. */
        .ftp-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ECFDF5;
          color: #166534;
          border: 1px solid #BBF7D0;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        @keyframes ftp-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.85); }
        }
        /* Session 18 v12 Phase G: internal scroll + static Vote-next CTA
           Session 19.2 Phase E: drop max-height cap so flex:1 fills column */
        .ftp-hero-districts-scroll {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          margin-bottom: 8px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #D1D5DB transparent;
          padding-right: 4px;
        }
        .ftp-hero-districts-scroll::-webkit-scrollbar { width: 6px; }
        .ftp-hero-districts-scroll::-webkit-scrollbar-track { background: transparent; }
        .ftp-hero-districts-scroll::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }
        /* Session 19 v13 Phase H: Vote-next-district uses AMBER (was indigo
           which conflicted with state-tier indigo + features-purple). */
        .ftp-vote-next-district-cta {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: linear-gradient(135deg, var(--ftp-color-vote-district-bg) 0%, #FEF3C7 100%);
          border: 1px solid var(--ftp-color-vote-district-border);
          border-radius: 8px;
          text-decoration: none;
          color: #92400E;
          margin-top: 8px;
          transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
        }
        .ftp-vote-next-district-cta:hover {
          border-color: var(--ftp-color-vote-district);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }
        .ftp-vote-next-icon { font-size: 18px; flex-shrink: 0; line-height: 1; }
        .ftp-vote-next-text { flex: 1; min-width: 0; }
        .ftp-vote-next-title { font-size: 13px; font-weight: 700; color: #92400E; }
        .ftp-vote-next-sub { font-size: 11px; color: #B45309; margin-top: 1px; }
        @media (prefers-reduced-motion: reduce) {
          .ftp-vote-next-district-cta { transition: none; }
          .ftp-vote-next-district-cta:hover { transform: none; }
        }

        /* Session 17 v11 Phase D: stable district rows, all content always visible */
        /* Session 19.2 Phase H: bumped min-height + padding so tagline + bullets
           have visible vertical room (was 76px → text rendered ~10px tall and clipped). */
        .ftp-district-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          text-decoration: none;
          color: #1A1A1A;
          overflow: hidden;
          position: relative;
          min-height: 72px;
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
        }
        .ftp-district-row:hover {
          background: #FAFAFA;
          border-color: #2563EB;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.10);
        }
        .ftp-district-row-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .ftp-district-row-name-line {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        /* Session 19 v13 Phase D + 19.1 Phase F: per-district SVG icon
           bumped to 28×28 (was 18×18 — too small to register visually). */
        .ftp-district-row-icon {
          flex-shrink: 0;
          margin-right: 8px;
          width: 28px !important;
          height: 28px !important;
        }
        .ftp-district-row-name {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
          white-space: nowrap;
        }
        /* Session 19.3 Phase C: small green pulsing dot replaces the
           "🕐 Live" meta line — saves ~16px vertical per row. */
        .ftp-district-row-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.20);
          flex-shrink: 0;
          animation: ftp-pulse-dot 2s ease-in-out infinite;
        }
        .ftp-district-row-script {
          font-size: 12px;
          color: #9B9B9B;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Session 18 v12 Phase G (Fix #7): green NEW badge (was yellow) */
        .ftp-district-row-newbadge {
          background: #10B981;
          color: #FFFFFF;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
          letter-spacing: 0.4px;
          flex-shrink: 0;
        }
        .ftp-district-row-temp {
          font-size: 11px;
          color: #6B7280;
          font-weight: 600;
          flex-shrink: 0;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        /* Session 19.2 Phase H: explicit line-height + min-height so text is
           guaranteed visible (was rendering at ~9px tall, font 11px → invisible). */
        .ftp-district-row-tagline {
          font-size: 11px;
          line-height: 1.5;
          min-height: 16px;
          color: #2563EB;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ftp-district-row-bullets {
          font-size: 10px;
          line-height: 1.5;
          min-height: 15px;
          color: #6B7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 1024px) {
          .ftp-hero-row { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (max-width: 767px) {
          .ftp-hero-h1 { font-size: 28px; }
          .ftp-hero-subtitle { font-size: 13px; padding: 0 16px; }
          .ftp-hero-banner-cta { padding: 10px 20px; font-size: 13px; }
          .ftp-hero-titleblock { margin-bottom: 20px; }
          .ftp-hero-map-frame { aspect-ratio: 4 / 5; }
          .ftp-district-row-script { display: none; }
          .ftp-district-row { padding: 10px 12px; min-height: 70px; }
          .ftp-hero-districts-scroll { max-height: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-hero-banner-cta { transition: none; }
          .ftp-hero-banner-cta:hover { transform: none; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25); }
          .ftp-hero-banner-cta:hover .ftp-banner-arrow { transform: none; }
          .ftp-district-row-live-dot { animation: none; }
          .ftp-district-row { transition: none; }
        }
      `}</style>

      <div className="ftp-section-inner">
        {/* TOP: Title block */}
        <div className="ftp-hero-titleblock">
          <h1 id="hero-heading" className="ftp-hero-h1">
            Your district. Your <span className="ftp-h1-accent">data</span>. Your right.{" "}
            <span className="ftp-h1-flag" aria-label="India">🇮🇳</span>
          </h1>
          <p className="ftp-hero-subtitle">
            Free, source-linked government data for {getCoveragePhrase()}.
          </p>
          <Link href={`/${locale}/india`} className="ftp-hero-banner-cta">
            <span className="ftp-banner-icon" aria-hidden="true">🗺️</span>
            <span className="ftp-banner-label">Explore the whole India</span>
            <span className="ftp-banner-arrow" aria-hidden="true">→</span>
          </Link>

          {/* Session 19 v13 Phase F: thin expandable Share-Your-Idea bar */}
          <HeroShareIdea />
        </div>

        {/* BOTTOM: Map + districts row */}
        <div className="ftp-hero-row">
          {/* LEFT — Map (50%, natural aspect) */}
          <div className="ftp-hero-map-col">
            <div
              className="ftp-hero-map-frame"
              aria-label="India map showing active states"
              role="img"
            >
              <DrillDownMap locale={locale} />
            </div>
            <div className="ftp-hero-map-hint">👆 Click a state to explore</div>
          </div>

          {/* RIGHT — districts (50%, internal scroll + Vote-next CTA pinned) */}
          <div className="ftp-hero-districts-col">
            <div className="ftp-hero-districts-header">
              <span className="ftp-live-pill">ACTIVE</span>
              <span>{sortedDistricts.length} districts</span>
            </div>

            <div className="ftp-hero-districts-scroll">
              {sortedDistricts.map((d) => {
                const meta = DISTRICT_META[d.slug];
                const live = preview[d.slug];
                const temp = live?.temp ?? null;
                const tempAsOf = asOfLabel(live?.tempRecordedAt ?? null);
                const isNew = isWithin30Days(d.goLiveDate);
                // isStale = older than 2h (or unknown). The dot means
                // "something was published recently", so it must be hidden
                // for stale rows — the exact opposite of the old behaviour.
                const updated = timeAgoLabel(live?.mostRecentAt ?? null);
                const Icon = getDistrictIcon(d.slug);
                return (
                  <Link
                    key={d.slug}
                    href={`/${locale}/${d.stateSlug}/${d.slug}`}
                    className="ftp-district-row"
                  >
                    <div className="ftp-district-row-head">
                      <div className="ftp-district-row-name-line">
                        {Icon && <Icon size={28} className="ftp-district-row-icon" />}
                        {!updated.isStale && (
                          <span
                            className="ftp-district-row-live-dot"
                            aria-label={`Updated ${updated.label}`}
                            title={`Updated ${updated.label}`}
                          />
                        )}
                        <span className="ftp-district-row-name">{d.name}</span>
                        {meta?.nativeScript && (
                          <span className="ftp-district-row-script">
                            {meta.nativeScript}
                          </span>
                        )}
                        {isNew && (
                          <span className="ftp-district-row-newbadge">NEW</span>
                        )}
                      </div>
                      {temp != null && (
                        <span
                          className="ftp-district-row-temp"
                          title={tempAsOf ? `Weather ${tempAsOf}` : "Weather reading"}
                        >
                          🌡️ {temp}°C
                        </span>
                      )}
                    </div>
                    {meta?.tagline && (
                      <div className="ftp-district-row-tagline">{meta.tagline}</div>
                    )}
                    {meta?.bullets && meta.bullets.length > 0 && (
                      <div className="ftp-district-row-bullets">
                        {meta.bullets.join(" · ")}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Static "Vote for next district" CTA pinned at bottom of column */}
            <Link
              href={`/${locale}/vote-district`}
              className="ftp-vote-next-district-cta"
            >
              <span className="ftp-vote-next-icon" aria-hidden="true">🗳️</span>
              <div className="ftp-vote-next-text">
                <div className="ftp-vote-next-title">Vote for the next district</div>
                <div className="ftp-vote-next-sub">Tell us which district to launch next →</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * LiveStrip — slim freshness/coverage strip above the hero.
 *
 * File 48 §4.7.2. Tricolor-tinted gradient background (saffron → blue → green
 * at ~4% opacity each) layered over the page background so the strip stays
 * readable when sticky. Five metadata items: data as of, sources, modules,
 * districts, states. Pulsing green LIVE dot on the left.
 *
 * Server Component. Two values are derived from the live system:
 *   - `dataAsOf`: MAX(IndiaIndicator.asOfDate) formatted as "MMM yyyy".
 *     Replaces the earlier IndiaScraperRun.startedAt + timeAgoLabel
 *     ("LAST SYNC 483h ago") display — Phase F 2026-05-20 confirmed those
 *     scraper rows are seed placeholders, not real freshness signals. The
 *     honest signal is the source data's own as-of date.
 *   - `liveDistrictCount`: getTotalActiveDistrictCount() from the registry
 *
 * The other four values (sourceCount, liveModuleCount, editorialModuleCount,
 * liveStateCount, totalStates, totalDistricts) are slow-drift aggregates that
 * stay as hardcoded placeholders for Phase 4.7. Wire them when needed.
 *
 * Sticky positioning (Phase D 2026-05-21): pinned at top:81px (header 41 +
 * breadcrumb 36 + section progress bar 4 = 81) so the strip stays visible as
 * the user scrolls. Z-index 38 sits one below SectionProgressBar's 39.
 */

import * as React from "react";
import { prisma } from "@/lib/db";
import { getTotalActiveDistrictCount } from "@/lib/constants/districts";

interface LiveStripProps {
  sourceCount?: number;
  liveModuleCount?: number;
  editorialModuleCount?: number;
  totalDistricts?: number;
  liveStateCount?: number;
  totalStates?: number;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      <span
        style={{
          color: "var(--color-text-tertiary)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: "9.5px",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          color: "var(--color-text-primary)",
          fontSize: "11px",
        }}
      >
        {value}
      </span>
    </span>
  );
}

function Divider() {
  return <span style={{ width: "1px", height: "11px", background: "rgba(0,0,0,0.08)" }} />;
}

export async function LiveStrip({
  // TODO Phase 5+: derive from DB (INDIA_SOURCES count, INDIA_MODULES live/editorial split,
  // State table count). These drift slowly so placeholder is acceptable for now.
  sourceCount = 320,
  liveModuleCount = 53,
  editorialModuleCount = 6,
  totalDistricts = 780,
  liveStateCount = 7,
  totalStates = 36,
}: LiveStripProps = {}) {
  // The honest freshness signal is the most recent source asOfDate across
  // all India indicators — Census, NFHS, NTCA, etc. update yearly+ not
  // hourly. Phase D 2026-05-21 replaced the misleading "LAST SYNC X h ago"
  // (which was reading IndiaScraperRun seed-placeholder timestamps) with
  // "DATA AS OF MMM YYYY" sourced from IndiaIndicator.asOfDate.
  const latestIndicator = await prisma.indiaIndicator.findFirst({
    orderBy: { asOfDate: "desc" },
    select: { asOfDate: true },
  });

  const dataAsOf = latestIndicator?.asOfDate
    ? new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
      }).format(latestIndicator.asOfDate)
    : "—";

  const liveDistrictCount = getTotalActiveDistrictCount();

  // The five non-pill items are rendered into a marquee track on mobile
  // so the LIVE pill stays pinned at the left while the rest scroll
  // through. The track contains TWO copies of the same fragment so the
  // CSS `translateX(-50%)` loop hands off seamlessly without a visible
  // gap. Desktop hides the duplicate copy via india-mobile.css and
  // disables the animation so the row reads exactly as before.
  const trailingItems = (
    <>
      <Divider />
      <Item label="Data as of" value={dataAsOf} />
      <Divider />
      <Item label="Sources" value={`${sourceCount} .gov.in`} />
      <Divider />
      <Item
        label="Modules"
        value={`${liveModuleCount} live · ${editorialModuleCount} editorial`}
      />
      <Divider />
      <Item label="Districts" value={`${liveDistrictCount} of ${totalDistricts}`} />
      <Divider />
      <Item label="States" value={`${liveStateCount} of ${totalStates}`} />
    </>
  );

  return (
    <div
      data-ftp-live-bar="1"
      style={{
        // Phase D 2026-05-21: pin the strip below the section progress bar
        // so it stays visible as a contextual anchor (data freshness +
        // coverage) while the user scrolls through the 10 bands.
        position: "sticky",
        top: "81px",
        zIndex: 38,
        // Layered background: tricolor 4%-opacity gradient on top of the
        // page surface color so the strip is opaque when sticky (content
        // beneath scrolls under it cleanly).
        background:
          "linear-gradient(90deg, rgba(255, 153, 51, 0.04) 0%, rgba(24, 95, 165, 0.04) 50%, rgba(19, 136, 8, 0.04) 100%), var(--color-background, #FAFAF8)",
        border: "0.5px solid rgba(83, 74, 183, 0.18)",
        borderRadius: "var(--border-radius-md)",
        boxShadow: "0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        padding: "7px 12px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        fontSize: "11px",
        marginBottom: "12px",
        overflowX: "auto",
      }}
      role="status"
      aria-label="Platform freshness and coverage"
    >
      <span
        data-ftp-live-pill="1"
        style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
      >
        <span
          aria-hidden
          className="ftp-live-dot"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#16A34A",
            boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.12)",
          }}
        />
        <span
          style={{
            color: "#16A34A",
            fontWeight: 500,
            letterSpacing: "0.04em",
            fontSize: "10px",
          }}
        >
          LIVE
        </span>
      </span>

      <div data-ftp-live-marquee="1" style={{ display: "contents" }}>
        <div
          data-ftp-live-marquee-track="1"
          style={{ display: "contents" }}
        >
          <div style={{ display: "contents" }}>{trailingItems}</div>
          <div style={{ display: "contents" }} aria-hidden="true">
            {trailingItems}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ftp-live-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12); }
          50%      { box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.06); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .ftp-live-dot { animation: ftp-live-pulse 1800ms ease-in-out infinite; }
        }
      `}</style>
    </div>
  );
}

export default LiveStrip;

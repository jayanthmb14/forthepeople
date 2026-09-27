/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// State page map card: a label row, the state's district map (Karnataka
// has a hand-tuned map; every other state uses the generic one) and the
// DataMeet attribution. Design v3 chrome: plain Card look, tokens only.
"use client";

import dynamic from "next/dynamic";

const KarnatakaMap = dynamic(() => import("@/components/map/KarnatakaMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const GenericStateMap = dynamic(() => import("@/components/map/GenericStateMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/** Flat placeholder while the map code loads (no shimmer). */
function MapSkeleton() {
  return (
    <div
      className="ftp-skeleton"
      style={{
        height: 320,
        borderRadius: "var(--ftp-radius-tile)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "var(--ftp-text-2)", fontSize: 13 }}>Loading map…</span>
    </div>
  );
}

interface StateMapSectionProps {
  locale: string;
  stateSlug: string;
  activeDistrictSlugs: string[];
}

export default function StateMapSection({ locale, stateSlug, activeDistrictSlugs }: StateMapSectionProps) {
  return (
    <div
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        overflow: "hidden",
        height: "100%",
        maxHeight: 400,
      }}
    >
      <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ftp-label">Click a district to explore</span>
      </div>
      <div style={{ height: "calc(100% - 32px)", overflow: "hidden" }}>
        {stateSlug === "karnataka" ? (
          <KarnatakaMap locale={locale} activeDistricts={new Set(activeDistrictSlugs)} />
        ) : (
          <GenericStateMap locale={locale} stateSlug={stateSlug} activeDistricts={new Set(activeDistrictSlugs)} />
        )}
      </div>
      <div style={{ padding: "0 16px 6px", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        Map data © DataMeet Contributors · CC-BY 4.0
      </div>
    </div>
  );
}

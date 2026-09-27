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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("map");
  return (
    <div
      className="ftp-skeleton"
      style={{
        height: "100%",
        borderRadius: "var(--ftp-radius-tile)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "var(--ftp-text-2)", fontSize: 13 }}>{t("loadingMap")}</span>
    </div>
  );
}

interface StateMapSectionProps {
  locale: string;
  stateSlug: string;
  activeDistrictSlugs: string[];
}

export default function StateMapSection({ locale, stateSlug, activeDistrictSlugs }: StateMapSectionProps) {
  const t = useTranslations("map");
  return (
    // No border or background here: the page wraps this in a kit <Card>.
    // The map frame has a fixed, width-aware height and the SVG fits inside
    // it, so the whole state is always visible. (It used to take the full
    // content width at its natural aspect ratio and was clipped at 400 px,
    // which hid the southern districts.)
    <div>
      <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ftp-label">{t("clickDistrict")}</span>
      </div>
      <div style={{ height: "clamp(300px, 55vw, 460px)", padding: "8px 16px" }}>
        {stateSlug === "karnataka" ? (
          <KarnatakaMap locale={locale} activeDistricts={new Set(activeDistrictSlugs)} />
        ) : (
          <GenericStateMap locale={locale} stateSlug={stateSlug} activeDistricts={new Set(activeDistrictSlugs)} />
        )}
      </div>
      <div style={{ padding: "0 16px 6px", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {t("credit")}
      </div>
    </div>
  );
}

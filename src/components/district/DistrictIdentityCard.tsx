/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  DistrictIdentityCard — the top card of a district page (Design v3,
//  CONCEPT-v3 §5 "District overview", step 1).
// ═══════════════════════════════════════════════════════════
//
//  Used by BOTH the live district overview (OverviewClient) and the
//  "not live yet" preview (LockedDistrictPreview), so a district looks
//  the same before and after it launches.
//
//   ┌────────────────────────────────────────────────────────────┐
//   │ KARNATAKA · DISTRICT                              ◯ C+      │
//   │ Mandya  ಮಂಡ್ಯ   (H1 36/40 600 + local script 22)  health    │
//   │ [Sugar Capital] [Kaveri Basin] …   (tagline chips)          │
//   │ ┌Population┐┌Area┐┌Literacy┐┌Taluks┐   (StatStrip)          │
//   │ As of Census 2011 · [Census of India]  (or "estimate")      │
//   │ {children — e.g. the freshness row}                         │
//   └────────────────────────────────────────────────────────────┘
//
//  This file holds the ONLY <h1> of the page it is used on.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { SourcePill, StatStrip, StatTile } from "@/components/district/ui";
import { DEFAULT_PALETTE, DistrictSVG, PALETTES } from "@/components/district/DistrictHeroIllustration";
import { getDistrictHue, hueClass } from "@/lib/design/hues";
import { scriptLang } from "@/lib/utils/script-lang";
import { usePlaceText } from "@/i18n/client";
import DistrictBadges from "@/components/district/DistrictBadges";
import { HealthScoreRing } from "@/components/district/DistrictHealthScoreCard";
import type { DistrictBadge } from "@/lib/constants/districts";

export interface DistrictIdentityCardProps {
  name: string;
  nameLocal?: string;
  stateName: string;
  tagline?: string;
  badges?: DistrictBadge[];
  population?: number | null;
  area?: number | null;
  literacy?: number | null;
  /** Where the population / area / literacy numbers come from, e.g.
   *  "Census 2011". Leave empty when the figures are registry estimates —
   *  the card then says so instead of claiming a census year. */
  statsAsOf?: string | null;
  /** Link for the source pill next to `statsAsOf`. */
  statsSource?: { label: string; href: string } | null;
  /** Number of taluks / tehsils / mandals… */
  subUnitCount?: number | null;
  /** Plural label for the sub-district unit ("Taluks", "Tehsils", …). */
  subUnitLabel?: string;
  /** When set, shows the KpiRing health grade for this district. */
  healthSlug?: string;
  /** District slug for the v4 hue + landmark illustration (defaults to healthSlug). */
  districtSlug?: string;
  /** Right-hand slot used instead of the health ring (e.g. a status Pill). */
  aside?: React.ReactNode;
  /** Extra rows at the bottom of the card (freshness row, vote block…). */
  children?: React.ReactNode;
}

export default function DistrictIdentityCard({
  name,
  nameLocal,
  stateName,
  tagline,
  badges,
  population,
  area,
  literacy,
  statsAsOf,
  statsSource,
  subUnitCount,
  subUnitLabel = "Taluks",
  healthSlug,
  districtSlug,
  aside,
  children,
}: DistrictIdentityCardProps) {
  // v4: the card wears the district's own hue and its hand-drawn
  // landmark illustration (restored from the original site) on the right.
  const t = useTranslations("overview");
  const tk = useTranslations("kit");
  const place = usePlaceText();
  const locale = useLocale();
  const slug = districtSlug ?? healthSlug ?? "";
  // UI in the district's own language → lead with the local name.
  const localFirst = Boolean(nameLocal && nameLocal !== name && scriptLang(nameLocal) === locale);
  const primaryName = localFirst ? (nameLocal as string) : name;
  const secondaryName = localFirst ? name : nameLocal && nameLocal !== name ? nameLocal : undefined;
  const palette = PALETTES[slug] ?? DEFAULT_PALETTE;
  const hasArt = Boolean(PALETTES[slug]);
  return (
    <section
      aria-labelledby="district-title"
      className={`${hueClass(getDistrictHue(slug))} ftp-rise`}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        background: `linear-gradient(135deg, rgb(${palette.gradientBase}) 0%, #fff 70%)`,
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      {hasArt && (
        <div aria-hidden className="ftp-hero-art">
          <DistrictSVG slug={slug} p={palette} />
        </div>
      )}
      <div style={{ position: "relative", padding: "clamp(18px, 3vw, 28px)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: "1 1 260px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid var(--ftp-border)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ftp-text-2)",
                marginBottom: 10,
              }}
            >
              <span className="ftp-emoji" aria-hidden>📍</span>
              {t("districtOf", { state: place.state(stateName, stateName) })}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h1 id="district-title" className="ftp-display" style={{ margin: 0, fontSize: "clamp(34px, 5vw, 48px)", lineHeight: 1.02, fontWeight: 750, color: "var(--ftp-text)", textWrap: "balance" }}>
                <span lang={localFirst ? scriptLang(primaryName) : undefined}>{primaryName}</span>
              </h1>
              {secondaryName && (
                <span lang={localFirst ? "en" : scriptLang(secondaryName)} style={{ fontSize: "clamp(20px, 2.6vw, 26px)", lineHeight: 1.2, fontWeight: 600, color: "var(--hue-deep)" }}>
                  {secondaryName}
                </span>
              )}
            </div>
            {(tagline || (badges && badges.length > 0)) && (
              <div style={{ marginTop: 12, maxWidth: 560 }}>
                <DistrictBadges tagline={tagline} badges={badges} />
              </div>
            )}
          </div>
          {aside ?? (healthSlug ? <HealthScoreRing districtSlug={healthSlug} /> : null)}
        </div>

        {/* Headline numbers. The caption names where they come from: the
            census row from the database when there is one, otherwise it says
            the figure is an estimate. Never claim a census year we don't have. */}
        <div style={{ marginTop: 20, maxWidth: 720 }}>
          <StatStrip cols={4}>
            <StatTile emoji="👨‍👩‍👧" label={t("population")} value={population ? population.toLocaleString("en-IN") : "—"} />
            <StatTile emoji="🗺️" label={t("area")} value={area ? area.toLocaleString("en-IN") : "—"} unit={area ? "km²" : undefined} />
            <StatTile emoji="📚" label={t("literacy")} value={literacy ? `${literacy}` : "—"} unit={literacy ? "%" : undefined} />
            <StatTile emoji="🏘️" label={subUnitLabel} value={subUnitCount ?? "—"} />
          </StatStrip>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
              {statsAsOf ? t("asOfCensus", { dataset: statsAsOf }) : tk("latestEstimate")}
            </span>
            {statsSource && <SourcePill label={statsSource.label} href={statsSource.href} />}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

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
//
//  v5 (calm): the overview shows only the name block — no census tiles
//  (the glance tiles and the People card carry them) and no health ring
//  (the report card sits lower down). The locked-district preview keeps
//  the tiles. Stat tiles carry no emoji.
//
//  v5.1 "Warm Calm" hero: a pastel sky in the district's own colours with a
//  soft sun glow, a band of hills along the bottom and the district's
//  hand-drawn landmark (or a generic landscape when it has none) large on
//  the right — at full strength on a laptop, as a picture along the bottom
//  on a phone. A small kicker names the state (and, on the overview, how
//  many taluks the district has). Decoration only: text stays navy on a
//  near-white wash, so contrast never depends on the picture.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { SourcePill, StatStrip, StatTile } from "@/components/district/ui";
import { HeroLandscape } from "@/components/district/shell/overview-art";
import { DEFAULT_PALETTE, DistrictSVG, PALETTES } from "@/components/district/DistrictHeroIllustration";
import { getDistrictHue, hueClass } from "@/lib/design/hues";
import { useFormat, usePlaceText } from "@/i18n/client";
import { placeNamePair } from "@/i18n/place-name";
import DistrictBadges from "@/components/district/DistrictBadges";
import { HealthScoreRing } from "@/components/district/DistrictHealthScoreCard";
import type { DistrictBadge, PlaceNames } from "@/lib/constants/districts";

export interface DistrictIdentityCardProps {
  name: string;
  nameLocal?: string;
  /** Registry names in other languages ({ hi: "मंड्या" }); names[locale] leads the heading. */
  names?: PlaceNames;
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
  /** v5: show the four census tiles (default true; the overview turns them off). */
  showStats?: boolean;
  /** Show the state kicker above the name (default true). */
  showStateChip?: boolean;
}

export default function DistrictIdentityCard({
  name,
  nameLocal,
  names,
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
  showStats = true,
  showStateChip = true,
}: DistrictIdentityCardProps) {
  // v4: the card wears the district's own hue and its hand-drawn
  // landmark illustration (restored from the original site) on the right.
  const t = useTranslations("overview");
  const tk = useTranslations("kit");
  const place = usePlaceText();
  const locale = useLocale();
  const f = useFormat();
  const slug = districtSlug ?? healthSlug ?? "";
  // The name in the page language leads (names[locale], or the local-script
  // name on a matching page); English or the local script sits beside it.
  const pair = placeNamePair({ name, nameLocal, names }, locale);
  const palette = PALETTES[slug] ?? DEFAULT_PALETTE;
  const hasArt = Boolean(PALETTES[slug]);
  const tk2 = useTranslations("page_district-shell");
  const stateLabel = place.state(stateName, stateName);
  // Overview (no census tiles): "Karnataka · 7 taluks". Locked preview
  // (tiles show the count): "Karnataka district".
  const kicker =
    !showStats && subUnitCount
      ? tk2("hero.kicker", { state: stateLabel, n: subUnitCount, units: subUnitLabel.toLocaleLowerCase(locale) })
      : t("districtOf", { state: stateLabel });
  return (
    <section
      aria-labelledby="district-title"
      className={`${hueClass(getDistrictHue(slug))} ftp-hero ftp-rise`}
      // The district's own pastel (registry palette) tints the sky.
      style={{ ["--hero-base" as string]: `rgb(${palette.gradientBase})` }}
    >
      <div aria-hidden className="ftp-hero-sky" />
      <div aria-hidden className="ftp-hero-art">
        {hasArt ? <DistrictSVG slug={slug} p={palette} /> : <HeroLandscape />}
      </div>
      <svg aria-hidden focusable="false" className="ftp-hero-hills" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0 52c150-30 300-34 460-14s330 22 480-6 190-24 260-18v66H0Z" className="ftp-hero-hill-back" />
        <path d="M0 66c200-22 380-20 560-6s360 14 520-4c50-6 90-6 120-4v28H0Z" className="ftp-hero-hill-front" />
      </svg>
      <div className="ftp-hero-body">
        <div className="ftp-hero-row">
          <div className="ftp-hero-text">
            {showStateChip && (
              <span className="ftp-hero-kicker">
                <MapPin size={13} aria-hidden />
                {kicker}
              </span>
            )}
            <div className="ftp-hero-names">
              <h1 id="district-title" className="ftp-hero-name">
                <span lang={pair.primaryLang}>{pair.primary}</span>
              </h1>
              {pair.secondary && (
                <span lang={pair.secondaryLang} className="ftp-hero-local">
                  {pair.secondary}
                </span>
              )}
            </div>
            {(tagline || (badges && badges.length > 0)) && (
              <div className="ftp-hero-tags">
                <DistrictBadges tagline={tagline} badges={badges} />
              </div>
            )}
          </div>
          {aside ?? (healthSlug ? <HealthScoreRing districtSlug={healthSlug} /> : null)}
        </div>

        {/* Headline numbers. The caption names where they come from: the
            census row from the database when there is one, otherwise it says
            the figure is an estimate. Never claim a census year we don't have. */}
        {showStats && (
        <div style={{ marginTop: 20, maxWidth: 720 }}>
          <StatStrip cols={4}>
            <StatTile label={t("population")} value={population ? f.number(population) : "—"} />
            <StatTile label={t("area")} value={area ? f.number(area) : "—"} unit={area ? "km²" : undefined} />
            <StatTile label={t("literacy")} value={literacy ? `${literacy}` : "—"} unit={literacy ? "%" : undefined} />
            <StatTile label={subUnitLabel} value={subUnitCount ?? "—"} />
          </StatStrip>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
              {statsAsOf ? t("asOfCensus", { dataset: statsAsOf }) : tk("latestEstimate")}
            </span>
            {statsSource && <SourcePill label={statsSource.label} href={statsSource.href} />}
          </div>
        </div>
        )}

        {children}
      </div>
    </section>
  );
}

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

import { Card, SourcePill, StatStrip, StatTile } from "@/components/district/ui";
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
  aside,
  children,
}: DistrictIdentityCardProps) {
  return (
    <Card as="section" padding={24} aria-labelledby="district-title">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 260px" }}>
          <p className="ftp-label" style={{ marginBottom: 6 }}>
            {stateName} · District
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 id="district-title" className="ftp-h1">{name}</h1>
            {nameLocal && nameLocal !== name && (
              <span lang="und" style={{ fontSize: 22, lineHeight: "28px", fontWeight: 400, color: "var(--ftp-text-2)" }}>
                {nameLocal}
              </span>
            )}
          </div>
          {(tagline || (badges && badges.length > 0)) && (
            <div style={{ marginTop: 12 }}>
              <DistrictBadges tagline={tagline} badges={badges} />
            </div>
          )}
        </div>
        {aside ?? (healthSlug ? <HealthScoreRing districtSlug={healthSlug} /> : null)}
      </div>

      {/* Headline numbers. The caption names where they come from: the
          census row from the database when there is one, otherwise it says
          the figure is an estimate. Never claim a census year we don't have. */}
      <div style={{ marginTop: 20 }}>
        <StatStrip cols={4}>
          <StatTile label="Population" value={population ? population.toLocaleString("en-IN") : "—"} />
          <StatTile label="Area" value={area ? area.toLocaleString("en-IN") : "—"} unit={area ? "km²" : undefined} />
          <StatTile label="Literacy" value={literacy ? `${literacy}` : "—"} unit={literacy ? "%" : undefined} />
          <StatTile label={subUnitLabel} value={subUnitCount ?? "—"} />
        </StatStrip>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
            {statsAsOf ? `As of ${statsAsOf}` : "Latest available estimate"}
          </span>
          {statsSource && <SourcePill label={statsSource.label} href={statsSource.href} />}
        </div>
      </div>

      {children}
    </Card>
  );
}

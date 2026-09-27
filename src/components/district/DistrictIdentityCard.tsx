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
//   │ As of Census 2011 · [Census of India]                       │
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

      {/* Census numbers. They do not change day to day, but they ARE from
          the 2011 Census, so the card says so right under them. */}
      <div style={{ marginTop: 20 }}>
        <StatStrip cols={4}>
          <StatTile label="Population" value={population ? population.toLocaleString("en-IN") : "—"} />
          <StatTile label="Area" value={area ? area.toLocaleString("en-IN") : "—"} unit={area ? "km²" : undefined} />
          <StatTile label="Literacy" value={literacy ? `${literacy}` : "—"} unit={literacy ? "%" : undefined} />
          <StatTile label={subUnitLabel} value={subUnitCount ?? "—"} />
        </StatStrip>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>As of Census 2011</span>
          <SourcePill label="Census of India" href="https://censusindia.gov.in/" />
        </div>
      </div>

      {children}
    </Card>
  );
}

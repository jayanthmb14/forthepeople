/**
 * SuperCategoryHero — compact hero for /en/india/category/<slug>.
 *
 * File 45 §4 Level 2. ~200px height. Accent radial wash, pre-headline,
 * headline, tagline, 2-3 inline KPI tiles drawn from headline + key
 * sub-grouped modules.
 *
 * Phase 4: KPI tiles render with mockValue from each module's
 * headlineMetric (Phase 5 swaps to live IndiaIndicator data).
 */

import * as React from "react";
import type { IndiaSuperCategoryDef } from "@/lib/india/india-super-categories";
import {
  INDIA_MODULES,
  getLiveModuleCountInSuperCategory,
  getPlannedModuleCountInSuperCategory,
} from "@/lib/india/india-modules";
import { getModulesForSuperCategory } from "@/lib/india/india-super-categories";
import { IndiaSuperCategoryAccents } from "@/lib/india/design-tokens";
import { KPITile } from "@/components/india/primitives/KPITile";

export interface SuperCategoryHeroProps {
  superCategory: IndiaSuperCategoryDef;
}

function pickHeroKPIs(superCategorySlug: string) {
  const ordered = getModulesForSuperCategory(superCategorySlug, INDIA_MODULES);
  // Pick up to 3 modules with a headlineMetric and live status; fall back to
  // any module with a headlineMetric.
  const live = ordered.filter((m) => m.status === "live" && m.headlineMetric);
  const fallback = ordered.filter((m) => m.headlineMetric);
  const picks = live.length >= 3 ? live.slice(0, 3) : fallback.slice(0, 3);
  return picks;
}

export function SuperCategoryHero({ superCategory }: SuperCategoryHeroProps) {
  const accent = IndiaSuperCategoryAccents[superCategory.accentColor];
  const liveCount = getLiveModuleCountInSuperCategory(superCategory.slug);
  const plannedCount = getPlannedModuleCountInSuperCategory(superCategory.slug);
  const totalInSC = INDIA_MODULES.filter((m) => m.superCategory === superCategory.slug).length;

  const heroKPIs = pickHeroKPIs(superCategory.slug);
  const isEditorial = superCategory.headlineMetric === null;

  return (
    <section
      style={{
        position: "relative",
        padding: "22px 24px",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-surface)",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 100% at 0% 0%, ${accent.hex}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: "13px",
            color: accent.hex,
            marginBottom: "4px",
            fontWeight: 600,
          }}
        >
          {superCategory.icon} {totalInSC} modules
        </div>

        <h1
          style={{
            fontFamily: "var(--ftp-font-display)",
            fontSize: "34px",
            fontWeight: 650,
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {superCategory.title}
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            margin: "0 0 14px",
            maxWidth: "720px",
          }}
        >
          {superCategory.tagline}
        </p>

        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "12px" }}>
          {liveCount} live · {plannedCount} activating soon
        </div>

        {!isEditorial && heroKPIs.length > 0 && (
          <div
            className="super-cat-kpi-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(heroKPIs.length, 3)}, minmax(0, 1fr))`,
              gap: "12px",
              marginTop: "10px",
            }}
          >
            {heroKPIs.map((m) => (
              <KPITile
                key={m.slug}
                label={m.headlineMetric!.label}
                value={m.headlineMetric!.mockValue}
                unit={m.headlineMetric!.mockUnit}
                quality="published"
                source={m.status === "live" ? m.sources[0]?.sourceKey ?? "" : "Awaiting first sync"}
              />
            ))}
          </div>
        )}

        {isEditorial && (
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: "12px 0 0" }}>
            {superCategory.tagline}
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .super-cat-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default SuperCategoryHero;

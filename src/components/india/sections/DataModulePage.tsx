/**
 * DataModulePage — full Phase 4 deep-dive page for a data module.
 *
 * Phase 4 wires Wildlife/Tigers; Phase 5 reuses for the other 52 data modules.
 * Validates all 8 authenticity moves (file 45 §6).
 */

import * as React from "react";
import Link from "next/link";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { getSuperCategoryBySlug } from "@/lib/india/india-super-categories";
import { IndiaSuperCategoryAccents } from "@/lib/india/design-tokens";
import { ModuleDropdown } from "@/components/india/primitives/ModuleDropdown";
import { KPITile } from "@/components/india/primitives/KPITile";
import { DataModuleHero } from "@/components/india/sections/DataModuleHero";
import { MethodologyAccordion } from "@/components/india/sections/MethodologyAccordion";
import { SourcesCard } from "@/components/india/sections/SourcesCard";
import { RelevantNewsSection } from "@/components/india/sections/RelevantNewsSection";
import { TimeSeriesChart } from "@/components/india/charts/TimeSeriesChart";
import { StateLeaderboard } from "@/components/india/charts/StateLeaderboard";
import { IndiaChoropleth } from "@/components/india/charts/IndiaChoropleth";
import { prisma } from "@/lib/db";
import type { ScraperCadence } from "@/components/india/primitives/SourceHealthDot";

export interface DataModulePageProps {
  module: IndiaModuleDef;
  locale: string;
  headlineMetricKey: string;
  expectedCadence?: ScraperCadence;
  scraperKey?: string;
  methodologyRows: { title: string; body: string; pdfUrl?: string }[];
  supportingMetricKeys?: string[];
}

export async function DataModulePage({
  module,
  locale,
  headlineMetricKey,
  expectedCadence = "annual",
  scraperKey,
  methodologyRows,
  supportingMetricKeys = [],
}: DataModulePageProps) {
  const sc = getSuperCategoryBySlug(module.superCategory);
  const accent = sc ? IndiaSuperCategoryAccents[sc.accentColor] : IndiaSuperCategoryAccents.blue;

  const supportingIndicators =
    supportingMetricKeys.length > 0
      ? await prisma.indiaIndicator.findMany({
          where: {
            moduleSlug: module.slug,
            metricKey: { in: supportingMetricKeys },
          },
          orderBy: { displayOrder: "asc" },
        })
      : [];

  return (
    <main
      style={{
        background: "var(--color-background)",
        minHeight: "100vh",
        padding: "1.25rem 1rem 3rem",
      }}
    >
      <div style={{ width: "100%" }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--color-text-tertiary)",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link href={`/${locale}`} style={{ color: "var(--color-text-tertiary)" }}>
            Home
          </Link>
          <span>›</span>
          <Link href={`/${locale}/india`} style={{ color: "var(--color-text-tertiary)" }}>
            India
          </Link>
          <span>›</span>
          <Link
            href={`/${locale}/india/category/${module.superCategory}`}
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {sc?.title}
          </Link>
          <span>›</span>
          <ModuleDropdown
            currentLabel={`${module.icon} ${module.title}`}
            scope="super-category"
            superCategorySlug={module.superCategory}
            locale={locale}
          />
        </nav>

        <DataModuleHero
          module={module}
          headlineMetricKey={headlineMetricKey}
          expectedCadence={expectedCadence}
          scraperKey={scraperKey}
        />

        {/* Supporting KPI tiles */}
        {supportingIndicators.length > 0 && (
          <div
            className="data-module-kpis"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(supportingIndicators.length, 3)}, minmax(0, 1fr))`,
              gap: "12px",
              marginBottom: "1.5rem",
            }}
          >
            {supportingIndicators.map((i) => {
              const v = i.numericValue ? Number(i.numericValue) : null;
              const prev = i.previousValue ? Number(i.previousValue) : null;
              const delta =
                v !== null && prev !== null && prev !== 0 ? ((v - prev) / prev) * 100 : null;
              return (
                <KPITile
                  key={i.id}
                  label={i.metricLabel}
                  value={v ?? "—"}
                  unit={i.unit ?? undefined}
                  delta={
                    delta !== null
                      ? {
                          value: `${Math.abs(delta).toFixed(1)}% from ${
                            i.previousAsOfDate ? new Date(i.previousAsOfDate).getFullYear() : "prior"
                          }`,
                          trend: delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat",
                        }
                      : undefined
                  }
                  quality={(i.dataQuality ?? "published") as "published" | "derived" | "estimated"}
                  source={`${i.source} · ${new Date(i.asOfDate).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}`}
                />
              );
            })}
          </div>
        )}

        {/* Two-column: time series + state leaderboard */}
        <div
          className="data-module-charts"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "20px",
            marginBottom: "0",
          }}
        >
          <TimeSeriesChart
            moduleSlug={module.slug}
            metricKey={headlineMetricKey}
            title={module.headlineMetric?.label ?? "Trend"}
            unit={module.headlineMetric?.mockUnit}
            accentHex={accent.hex}
          />
          <StateLeaderboard
            moduleSlug={module.slug}
            metricKey={headlineMetricKey}
            title="Top 5 states"
            unit={module.headlineMetric?.mockUnit}
            accentHex={accent.hex}
          />
        </div>

        <IndiaChoropleth
          moduleSlug={module.slug}
          metricKey={headlineMetricKey}
          title="State distribution"
          unit={module.headlineMetric?.mockUnit}
          accentHex={accent.hex}
        />

        <MethodologyAccordion rows={methodologyRows} />

        <SourcesCard module={module} expectedCadence={expectedCadence} />

        {/* RelevantNewsSection auto-hides if no news rows exist */}
        <RelevantNewsSection moduleSlug={module.slug} />

        {/* Continue exploring footer */}
        <section
          style={{
            marginTop: "2rem",
            padding: "18px 22px",
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ftp-font-display)",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "0 0 12px",
            }}
          >
            Continue exploring
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }} className="data-module-continue">
            <Link
              href={`/${locale}/india/category/${module.superCategory}`}
              style={{
                display: "block",
                background: "var(--color-background-secondary)",
                padding: "12px 14px",
                borderRadius: "var(--border-radius-md)",
                textDecoration: "none",
                color: "var(--color-text-primary)",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Browse all</div>
              <div style={{ fontSize: "14px", fontWeight: 500, marginTop: "2px" }}>
                {sc?.title} modules
              </div>
            </Link>
            <div
              style={{
                background: "var(--color-background-secondary)",
                padding: "12px 14px",
                borderRadius: "var(--border-radius-md)",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                Related editorial
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                Editorial reading — coming soon
              </div>
            </div>
          </div>
        </section>

        <style>{`
          @media (max-width: 768px) {
            .data-module-kpis {
              grid-template-columns: 1fr 1fr !important;
            }
            .data-module-charts {
              grid-template-columns: 1fr !important;
            }
            .data-module-continue {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}

export default DataModulePage;

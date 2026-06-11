/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 *
 * Orchestrator for /[locale]/india/[moduleSlug] — the per-module
 * deep-dive dashboard. 11 sections, each in its own component for
 * isolation:
 *   1. Breadcrumb (India › Category › Module)
 *   2. Hero (SVG + title + tagline + 3-6 KPIs)
 *   3. Inline legal note (if module.legalNote)
 *   4. State choropleth (primary metric)
 *   5. Time-series chart
 *   6. State leaderboard (top-5 / bottom-5)
 *   7. AI analysis card
 *   8. News strip (filtered by module.newsKeywords)
 *   9. Coming-soon sub-features
 *  10. Related modules
 *  11. Sources panel
 *
 * Coming-soon modules render the same shell with a clearly labelled
 * "Module activating soon" notice replacing the heavier data-driven
 * sections (chart, choropleth, leaderboard).
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  type IndiaModuleDef,
  getModuleAnalysisSlug,
  getModuleNewsKeywords,
  getModulePrimaryMetric,
} from "@/lib/india/india-modules";
import { getSuperCategoryBySlug } from "@/lib/india/india-super-categories";
import {
  CATEGORY_ACCENT,
  INDIA_DESIGN,
  categoryTint,
} from "@/lib/india/india-design";
import { getMockMetric } from "@/lib/india/mock-state-data";
import { getMockAnalysis } from "@/lib/india/mock-ai-analysis";
import ModuleHero from "./ModuleHero";
import ModuleStateMap from "./ModuleStateMap";
import ModuleTimeSeries from "./ModuleTimeSeries";
import ModuleStateLeaderboard from "./ModuleStateLeaderboard";
import ModuleAIAnalysisCard from "./ModuleAIAnalysisCard";
import ModuleNewsStrip from "./ModuleNewsStrip";
import ModuleSourcePanel from "./ModuleSourcePanel";
import ModuleRelatedModules from "./ModuleRelatedModules";
import ModuleComingSoonRail from "./ModuleComingSoonRail";
import IndiaReportIssueButton from "@/components/india/IndiaReportIssueButton";

type Disclaimers = {
  top: string;
  defence: string;
  health: string;
  elections: string;
  justice: string;
  mcc: string;
};

interface Props {
  locale: string;
  module: IndiaModuleDef;
  disclaimers: Disclaimers;
}

export default async function ModulePage({ locale, module, disclaimers }: Props) {
  const accent = CATEGORY_ACCENT[module.category];
  const tint = categoryTint(module.category);
  const superCategory = getSuperCategoryBySlug(module.superCategory);
  const primaryMetric = getModulePrimaryMetric(module);
  // Map any non-mock metric to a sensible fallback so the choropleth
  // still has something to colour with even when the registry's
  // primaryMetric isn't in MOCK_METRICS.
  const mockMetric = getMockMetric(primaryMetric);
  const choroplethMetric = mockMetric ? primaryMetric : "population_total";
  const choroplethLabel =
    getMockMetric(choroplethMetric)?.label ?? "Population";
  const choroplethUnit = getMockMetric(choroplethMetric)?.unit ?? "";
  const newsKeywords = getModuleNewsKeywords(module);
  const analysisSlug = getModuleAnalysisSlug(module);
  const analysis = getMockAnalysis(analysisSlug);
  const noteText =
    module.legalNote && module.legalNote in disclaimers
      ? disclaimers[module.legalNote as keyof Disclaimers]
      : null;

  const isLive = module.status === "live";

  return (
    <main
      role="main"
      style={{ background: INDIA_DESIGN.bgPage, minHeight: "100vh" }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          padding: "16px 16px 0",
          maxWidth: 1200,
          margin: "0 auto",
          fontSize: 12,
          color: INDIA_DESIGN.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/${locale}`}
          style={{
            color: INDIA_DESIGN.textMuted,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Home size={12} aria-hidden="true" />
          Home
        </Link>
        <ChevronRight size={12} aria-hidden="true" style={{ color: INDIA_DESIGN.textFaint }} />
        <Link
          href={`/${locale}/india`}
          style={{ color: INDIA_DESIGN.textMuted, textDecoration: "none" }}
        >
          India
        </Link>
        <ChevronRight size={12} aria-hidden="true" style={{ color: INDIA_DESIGN.textFaint }} />
        {superCategory ? (
          <Link
            href={`/${locale}/india/category/${superCategory.slug}`}
            style={{ color: INDIA_DESIGN.textMuted, textDecoration: "none" }}
          >
            {superCategory.title}
          </Link>
        ) : (
          <span style={{ textTransform: "capitalize" }}>{module.category}</span>
        )}
        <ChevronRight size={12} aria-hidden="true" style={{ color: INDIA_DESIGN.textFaint }} />
        <span style={{ color: INDIA_DESIGN.textPrimary, fontWeight: 600 }}>
          {module.title}
        </span>
      </nav>

      <ModuleHero module={module} />

      {noteText ? (
        <section style={{ padding: "20px 16px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p
              style={{
                fontSize: 12,
                color: INDIA_DESIGN.textMuted,
                fontStyle: "italic",
                lineHeight: 1.55,
                margin: 0,
                padding: "10px 14px",
                background: tint,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 4,
              }}
            >
              {noteText}
            </p>
          </div>
        </section>
      ) : null}

      {!isLive ? (
        <section style={{ padding: "20px 16px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div
              role="status"
              style={{
                background: INDIA_DESIGN.amberStrip,
                border: `1px solid ${INDIA_DESIGN.amberStripBorder}`,
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "#78350F",
                lineHeight: 1.5,
              }}
            >
              <strong>Module activating soon.</strong> The data pipeline for{" "}
              <strong>{module.title}</strong> is queued — once the upstream
              source ({module.sources[0]?.sourceKey ?? "TBD"}) is wired, this
              page will show the choropleth, time series, leaderboard, and AI
              analysis below. Sources and metadata are listed at the bottom so
              you can verify the pipeline plan.
            </div>
          </div>
        </section>
      ) : null}

      {isLive ? (
        <>
          {module.hasStateBreakdownData ? (
            <>
              <ModuleStateMap metricKey={choroplethMetric} metricLabel={choroplethLabel} />
              <ModuleStateLeaderboard
                locale={locale}
                metricKey={choroplethMetric}
                metricLabel={choroplethLabel}
              />
            </>
          ) : (
            <section
              style={{
                padding: "20px 16px",
                background: INDIA_DESIGN.bgPage,
                borderBottom: `1px solid ${INDIA_DESIGN.border}`,
              }}
            >
              <div
                style={{
                  maxWidth: 1200,
                  margin: "0 auto",
                  background: INDIA_DESIGN.bgCard,
                  border: `1px dashed ${INDIA_DESIGN.border}`,
                  borderRadius: 12,
                  padding: "20px 24px",
                  fontSize: 13,
                  color: INDIA_DESIGN.textMuted,
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: INDIA_DESIGN.textPrimary, fontSize: 14 }}>
                  State-by-state view: Coming Soon
                </strong>
                <p style={{ margin: "6px 0 0" }}>
                  This module ships with national-level data first. Per-state
                  breakdowns will appear here once the upstream source publishes
                  state-wise figures and that data source is connected.
                </p>
              </div>
            </section>
          )}
          <ModuleTimeSeries
            metricKey={choroplethMetric}
            metricLabel={choroplethLabel}
            unit={choroplethUnit}
            category={module.category}
          />
        </>
      ) : null}

      {analysis ? <ModuleAIAnalysisCard analysis={analysis} /> : null}

      {/* News strip is its own server component — works for both live
          and coming_soon modules (filters NewsItem by module.newsKeywords). */}
      <ModuleNewsStrip newsKeywords={newsKeywords} moduleTitle={module.title} />

      <ModuleComingSoonRail locale={locale} module={module} />

      <ModuleRelatedModules locale={locale} module={module} />

      <ModuleSourcePanel module={module} />

      <IndiaReportIssueButton moduleSlug={module.slug} />
    </main>
  );
}

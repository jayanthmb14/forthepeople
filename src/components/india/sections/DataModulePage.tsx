/**
 * DataModulePage — full Phase 4 deep-dive page for a data module.
 *
 * Phase 4 wires Wildlife/Tigers; Phase 5 reuses it for the other data
 * modules. Validates all 8 authenticity moves (file 45 §6).
 *
 * Design v4 + i18n (Sep 2026):
 *   - every string comes from "page_india-module" / "page_india";
 *   - the trend and top-states pictures use the shared ChartCard (simple
 *     sentence, source, as-of date, table view) and read IndiaTimeSeries /
 *     IndiaStateBreakdown only;
 *   - the "State-level distribution map — coming soon" placeholder with a
 *     made-up legend, the "View all states" text that went nowhere and the
 *     "Related editorial — coming soon" box were removed.
 *   - v4.1: the 1320 px ModulePage frame, an "In simple words" sentence
 *     from the headline row, supporting figures and state bars that open
 *     a DetailSheet.
 */

import * as React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Home } from "lucide-react";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { getSuperCategoryBySlug } from "@/lib/india/india-super-categories";
import { ModulePage as PageFrame } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { FigureTiles } from "@/components/india/FigureSheet";
import { toFigure } from "@/components/india/module-page/figures";
import { ModuleDropdown } from "@/components/india/primitives/ModuleDropdown";
import { DataModuleHero } from "@/components/india/sections/DataModuleHero";
import { MethodologyAccordion, type MethodologyRow } from "@/components/india/sections/MethodologyAccordion";
import { SourcesCard } from "@/components/india/sections/SourcesCard";
import { RelevantNewsSection } from "@/components/india/sections/RelevantNewsSection";
import { TopStatesBars } from "@/components/india/module-page/ModuleVisuals";
import TrendLine from "@/components/india/module-page/TrendLine";
import IndiaReportIssueButton from "@/components/india/IndiaReportIssueButton";
import { indiaCategoryHue } from "@/components/india/module-page/v4";
import { Glyph } from "@/components/graphics";
import { indiaSuperCategoryGlyph } from "@/components/india/glyphs";
import { getModuleIndicators, getModuleSeries, getModuleStates } from "@/components/india/module-page/data";
import type { ScraperCadence } from "@/components/india/primitives/SourceHealthDot";
import { INDIA_NS, indiaText } from "@/components/india/i18n";
import { fmtDate, formatIndicator, formatIndicatorText } from "@/components/india/format";

export interface DataModulePageProps {
  module: IndiaModuleDef;
  locale: string;
  headlineMetricKey: string;
  expectedCadence?: ScraperCadence;
  scraperKey?: string;
  methodologyRows: MethodologyRow[];
  /** Message group of the methodology rows in "page_india-module" (e.g. "tigers"). */
  methodologyNamespace: string;
  supportingMetricKeys?: string[];
}

export async function DataModulePage({
  module,
  locale,
  headlineMetricKey,
  expectedCadence = "annual",
  scraperKey,
  methodologyRows,
  methodologyNamespace,
  supportingMetricKeys = [],
}: DataModulePageProps) {
  const [t, tp, ti, ts] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-module" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
    getTranslations({ locale, namespace: "states" }),
  ]);
  const x = indiaText(tp, ti);
  const sc = getSuperCategoryBySlug(module.superCategory);
  const title = x.moduleTitle(module);

  const [indicators, series, states] = await Promise.all([
    getModuleIndicators(module.slug),
    getModuleSeries(module.slug),
    getModuleStates(module.slug),
  ]);
  const byKey = new Map(indicators.map((r) => [r.metricKey, r]));
  const label = (metricKey: string, fallback: string) => {
    const k = `metric.${module.slug}.${metricKey}`;
    return t.has(k) ? t(k) : fallback;
  };
  const text = (v: number, unit: string | null) => formatIndicatorText(tp, locale, v, unit);

  const supporting = supportingMetricKeys
    .map((k) => byKey.get(k))
    .filter((r): r is NonNullable<typeof r> => Boolean(r && r.value !== null));

  const trend = series.find((s) => s.metricKey === headlineMetricKey) ?? series[0];
  const stateRows = states[headlineMetricKey] ?? Object.values(states)[0] ?? [];
  const year = (iso: string) => String(new Date(iso).getUTCFullYear());
  const headlineRow = byKey.get(headlineMetricKey);
  const hue = indiaCategoryHue(module.category);
  const figures = supporting.map((r) =>
    toFigure(r, { tp, locale, label: label(r.metricKey, r.metricLabel), emoji: r.metricKey.includes("area") ? "🗺️" : "🏞️" }),
  );
  const simple =
    headlineRow && headlineRow.value !== null
      ? t("explain.figure", {
          label: label(headlineRow.metricKey, headlineRow.metricLabel),
          value: text(headlineRow.value, headlineRow.unit),
          date: fmtDate(locale, headlineRow.asOf),
          source: headlineRow.source,
        })
      : t("explain.none", { module: title, source: t("soon.theSource") });

  return (
    <main className={hue} style={{ minHeight: "100vh" }}>
      <PageFrame>
        <nav
          aria-label={t("crumbs.aria")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ftp-text-2)", marginBottom: 14, flexWrap: "wrap" }}
        >
          <Link href={`/${locale}`} style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Home size={13} aria-hidden />
            {ti("breadcrumb.home")}
          </Link>
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <Link href={`/${locale}/india`} style={{ color: "inherit", textDecoration: "none" }}>
            {ti("breadcrumb.india")}
          </Link>
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          {sc ? (
            <Link href={`/${locale}/india/category/${module.superCategory}`} style={{ color: "inherit", textDecoration: "none" }}>
              {x.scTitle(sc)}
            </Link>
          ) : null}
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <ModuleDropdown
            currentLabel={title}
            scope="super-category"
            superCategorySlug={module.superCategory}
            locale={locale}
          />
        </nav>

        <DataModuleHero
          module={module}
          locale={locale}
          headlineMetricKey={headlineMetricKey}
          expectedCadence={expectedCadence}
          scraperKey={scraperKey}
        />

        <Explainer>{simple}</Explainer>

        {figures.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ftp-text-2)" }}>{t("hero.tapHint")}</p>
            <FigureTiles figures={figures} hueClassName={hue} />
          </div>
        )}

        {(trend || stateRows.length >= 3) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              gap: 16,
              alignItems: "start",
            }}
          >
            {trend ? (
              <ChartCard
                title={t("vis.trendTitle")}
                emoji="📈"
                units={headlineRow ? label(headlineRow.metricKey, headlineRow.metricLabel) : undefined}
                simple={t("vis.trendSimple", {
                  from: text(trend.points[0].value, trend.unit),
                  fromYear: year(trend.points[0].date),
                  to: text(trend.points[trend.points.length - 1].value, trend.unit),
                  toYear: year(trend.points[trend.points.length - 1].date),
                })}
                source={{ label: trend.source, href: trend.sourceUrl || undefined }}
                asOf={trend.points[trend.points.length - 1].date}
                table={trend.points.map((p) => ({ label: year(p.date), value: text(p.value, trend.unit) }))}
              >
                <TrendLine
                  points={trend.points.map((p) => ({ label: year(p.date), value: p.value }))}
                  unitLabel={formatIndicator(tp, locale, trend.points[0].value, trend.unit).unit}
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--ftp-text-2)" }}>
                  {t("data.points", { n: trend.points.length })}
                </p>
              </ChartCard>
            ) : null}
            {stateRows.length >= 3 ? (
              <TopStatesBars
                title={t("data.topTitle")}
                emoji="🏆"
                simple={t("vis.topSimple", {
                  first: ts.has(stateRows[0].stateSlug) ? ts(stateRows[0].stateSlug) : stateRows[0].stateName,
                  value: text(stateRows[0].value, stateRows[0].unit),
                })}
                items={stateRows.slice(0, 5).map((r) => ({
                  label: ts.has(r.stateSlug) ? ts(r.stateSlug) : r.stateName,
                  value: r.value,
                  display: text(r.value, r.unit),
                  rank: r.rank,
                }))}
                source={{ label: stateRows[0].source, href: stateRows[0].sourceUrl || undefined }}
                asOf={stateRows[0].asOf}
                hueClassName={hue}
              />
            ) : null}
          </div>
        )}

        <MethodologyAccordion rows={methodologyRows} group={methodologyNamespace} />

        <SourcesCard module={module} locale={locale} expectedCadence={expectedCadence} />

        {/* RelevantNewsSection hides itself when there are no news rows. */}
        <RelevantNewsSection moduleSlug={module.slug} locale={locale} />

        {sc ? (
          <Link
            href={`/${locale}/india/category/${module.superCategory}`}
            className="ftp-card-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: "2rem",
              padding: "16px 20px",
              borderRadius: "var(--ftp-radius-card)",
              border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
              background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 75%)",
              boxShadow: "var(--ftp-shadow-1)",
              textDecoration: "none",
              color: "var(--ftp-text)",
            }}
          >
            <span className="ftp-icon-chip" aria-hidden style={{ width: 44, height: 44, borderRadius: 14 }}>
              <Glyph name={indiaSuperCategoryGlyph(sc.slug).glyph} size={26} />
            </span>
            <span>
              <span style={{ display: "block", fontSize: 12, color: "var(--ftp-text-2)" }}>{t("data.continue")}</span>
              <span className="ftp-display" style={{ fontSize: 17, fontWeight: 650 }}>
                {t("data.allIn", { category: x.scTitle(sc) })}
              </span>
            </span>
          </Link>
        ) : null}
      </PageFrame>

      <IndiaReportIssueButton moduleSlug={module.slug} moduleLabel={title} />
    </main>
  );
}

export default DataModulePage;

/**
 * DataModuleHero — module deep-dive hero with all authenticity moves visible.
 *
 * File 45 §4 Level 3 (data) + §6.
 *
 * Authenticity moves rendered:
 *  #1 Two dates (the source's as-of date + when we recorded it)
 *  #2 Click-through verification — source pills are links
 *  #3 Source health indicator — dot in the freshness strip
 *  #4 Methodology link — in the freshness strip
 *  #5 Prior-value comparison — in the headline block
 *  #8 Data quality flag — chip on the headline number
 *
 * Server component. Text from "page_india-module" (data.*) and "page_india".
 */

import * as React from "react";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { getSuperCategoryBySlug } from "@/lib/india/india-super-categories";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { DataQualityChip, type DataQualityKind } from "@/components/india/primitives/DataQualityChip";
import { SourceHealthDot, type ScraperCadence } from "@/components/india/primitives/SourceHealthDot";
import { SourcePill } from "@/components/india/primitives/SourcePill";
import { CountUpNumber } from "@/components/india/primitives/CountUpNumber";
import { INDIA_NS, indiaText } from "@/components/india/i18n";
import { domainOf, fmtAgo, fmtDate, fmtDecimal, formatIndicator } from "@/components/india/format";

export interface DataModuleHeroProps {
  module: IndiaModuleDef;
  locale: string;
  headlineMetricKey: string; // moduleSlug + metricKey identifies the IndiaIndicator row
  expectedCadence?: ScraperCadence;
  scraperKey?: string; // overrides module.scraperKeys[0] if needed
}

/** Faint super-category glyphs behind the hero (decoration only). */
const WATERMARK: Record<string, string> = {
  "macro-snapshot": "📊",
  "know-india": "📖",
  "living-standards": "🌐",
  "wildlife-forests": "🐾",
  "agriculture-livestock": "🌾",
  "natural-resources-energy": "⛏",
  infrastructure: "🏗",
  governance: "⚖",
  innovation: "🚀",
  culture: "🎭",
};

export async function DataModuleHero({
  module,
  locale,
  headlineMetricKey,
  expectedCadence = "annual",
  scraperKey,
}: DataModuleHeroProps) {
  const [t, tp, ti] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-module" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
  ]);
  const x = indiaText(tp, ti);
  const sc = getSuperCategoryBySlug(module.superCategory);

  let indicator: Awaited<ReturnType<typeof prisma.indiaIndicator.findUnique>> = null;
  try {
    indicator = await prisma.indiaIndicator.findUnique({
      where: { moduleSlug_metricKey: { moduleSlug: module.slug, metricKey: headlineMetricKey } },
    });
  } catch {
    indicator = null;
  }

  const value = indicator?.numericValue != null ? Number(indicator.numericValue) : null;
  const previous = indicator?.previousValue != null ? Number(indicator.previousValue) : null;
  const delta = value !== null && previous !== null && previous !== 0 ? ((value - previous) / previous) * 100 : null;
  const dir: "up" | "down" | "flat" = delta === null ? "flat" : delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat";
  const deltaColor = dir === "up" ? "#15803D" : dir === "down" ? "#B91C1C" : "var(--ftp-text-2)";

  const quality = (indicator?.dataQuality ?? "published") as DataQualityKind;
  const sourceUrl = indicator?.sourceUrl ?? "";
  const sourceName = indicator?.source ?? module.sources[0]?.sourceKey ?? "";
  const methodologyUrl = indicator?.methodologyUrl;
  const unit = value !== null ? formatIndicator(tp, locale, value, indicator?.unit ?? null).unit : "";
  const resolvedScraperKey = scraperKey ?? module.scraperKeys[0] ?? `${module.slug}-no-scraper`;
  const glyph = WATERMARK[module.superCategory] ?? sc?.icon ?? "·";
  const decoration: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    userSelect: "none",
    color: "var(--hue)",
    lineHeight: 1,
  };

  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(18px, 3vw, 28px)",
        borderRadius: "var(--ftp-radius-card)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        background:
          "radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--hue-pop) 30%, transparent) 0%, transparent 55%), linear-gradient(135deg, var(--hue-tint) 0%, #fff 70%)",
        boxShadow: "var(--ftp-shadow-1)",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <span aria-hidden style={{ ...decoration, right: "-28px", bottom: "-36px", fontSize: "200px", opacity: 0.08, transform: "rotate(-12deg)" }}>
        {glyph}
      </span>
      <span aria-hidden style={{ ...decoration, right: "60px", top: "30%", fontSize: "80px", opacity: 0.05, transform: "rotate(15deg)" }}>
        {glyph}
      </span>

      <div className="data-hero-grid" style={{ position: "relative" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <span className="data-hero-chip">
              <span className="ftp-emoji" aria-hidden>
                {module.icon}
              </span>
              {sc ? x.scTitle(sc) : module.superCategory}
            </span>
            {module.subGroup ? <span className="data-hero-chip">{x.subGroup(module.subGroup)}</span> : null}
          </div>

          <h1 className="ftp-display data-hero-title" style={{ fontSize: "clamp(28px, 4.2vw, 40px)", fontWeight: 650, margin: "0 0 6px", lineHeight: 1.12 }}>
            {x.moduleTitle(module)}
          </h1>
          <p style={{ fontSize: 15, lineHeight: "23px", color: "var(--ftp-text-2)", margin: "0 0 18px", maxWidth: 560 }}>
            {x.moduleTagline(module)}
          </p>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            {value !== null ? (
              <CountUpNumber
                target={value}
                decimals={Number.isInteger(value) ? 0 : undefined}
                className="data-hero-bignum ftp-bignum"
                inlineStyle={{ fontSize: "clamp(40px, 7vw, 60px)", lineHeight: 1, color: "var(--hue-deep)" }}
              />
            ) : (
              <span className="data-hero-bignum ftp-bignum" style={{ fontSize: 48, lineHeight: 1, color: "var(--hue-deep)" }}>
                —
              </span>
            )}
            {unit ? <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ftp-text-2)" }}>{unit}</span> : null}
            {delta !== null ? (
              <span style={{ fontSize: 13, fontWeight: 600, color: deltaColor }}>
                {indicator?.previousAsOfDate
                  ? t("data.changeYear", {
                      dir,
                      pct: `${fmtDecimal(locale, Math.abs(delta), 1)}%`,
                      year: String(new Date(indicator.previousAsOfDate).getUTCFullYear()),
                    })
                  : t("data.changePrior", { dir, pct: `${fmtDecimal(locale, Math.abs(delta), 1)}%` })}
              </span>
            ) : null}
            {indicator ? <DataQualityChip quality={quality} /> : null}
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 14px",
              fontSize: 12,
              color: "var(--ftp-text-2)",
            }}
          >
            {indicator ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <SourceHealthDot locale={locale} scraperKey={resolvedScraperKey} expectedCadence={expectedCadence} />
                {t.rich("data.sourceLine", {
                  source: sourceName,
                  date: fmtDate(locale, indicator.asOfDate),
                  a: (chunks) =>
                    sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}>
                        {chunks}
                      </a>
                    ) : (
                      <strong>{chunks}</strong>
                    ),
                })}
              </span>
            ) : null}
            {indicator ? <span suppressHydrationWarning>{t("data.recorded", { ago: fmtAgo(locale, indicator.fetchedAt) })}</span> : null}
            {methodologyUrl ? (
              <a
                href={methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--hue-deep)", fontWeight: 600 }}
              >
                {t("data.methodology")}
                <ExternalLink size={12} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.8)",
            border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))",
            borderRadius: 14,
            padding: "14px 16px",
            alignSelf: "start",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 650, color: "var(--hue-deep)", marginBottom: 8 }}>
            <span className="ftp-emoji" aria-hidden style={{ marginInlineEnd: 6 }}>
              📚
            </span>
            {t("data.sources")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {module.sources.slice(0, 4).map((s) => {
              const meta = INDIA_SOURCES[s.sourceKey];
              return (
                <SourcePill
                  key={s.sourceKey}
                  domain={meta?.url ? domainOf(meta.url) : s.sourceKey}
                  url={meta?.url || undefined}
                  variant="gov"
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .data-hero-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 28px; align-items: start; }
        .data-hero-chip {
          display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 8px; border-radius: 999px;
          background: #fff; border: 1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border));
          color: var(--hue-deep); font-size: 12px; line-height: 18px; font-weight: 600;
        }
        @media (max-width: 768px) {
          .data-hero-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
}

export default DataModuleHero;

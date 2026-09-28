/**
 * /[locale]/india/category/[superCategorySlug] — Level-2 super-category page.
 *
 * File 45 §4 Level 2, Design v4 + i18n (Sep 2026), layout v4.1:
 *  - breadcrumb with a module picker scoped to the super-category
 *  - ElectionPeriodNotice (governance only, env-flag driven)
 *  - SuperCategoryHero: hue band, a live/coming-soon ring, the "In simple
 *    words" line and up to four real headline figures (tap → details)
 *  - the module cards, grouped under their sub-group headings; tapping a
 *    card opens a DetailSheet with every published figure of the module,
 *    its sources and a button to the full page
 *  - a "still being set up" note when some modules are not live
 *
 * v4.1: the left rail listed the same modules as the cards (on phones it
 * pushed the cards a whole screen down), so the rail is gone and its
 * sub-group headings now head the card groups. The page sits in the
 * 1320 px ModulePage frame (docs/LAYOUT.md).
 *
 * One set of counts (live / coming soon / total) is computed here from the
 * registry and handed to the hero ring, the simple-words line and the
 * footer note, so they always agree. Figures come from IndiaIndicator only
 * — no placeholder values.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Home } from "lucide-react";
import {
  INDIA_SUPER_CATEGORIES,
  getSuperCategoryBySlug,
  getModulesForSuperCategory,
  getModulesGroupedBySubGroup,
} from "@/lib/india/india-super-categories";
import { INDIA_MODULES, type IndiaModuleDef } from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { routing } from "@/i18n/routing";
import { languageAlternates } from "@/i18n/seo";
import { ModulePage as PageFrame, Section } from "@/components/district/ui";
import { CategoryGlyph } from "@/components/graphics";
import { indiaSuperCategoryGlyph } from "@/components/india/glyphs";
import { ModuleDropdown } from "@/components/india/primitives/ModuleDropdown";
import { SuperCategoryHero } from "@/components/india/sections/SuperCategoryHero";
import { CategoryModuleCards, type CategoryCard } from "@/components/india/sections/CategoryModuleCards";
import { ElectionPeriodNotice } from "@/components/india/sections/ElectionPeriodNotice";
import { indiaSuperCategoryHue } from "@/components/india/module-page/v4";
import { getIndicatorsForModules, groupIndicators, pickHeadline, type IndicatorRow } from "@/components/india/module-page/data";
import { toFigure } from "@/components/india/module-page/figures";
import { INDIA_NS, indiaText } from "@/components/india/i18n";
import { fmtDate, formatIndicator } from "@/components/india/format";

interface PageProps {
  params: Promise<{
    locale: string;
    superCategorySlug: string;
  }>;
}

export const revalidate = 900; // 15 min ISR

/** Figures listed in a module's sheet (the rest are on its full page). */
const SHEET_FIGURES = 6;

function figureEmoji(row: IndicatorRow, fallback: string): string {
  if (row.unit === "rank") return "🏆";
  if (row.unit === "percent") return "📊";
  if (row.unit === "year") return "📅";
  return fallback;
}

export function generateStaticParams() {
  // The [locale] layout sets dynamicParams = false, so every valid pair is listed.
  return routing.locales.flatMap((locale) => INDIA_SUPER_CATEGORIES.map((sc) => ({ locale, superCategorySlug: sc.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, superCategorySlug } = await params;
  const sc = getSuperCategoryBySlug(superCategorySlug);
  if (!sc) return {};
  const [t, tp, ti] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-category" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
  ]);
  const x = indiaText(tp, ti);
  const title = t("meta.title", { category: x.scTitle(sc) });
  const description = t("meta.description", { tagline: x.scTagline(sc) });
  const alternates = languageAlternates(`/india/category/${sc.slug}`, locale);
  return { title, description, alternates, openGraph: { title, description, url: alternates.canonical } };
}

export default async function IndiaSuperCategoryPage({ params }: PageProps) {
  const { locale, superCategorySlug } = await params;
  setRequestLocale(locale);

  const superCategory = getSuperCategoryBySlug(superCategorySlug);
  if (!superCategory) {
    notFound();
  }

  const [t, tp, ti, tm] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-category" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
    getTranslations({ locale, namespace: "page_india-module" }),
  ]);
  const x = indiaText(tp, ti);
  const categoryTitle = x.scTitle(superCategory);
  const hue = indiaSuperCategoryHue(superCategory.slug);

  const modules = getModulesForSuperCategory(superCategorySlug, INDIA_MODULES);
  // One count for the whole page (hero ring, simple-words line, footer note).
  const counts = {
    total: modules.length,
    live: modules.filter((m) => m.status === "live").length,
    soon: modules.filter((m) => m.status === "coming_soon" || m.status === "planned").length,
  };

  const indicatorsByModule = await getIndicatorsForModules(modules.map((m) => m.slug));
  const headlineOf = new Map<string, IndicatorRow | undefined>(
    modules.map((m) => [m.slug, pickHeadline(m.headlineMetric?.key, indicatorsByModule[m.slug] ?? [])]),
  );
  const metricLabel = (row: IndicatorRow) => {
    const k = `metric.${row.moduleSlug}.${row.metricKey}`;
    return tm.has(k) ? { text: tm(k) } : { text: row.metricLabel, lang: "en" as const };
  };

  // Hero figures: the first four live modules that have a published row.
  const heroFigures = modules
    .filter((m) => m.status === "live")
    .map((m) => ({ m, row: headlineOf.get(m.slug) }))
    .filter((e): e is { m: IndiaModuleDef; row: IndicatorRow } => Boolean(e.row && e.row.value !== null))
    .slice(0, 4)
    .map(({ m, row }) => {
      const l = metricLabel(row);
      return toFigure(row, { tp, locale, label: l.text, labelLang: l.lang, emoji: m.icon });
    });

  // One card per module, with every figure the sheet can show.
  const cardOf = (m: IndiaModuleDef): CategoryCard => {
    const row = headlineOf.get(m.slug);
    const f = row && row.value !== null ? formatIndicator(tp, locale, row.value, row.unit) : null;
    const rows = groupIndicators(indicatorsByModule[m.slug] ?? []).tiles.slice(0, SHEET_FIGURES);
    const seen = new Set<string>();
    return {
      slug: m.slug,
      href: `/${locale}/india/${m.slug}`,
      emoji: m.icon,
      title: x.moduleTitle(m),
      tagline: x.moduleTagline(m),
      description: x.moduleDescription(m),
      isLive: m.status === "live",
      statusLabel: x.statusShort(m.status),
      headline:
        row && f
          ? { value: f.value, unit: f.unit || undefined, caption: t("grid.figureLine", { label: metricLabel(row).text, date: fmtDate(locale, row.asOf) }) }
          : undefined,
      figures: rows.map((r) => {
        const l = metricLabel(r);
        return toFigure(r, { tp, locale, label: l.text, labelLang: l.lang, emoji: figureEmoji(r, m.icon) });
      }),
      sources: m.sources
        .map((s) => ({ src: INDIA_SOURCES[s.sourceKey], refresh: s.refresh }))
        .filter((s): s is { src: NonNullable<typeof s.src>; refresh: typeof s.refresh } => Boolean(s.src))
        .filter((s) => (seen.has(s.src.name) ? false : (seen.add(s.src.name), true)))
        .map((s) => ({
          name: s.src.name,
          url: s.src.url,
          refresh: tm.has(`sources.refresh.${s.refresh}`) ? tm(`sources.refresh.${s.refresh}`) : undefined,
        })),
    };
  };

  const groups = Array.from(getModulesGroupedBySubGroup(superCategorySlug, modules).entries());
  const onlyUngrouped = groups.length === 1 && groups[0][0] === "UNGROUPED";

  const simple =
    counts.live === counts.total
      ? t("explain.allLive", { category: categoryTitle, total: counts.total })
      : t("explain.body", { category: categoryTitle, total: counts.total, live: counts.live, soon: counts.soon });

  return (
    <main className={hue} style={{ minHeight: "100vh" }}>
      <PageFrame>
        <nav
          aria-label={t("crumbs.aria")}
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 12, flexWrap: "wrap" }}
        >
          <Link href={`/${locale}`} style={{ color: "inherit", display: "inline-flex", alignItems: "center", gap: 4, minHeight: 36, textDecoration: "none" }}>
            <Home size={14} aria-hidden /> {ti("breadcrumb.home")}
          </Link>
          <ChevronRight size={14} aria-hidden className="india-flip-rtl" style={{ color: "var(--ftp-border-strong)" }} />
          <Link href={`/${locale}/india`} style={{ color: "inherit", display: "inline-flex", alignItems: "center", minHeight: 36, textDecoration: "none" }}>
            {ti("breadcrumb.india")}
          </Link>
          <ChevronRight size={14} aria-hidden className="india-flip-rtl" style={{ color: "var(--ftp-border-strong)" }} />
          <span aria-current="page" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
            {categoryTitle}
          </span>
          <ChevronRight size={14} aria-hidden className="india-flip-rtl" style={{ color: "var(--ftp-border-strong)" }} />
          <ModuleDropdown currentLabel={ti("breadcrumb.selectModule")} scope="super-category" superCategorySlug={superCategorySlug} locale={locale} />
        </nav>

        {superCategorySlug === "governance" && <ElectionPeriodNotice />}

        <SuperCategoryHero
          glyph={indiaSuperCategoryGlyph(superCategory.slug).glyph}
          title={categoryTitle}
          tagline={x.scTagline(superCategory)}
          countLabel={t("hero.count", { n: counts.total })}
          counts={counts}
          ring={{
            label: t("hero.ringLabel", { live: counts.live, total: counts.total }),
            live: t("hero.ringLive"),
            legendLive: t("hero.legendLive"),
            legendSoon: t("hero.legendSoon"),
          }}
          figuresTitle={t("hero.figures")}
          figures={heroFigures}
          tapHint={t("hero.tapHint")}
          simple={simple}
          hueClassName={hue}
        />

        {groups.map(([groupLabel, mods], i) => (
          <Section
            key={groupLabel}
            title={onlyUngrouped ? t("grid.title") : groupLabel === "UNGROUPED" ? t("grid.other") : x.subGroup(groupLabel)}
            emoji={i === 0 ? superCategory.icon : undefined}
            action={
              i === 0 ? <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{t("grid.tapHint")}</span> : undefined
            }
          >
            <CategoryModuleCards cards={mods.map(cardOf)} hueClassName={hue} noFigureLabel={t("grid.noFigure")} />
          </Section>
        ))}

        {counts.soon > 0 && (
          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
              padding: "14px 16px",
              background: "var(--hue-tint)",
              border: "1px dashed color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
              borderRadius: "var(--ftp-radius-card)",
              fontSize: 14,
              lineHeight: "21px",
              color: "var(--ftp-text-2)",
            }}
          >
            <CategoryGlyph glyph="hardhat" hue="amber" size={24} />
            <div style={{ flex: "1 1 240px" }}>
              <strong style={{ display: "block", color: "var(--ftp-text)" }}>{t("soonNote.title", { n: counts.soon })}</strong>
              {t("soonNote.body")}
            </div>
            <Link
              href={`/${locale}/feedback`}
              className="ftp-btn ftp-btn-secondary"
              style={{
                alignSelf: "center",
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 999,
                border: "1px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
                background: "#fff",
                color: "var(--hue-deep)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {t("soonNote.cta")}
            </Link>
          </div>
        )}
        <style>{`[dir="rtl"] .india-flip-rtl { transform: scaleX(-1); }`}</style>
      </PageFrame>
    </main>
  );
}

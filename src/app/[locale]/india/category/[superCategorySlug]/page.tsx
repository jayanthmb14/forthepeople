/**
 * /[locale]/india/category/[superCategorySlug] — Level-2 super-category page.
 *
 * File 45 §4 Level 2, Design v4 + i18n (Sep 2026):
 *  - breadcrumb with a module picker scoped to the super-category
 *  - ElectionPeriodNotice (governance only, env-flag driven)
 *  - SuperCategoryHero: hue band, a live/coming-soon ring and up to three
 *    real headline figures
 *  - two columns: the sub-grouped left rail and the module cards
 *  - a "still being set up" note when some modules are not live
 *
 * One set of counts (live / coming soon / total) is computed here from the
 * registry and handed to the hero ring, the left rail and the footer note,
 * so they always agree. (The hero used to count only `planned` modules and
 * said "0 activating soon" while the footer, counting `coming_soon` too,
 * said 7.) Figures come from IndiaIndicator only — no placeholder values.
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
} from "@/lib/india/india-super-categories";
import { INDIA_MODULES } from "@/lib/india/india-modules";
import { routing } from "@/i18n/routing";
import { languageAlternates } from "@/i18n/seo";
import { Section } from "@/components/district/ui";
import { ModuleDropdown } from "@/components/india/primitives/ModuleDropdown";
import { ModulePreviewCard } from "@/components/india/primitives/ModulePreviewCard";
import { SuperCategoryHero } from "@/components/india/sections/SuperCategoryHero";
import { SubGroupedLeftRail } from "@/components/india/sections/SubGroupedLeftRail";
import { ElectionPeriodNotice } from "@/components/india/sections/ElectionPeriodNotice";
import type { HeroTile } from "@/components/india/module-page/ModuleHero";
import { indiaSuperCategoryHue } from "@/components/india/module-page/v4";
import { getIndicatorsForModules, pickHeadline, type IndicatorRow } from "@/components/india/module-page/data";
import { INDIA_NS, indiaText } from "@/components/india/i18n";
import { fmtDate, formatIndicator } from "@/components/india/format";

interface PageProps {
  params: Promise<{
    locale: string;
    superCategorySlug: string;
  }>;
}

export const revalidate = 900; // 15 min ISR

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

  const modules = getModulesForSuperCategory(superCategorySlug, INDIA_MODULES);
  // One count for the whole page (hero ring, left rail, footer note).
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
    return tm.has(k) ? tm(k) : row.metricLabel;
  };

  // Hero figures: the first three live modules that have a published row.
  const heroTiles: HeroTile[] = modules
    .filter((m) => m.status === "live")
    .map((m) => ({ m, row: headlineOf.get(m.slug) }))
    .filter((e): e is { m: (typeof modules)[number]; row: IndicatorRow } => Boolean(e.row && e.row.value !== null))
    .slice(0, 3)
    .map(({ m, row }) => {
      const f = formatIndicator(tp, locale, row.value ?? 0, row.unit);
      return {
        key: row.moduleSlug,
        label: metricLabel(row),
        value: f.value,
        unit: f.unit,
        emoji: m.icon,
        asOf: row.asOf,
        source: { label: row.source, href: row.sourceUrl || undefined },
      };
    });

  return (
    <main className={indiaSuperCategoryHue(superCategory.slug)} style={{ minHeight: "100vh", padding: "1.25rem 0 4rem" }}>
      {/* Side gutter matches .ftp-container (24 px, 16 px on phones); width stays with the India layout. */}
      <div className="ftp-container" style={{ maxWidth: "none", width: "100%" }}>
        <nav
          aria-label={t("crumbs.aria")}
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 12, flexWrap: "wrap" }}
        >
          <Link href={`/${locale}`} style={{ color: "inherit", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <Home size={14} aria-hidden /> {ti("breadcrumb.home")}
          </Link>
          <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <Link href={`/${locale}/india`} style={{ color: "inherit", textDecoration: "none" }}>
            {ti("breadcrumb.india")}
          </Link>
          <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <span aria-current="page" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
            {categoryTitle}
          </span>
          <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <ModuleDropdown currentLabel={ti("breadcrumb.selectModule")} scope="super-category" superCategorySlug={superCategorySlug} locale={locale} />
        </nav>

        {superCategorySlug === "governance" && <ElectionPeriodNotice />}

        <SuperCategoryHero
          emoji={superCategory.icon}
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
          tiles={heroTiles}
        />

        <div className="super-cat-layout">
          <SubGroupedLeftRail
            superCategorySlug={superCategorySlug}
            modules={modules}
            locale={locale}
            summary={t("rail.summary", { total: counts.total, live: counts.live, soon: counts.soon })}
            ariaLabel={t("rail.aria", { category: categoryTitle })}
          />

          <div style={{ minWidth: 0 }}>
            <Section title={t("grid.title")} emoji={superCategory.icon}>
              <ul className="super-cat-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {modules.map((m) => {
                  const row = headlineOf.get(m.slug);
                  const f = row && row.value !== null ? formatIndicator(tp, locale, row.value, row.unit) : null;
                  return (
                    <li key={m.slug}>
                      <ModulePreviewCard
                        href={`/${locale}/india/${m.slug}`}
                        emoji={m.icon}
                        title={x.moduleTitle(m)}
                        tagline={x.moduleTagline(m)}
                        isLive={m.status === "live"}
                        statusLabel={x.statusShort(m.status)}
                        figure={
                          row && f
                            ? { value: f.value, unit: f.unit, caption: t("grid.figureLine", { label: metricLabel(row), date: fmtDate(locale, row.asOf) }) }
                            : undefined
                        }
                        noFigureLabel={t("grid.noFigure")}
                      />
                    </li>
                  );
                })}
              </ul>
            </Section>

            {counts.soon > 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
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
                <span className="ftp-emoji" aria-hidden style={{ fontSize: 22 }}>
                  🚧
                </span>
                <div style={{ flex: "1 1 240px" }}>
                  <strong style={{ display: "block", color: "var(--ftp-text)" }}>{t("soonNote.title", { n: counts.soon })}</strong>
                  {t("soonNote.body")}
                </div>
                <Link
                  href={`/${locale}/feedback`}
                  className="ftp-btn ftp-btn-secondary"
                  style={{
                    alignSelf: "center",
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
                    background: "#fff",
                    color: "var(--hue-deep)",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  {t("soonNote.cta")}
                </Link>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .super-cat-layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 24px; align-items: start; }
          .super-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 14px; }
          @media (max-width: 900px) {
            .super-cat-layout { grid-template-columns: minmax(0, 1fr); }
          }
        `}</style>
      </div>
    </main>
  );
}

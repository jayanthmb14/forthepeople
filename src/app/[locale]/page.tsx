/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Home page — Design v5 "calm".
 *
 * The disclaimer line, header and footer come from [locale]/layout.tsx.
 * This page renders, top to bottom:
 *
 *   1. HomeHero           — kicker, the ONE <h1> (a task), sources line,
 *                           district search, "Explore all of India"
 *                           (primary) and "Use my location", one stats
 *                           line; the India map on the right (tablet, PC)
 *   2. LiveDistrictsCard  — the live districts as equal cards + a small
 *                           "Is your district next?" card
 *   3. IndiaGlance        — "India at a glance": headline national
 *                           figures, each with source and date
 *   4. PricesToday        — gold, silver, Sensex, Nifty, US dollar
 *   5. SupportLine        — one quiet line
 *
 * Numbers: district and state counts come from the registry
 * (getPlatformFacts), national figures from IndiaIndicator rows. Nothing
 * is typed by hand; a missing row simply leaves its figure out.
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import { routing } from "@/i18n/routing";
import { getPlatformFacts } from "@/lib/platform-facts";

import PriceTicker from "@/components/home/PriceTicker";
import { loadCropTicks, loadMarketFigures } from "@/components/home/home-data";
import HomeHero from "@/components/home/HomeHero";
import LiveDistrictsCard from "@/components/home/LiveDistrictsCard";
import IndiaGlance, { type GlanceFigure } from "@/components/home/IndiaGlance";
import PricesToday from "@/components/home/PricesToday";
import SupportLine from "@/components/home/SupportLine";
import styles from "@/components/home/home.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

// District rows and national figures change rarely; refresh hourly.
export const revalidate = 3600;

/** The IndiaIndicator rows behind "India at a glance". */
const GLANCE_ROWS = [
  { moduleSlug: "demographics-population", metricKey: "population_total" },
  { moduleSlug: "economy-gdp", metricKey: "gdp_nominal_usd_trillion" },
  { moduleSlug: "budget-union", metricKey: "total_outlay_inr_lakh_crore" },
  { moduleSlug: "national-snapshot", metricKey: "states_count" },
  { moduleSlug: "national-snapshot", metricKey: "uts_count" },
] as const;

type IndicatorRow = {
  moduleSlug: string;
  metricKey: string;
  numericValue: unknown;
  source: string;
  sourceUrl: string;
  asOfDate: Date;
};

/** Up to four headline figures, in a fixed order, from whatever rows exist. */
async function loadGlanceFigures(): Promise<GlanceFigure[]> {
  let rows: IndicatorRow[] = [];
  try {
    rows = await prisma.indiaIndicator.findMany({
      where: { OR: GLANCE_ROWS.map((r) => ({ moduleSlug: r.moduleSlug, metricKey: r.metricKey })) },
      select: { moduleSlug: true, metricKey: true, numericValue: true, source: true, sourceUrl: true, asOfDate: true },
    });
  } catch {
    return []; // the band still shows its text and the India link
  }
  const get = (metricKey: string) => {
    const r = rows.find((x) => x.metricKey === metricKey);
    const value = r && r.numericValue != null ? Number(r.numericValue) : NaN;
    return r && Number.isFinite(value) ? { ...r, value } : null;
  };
  const link = (url: string | null | undefined) => (url && url.startsWith("https://") ? url : null);

  const out: GlanceFigure[] = [];
  const pop = get("population_total");
  if (pop) {
    out.push({
      labelKey: "figPopulation",
      valueKey: "figPopulationValue",
      values: { n: Math.round(pop.value / 1e7) / 100 }, // people → billions, 2 decimals
      source: pop.source,
      sourceUrl: link(pop.sourceUrl),
      asOf: pop.asOfDate.toISOString(),
    });
  }
  const gdp = get("gdp_nominal_usd_trillion");
  if (gdp) {
    out.push({ labelKey: "figGdp", valueKey: "figGdpValue", values: { n: gdp.value }, source: gdp.source, sourceUrl: link(gdp.sourceUrl), asOf: gdp.asOfDate.toISOString() });
  }
  const budget = get("total_outlay_inr_lakh_crore");
  if (budget) {
    out.push({ labelKey: "figBudget", valueKey: "figBudgetValue", values: { n: budget.value }, source: budget.source, sourceUrl: link(budget.sourceUrl), asOf: budget.asOfDate.toISOString() });
  }
  const states = get("states_count");
  const uts = get("uts_count");
  if (states && uts) {
    out.push({
      labelKey: "figStates",
      valueKey: "figStatesValue",
      values: { a: states.value, b: uts.value },
      source: states.source,
      sourceUrl: link(states.sourceUrl),
      asOf: (states.asOfDate > uts.asOfDate ? states.asOfDate : uts.asOfDate).toISOString(),
    });
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}`;
  // English keeps the root layout's title and description (unchanged SEO).
  // Other languages get them from their messages (docs/I18N.md §5), e.g.
  // "ForThePeople.in — आपका जिला। आपका डेटा। आपका अधिकार।" on /hi.
  if (locale !== routing.defaultLocale) {
    const ts = await getTranslations({ locale, namespace: "site" });
    const ti = await getTranslations({ locale, namespace: "intro" });
    const title = `${ts("name")} — ${ts("tagline")}`;
    const description = ti("sub");
    return {
      title: { absolute: title },
      description,
      alternates: languageAlternates("", locale),
      openGraph: { url, title, description },
    };
  }
  return {
    alternates: languageAlternates("", locale),
    openGraph: { url },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Static rendering with translations: the page names its locale.
  setRequestLocale(locale);

  const [activeRows, glance, markets] = await Promise.all([
    prisma.district.findMany({
      where: { active: true },
      select: {
        id: true,
        population: true,
        slug: true,
        name: true,
        nameLocal: true,
        tagline: true,
        goLiveDate: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    loadGlanceFigures(),
    loadMarketFigures(),
  ]);
  const liveRows = activeRows.map((d) => ({ id: d.id, slug: d.slug, stateSlug: d.state.slug, population: d.population }));
  const crops = await loadCropTicks(liveRows);

  const activeDistricts = activeRows.map((d) => ({
    slug: d.slug,
    name: d.name,
    nameLocal: d.nameLocal,
    tagline: d.tagline,
    stateSlug: d.state.slug,
    stateName: d.state.name,
    goLiveDate: d.goLiveDate ? d.goLiveDate.toISOString() : null,
  }));

  // Counts from the registry (the same flags the rest of the site uses).
  const facts = getPlatformFacts();

  return (
    <main role="main" className={styles.home}>
      <PriceTicker locale={locale} markets={markets} crops={crops} />
      <div className={styles.heroBand}>
        <div className="ftp-container">
          <HomeHero
            locale={locale}
            activeDistricts={facts.activeDistricts}
            activeStates={facts.activeStates}
            modulesPerDistrict={facts.modulesPerDistrict}
          />
        </div>
      </div>

      <LiveDistrictsCard locale={locale} districts={activeDistricts} />
      <IndiaGlance locale={locale} figures={glance} />
      <PricesToday />
      <SupportLine locale={locale} />
    </main>
  );
}

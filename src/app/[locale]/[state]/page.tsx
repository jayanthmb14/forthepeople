/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  State page — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════
//
//  1. SiteHeader band: state name + local-script name, live / coming pills.
//  2. StatStrip of emoji tiles: live districts, coming, and population
//     (Census 2011 rows) and area covered by the live districts (summed
//     from the registry — we do not have state-wide census figures in the
//     registry, so we only show what we can add up honestly, and label it).
//  3. The pictures, side by side:
//       • one symbol per district, the live ones lit;
//       • a ring of the live districts' people, one slice per district in
//         that district's own colour (only when two or more live districts
//         have a population on record).
//  4. District grid: live districts as colourful cards, each in its own
//     district hue (name, script, tagline, health grade, 2 numbers, a New
//     pill for the first 30 days), then the not-live districts as compact
//     slate cards with a "Coming soon" pill.
//  5. Map, "Vote for the next district" list, and supporters.
//
//  Every count is derived from the registry (src/lib/constants/districts.ts)
//  — never typed by hand. All text comes from the "page_state" messages;
//  state names from "states", taglines from "placeLabels", the taluk word
//  from "subUnits". District names are proper nouns and stay as stored.

export const revalidate = 300; // ISR: the New pills depend on go-live dates

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock, Lock, MapPin } from "lucide-react";
import { getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { prisma } from "@/lib/db";
import { HUE_HEX, getDistrictHue } from "@/lib/design/hues";
import { intlLocale } from "@/i18n/languages";
import { languageAlternates } from "@/i18n/seo";
import { scriptLang } from "@/lib/utils/script-lang";
import StateMapSection from "@/components/map/StateMapSection";
import StateSponsorSection from "@/components/common/StateSponsorSection";
import StateVoteList from "@/components/district/StateVoteList";
import { HealthScoreRing } from "@/components/district/DistrictHealthScoreCard";
import { getDistrictIcon } from "@/components/district/icons";
import { Card, EmptyState, Pill, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { Donut, type DonutSlice } from "@/components/site/SiteVisuals";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

/** A district counts as New for this many days after it goes live. */
const NEW_WINDOW_DAYS = 30;

/** Above this many districts the picture switches from "one symbol each" to "out of 10". */
const MAX_SYMBOLS = 40;

/** The people ring shows at most this many slices; the rest share one "other" slice. */
const MAX_SLICES = 6;

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, state } = await params;
  const stateData = getState(state);
  if (!stateData) return {};
  const [t, tStates] = await Promise.all([
    getTranslations({ locale, namespace: "page_state" }),
    getTranslations({ locale, namespace: "states" }),
  ]);
  const name = tStates.has(state) ? tStates(state) : stateData.name;
  return {
    title: t("metaTitle", { state: name }),
    description: t("metaDescription", { state: name, n: stateData.districts.length }),
    alternates: languageAlternates(`/${state}`, locale),
    openGraph: { url: `${BASE_URL}/${locale}/${state}` },
  };
}

/**
 * Go-live dates of this state's live districts, from the database.
 * Returns an empty map if the database is unreachable — the page then
 * simply shows no New pills rather than failing.
 */
async function getGoLiveDates(stateSlug: string): Promise<Map<string, Date>> {
  try {
    const rows = await prisma.district.findMany({
      where: { active: true, state: { slug: stateSlug } },
      select: { slug: true, goLiveDate: true },
    });
    return new Map(rows.filter((r) => r.goLiveDate).map((r) => [r.slug, r.goLiveDate as Date]));
  } catch {
    return new Map();
  }
}

/**
 * Census 2011 population per live district, from the sourced
 * DemographicProfile rows. The static registry mixes census counts with
 * later estimates, so it cannot be labelled "Census 2011". Empty map when
 * the database is unreachable.
 */
async function getCensusPopulation(stateSlug: string): Promise<Map<string, number>> {
  try {
    const rows = await prisma.demographicProfile.findMany({
      where: {
        dataset: "Census 2011",
        district: { active: true, state: { slug: stateSlug } },
        totalPopulation: { not: null },
      },
      select: { totalPopulation: true, district: { select: { slug: true } } },
    });
    return new Map(
      rows
        .filter((r) => r.district && r.totalPopulation)
        .map((r) => [r.district!.slug, r.totalPopulation as number]),
    );
  } catch {
    return new Map();
  }
}

/** Small "label / number" pair inside a district card. */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ftp-text-2)" }}>{label}</dt>
      <dd className="ftp-bignum" style={{ margin: 0, fontSize: 18, lineHeight: "24px", color: "var(--hue-deep)" }}>
        {value}
      </dd>
    </div>
  );
}

export default async function StatePage({ params }: Props) {
  const { locale, state: stateSlug } = await params;
  setRequestLocale(locale);
  const stateData = getState(stateSlug);
  if (!stateData) notFound();

  const [t, tStates, tLabels, tSub] = await Promise.all([
    getTranslations({ locale, namespace: "page_state" }),
    getTranslations({ locale, namespace: "states" }),
    getTranslations({ locale, namespace: "placeLabels" }),
    getTranslations({ locale, namespace: "subUnits" }),
  ]);
  const nf = new Intl.NumberFormat(intlLocale(locale));
  const fmt = (n: number) => nf.format(n);
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  const stateName = tStates.has(stateSlug) ? tStates(stateSlug) : stateData.name;
  const tagline = (text: string) => (tLabels.has(text) ? tLabels(text) : text);

  const live = stateData.districts.filter((d) => d.active);
  const coming = stateData.districts.filter((d) => !d.active);
  const totalDistricts = stateData.districts.length;
  const subUnitEn = getStateConfig(stateSlug)?.subDistrictUnitPlural ?? "Taluks";
  const subUnitLabel = tSub.has(subUnitEn) ? tSub(subUnitEn) : subUnitEn;

  // Totals across the LIVE districts only (what we can add up). Population
  // uses the sourced Census 2011 rows when EVERY live district has one;
  // otherwise it falls back to the registry and says "estimate".
  const censusPop = await getCensusPopulation(stateSlug);
  const allCensus = live.length > 0 && live.every((d) => censusPop.has(d.slug));
  const popOf = (d: { slug: string; population?: number }) =>
    allCensus ? censusPop.get(d.slug) ?? 0 : d.population ?? 0;
  const livePopulation = live.reduce((s, d) => s + popOf(d), 0);
  const liveArea = live.reduce((s, d) => s + (d.area ?? 0), 0);
  const censusSource = { label: t("censusOfIndia"), href: "https://censusindia.gov.in/" };

  const goLive = await getGoLiveDates(stateSlug);
  // Server render: one clock read per request (ISR regenerates every 5 min).
  const renderedAt = new Date().getTime();
  const isNew = (slug: string) => {
    const d = goLive.get(slug);
    return d ? renderedAt - d.getTime() <= NEW_WINDOW_DAYS * 86_400_000 : false;
  };

  // Picture 1: one symbol per district when they fit, otherwise "out of 10".
  const oneEach = totalDistricts <= MAX_SYMBOLS;
  const pictoFilled = oneEach ? live.length : totalDistricts > 0 ? (live.length / totalDistricts) * 10 : 0;
  const pictoLabel = oneEach
    ? t("pictoOneEach", { live: live.length, total: totalDistricts, state: stateName })
    : t("pictoOutOf10", { n: Math.round(pictoFilled), state: stateName });

  // Picture 2: the live districts' people as a ring — one slice per district
  // in its own colour. Needs two or more districts with a population.
  const withPop = live
    .map((d) => ({ d, pop: popOf(d) }))
    .filter((x) => x.pop > 0)
    .sort((a, b2) => b2.pop - a.pop);
  const popTotal = withPop.reduce((s, x) => s + x.pop, 0);
  const pct = (n: number) => (popTotal > 0 ? Math.round((n / popTotal) * 100) : 0);
  const slices: DonutSlice[] = withPop.slice(0, MAX_SLICES).map(({ d, pop }) => ({
    key: d.slug,
    label: d.name,
    value: pop,
    display: `${pct(pop)}%`,
    color: HUE_HEX[getDistrictHue(d.slug)].hue,
    sub: fmt(pop),
  }));
  const rest = withPop.slice(MAX_SLICES);
  if (rest.length > 0) {
    const restPop = rest.reduce((s, x) => s + x.pop, 0);
    slices.push({ key: "other", label: t("popOther"), value: restPop, display: `${pct(restPop)}%`, color: "var(--ftp-text-2)", sub: fmt(restPop) });
  }
  const showPeopleRing = withPop.length >= 2;
  const biggest = withPop[0];

  const pictogramCard = totalDistricts > 0 && (
    <Card tinted padding={18}>
      <Explainer emoji="🧭">
        {live.length === 0
          ? t.rich("simpleNone", { total: totalDistricts, state: stateName, b })
          : t.rich("simpleSome", { live: live.length, total: totalDistricts, coming: coming.length, state: stateName, b })}
      </Explainer>
      <Pictogram
        filled={pictoFilled}
        total={oneEach ? totalDistricts : 10}
        emoji="🏙️"
        size={oneEach && totalDistricts > 12 ? 18 : 26}
        label={pictoLabel}
      />
    </Card>
  );

  return (
    <main className="ftp-hue-blue" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px - 32px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* ═══ 1. Header ═══ */}
        <SiteHeader
          emoji="🗺️"
          icon={MapPin}
          chip={stateData.type === "ut" ? t("chipUt") : t("chipState")}
          title={stateName}
          titleLocal={stateData.nameLocal && stateData.nameLocal !== stateName ? stateData.nameLocal : null}
          description={
            stateData.active
              ? t("descActive")
              : t.rich("descComing", {
                  state: stateName,
                  link: (c) => (
                    <Link href={`/${locale}/support`} style={{ color: "#fff", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
                      {c}
                    </Link>
                  ),
                })
          }
          backHref={`/${locale}`}
          backLabel={t("backIndia")}
        >
          {/* Icons go in as children, not via the `icon` prop: this is a
              server component and a component function cannot be passed
              as a prop to the (client) kit Pill. */}
          <Pill tone="live">
            <CheckCircle2 size={12} aria-hidden />
            <span className="ftp-num">{t("pillLive", { n: live.length })}</span>
          </Pill>
          <Pill tone="neutral">
            <Clock size={12} aria-hidden />
            <span className="ftp-num">{t("pillComing", { n: coming.length })}</span>
          </Pill>
          {stateData.capital && <Pill tone="neutral">{t("pillCapital", { capital: stateData.capital })}</Pill>}
        </SiteHeader>

        {/* ═══ 2. Numbers ═══ */}
        <StatStrip cols={4}>
          <StatTile emoji="🏙️" label={t("tileLive")} value={live.length} />
          <StatTile emoji="⏳" label={t("tileComing")} value={coming.length} sub={t("tileComingSub", { total: totalDistricts })} />
          <StatTile
            emoji="👥"
            label={t("tilePopulation")}
            value={livePopulation > 0 ? fmt(livePopulation) : "—"}
            sub={allCensus ? t("liveOnly") : t("liveOnlyEstimate")}
            asOfPeriod={allCensus && livePopulation > 0 ? t("census2011") : undefined}
            source={allCensus && livePopulation > 0 ? censusSource : undefined}
          />
          <StatTile
            emoji="📐"
            label={t("tileArea")}
            value={liveArea > 0 ? fmt(liveArea) : "—"}
            unit={liveArea > 0 ? t("unitKm2") : undefined}
            sub={t("liveOnly")}
          />
        </StatStrip>

        {/* ═══ 3. The pictures — straight from the registry / census rows ═══ */}
        {pictogramCard && (
          <div className={showPeopleRing ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
            {pictogramCard}
            {showPeopleRing && biggest && (
              <ChartCard
                title={t("popTitle")}
                emoji="👥"
                units={allCensus ? t("popUnits") : t("popUnitsEstimate")}
                simple={t.rich("popSimple", { name: biggest.d.name, pct: pct(biggest.pop), state: stateName, b })}
                source={allCensus ? censusSource : undefined}
                asOfPeriod={allCensus ? t("census2011") : undefined}
                table={slices.map((s) => ({ label: s.label, value: `${s.sub} (${s.display})` }))}
              >
                <Donut
                  slices={slices}
                  label={t("popAria", { state: stateName })}
                  center={`${pct(biggest.pop)}%`}
                  centerSub={biggest.d.name}
                />
              </ChartCard>
            )}
          </div>
        )}

        {/* ═══ 4a. Live districts ═══ */}
        <Section title={t("sectionLive")} emoji="🏙️">
          {live.length === 0 ? (
            <EmptyState
              emoji="🗳️"
              title={t("emptyLiveTitle", { state: stateName })}
              body={t("emptyLiveBody")}
            />
          ) : (
            <ul
              style={{
                listStyle: "none", margin: 0, padding: 0,
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 12,
              }}
            >
              {live.map((d) => {
                const Landmark = getDistrictIcon(d.slug);
                return (
                  <li key={d.slug} className={`ftp-hue-${getDistrictHue(d.slug)}`}>
                    <Card tinted href={`/${locale}/${stateSlug}/${d.slug}`} padding={16} style={{ height: "100%" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <span className="ftp-icon-chip" aria-hidden style={{ width: 44, height: 44, borderRadius: 14 }}>
                          {Landmark ? <Landmark size={28} /> : <span className="ftp-emoji" style={{ fontSize: 22 }}>📍</span>}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                            <h3 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
                              {d.name}
                            </h3>
                            {d.nameLocal && d.nameLocal !== d.name && (
                              <span lang={scriptLang(d.nameLocal) ?? "und"} style={{ fontSize: 13, color: "var(--hue-deep)" }}>{d.nameLocal}</span>
                            )}
                          </div>
                          {d.tagline && <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>{tagline(d.tagline)}</p>}
                          <div style={{ marginTop: 8 }}>
                            {isNew(d.slug) ? <Pill tone="brand">{t("pillNew")}</Pill> : <Pill tone="live" dot>{t("pillLive1")}</Pill>}
                          </div>
                        </div>
                        <HealthScoreRing districtSlug={d.slug} size={44} compact />
                      </div>
                      <dl style={{ display: "flex", gap: 24, margin: "14px 0 0", flexWrap: "wrap" }}>
                        <MiniStat label={t("miniPopulation")} value={popOf(d) > 0 ? fmt(popOf(d)) : "—"} />
                        <MiniStat label={subUnitLabel} value={d.talukCount ?? (d.taluks.length || "—")} />
                      </dl>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* ═══ 4b. Coming districts (compact, quiet slate) ═══ */}
        {coming.length > 0 && (
          <Section title={t("sectionComing")} emoji="⏳">
            <ul
              className="ftp-hue-slate"
              style={{
                listStyle: "none", margin: 0, padding: 0,
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 8,
              }}
            >
              {coming.map((d) => (
                <li key={d.slug}>
                  <Card href={`/${locale}/${stateSlug}/${d.slug}`} padding={12} style={{ minHeight: 44 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{d.name}</span>
                        {d.nameLocal && d.nameLocal !== d.name && (
                          <span lang={scriptLang(d.nameLocal) ?? "und"} style={{ display: "block", fontSize: 12, lineHeight: 1.4, color: "var(--ftp-text-2)" }}>{d.nameLocal}</span>
                        )}
                      </span>
                      <Pill tone="neutral"><Lock size={12} aria-hidden />{t("pillSoon")}</Pill>
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ═══ 5a. Map ═══ */}
        <Section title={t("sectionMap")} emoji="🗺️">
          <Card padding={0} style={{ overflow: "hidden" }}>
            <StateMapSection locale={locale} stateSlug={stateSlug} activeDistrictSlugs={live.map((d) => d.slug)} />
          </Card>
        </Section>

        {/* ═══ 5b. Vote list (the vote colour from the home page) ═══ */}
        {coming.length > 0 && (
          <div className="ftp-hue-yellow">
            <Section title={t("sectionVote")} emoji="🗳️">
              <StateVoteList
                locale={locale}
                stateSlug={stateSlug}
                stateName={stateData.name}
                lockedDistricts={coming.map((d) => ({ name: d.name, slug: d.slug }))}
              />
            </Section>
          </div>
        )}

        {/* ═══ 5c. Supporters (the support colour) ═══ */}
        <div className="ftp-hue-rose" style={{ marginTop: 32 }}>
          <StateSponsorSection locale={locale} stateSlug={stateSlug} stateName={stateData.name} />
        </div>
      </div>
    </main>
  );
}

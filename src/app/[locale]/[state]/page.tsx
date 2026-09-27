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
//  3. The picture: one symbol per district, the live ones lit.
//  4. District grid: live districts as colourful cards, each in its own
//     district hue (name, script, tagline, health grade, 2 numbers, a New
//     pill for the first 30 days), then the not-live districts as compact
//     slate cards with a "Coming soon" pill.
//  5. Map, "Vote for the next district" list, and supporters.
//
//  Every count is derived from the registry (src/lib/constants/districts.ts)
//  — never typed by hand.

export const revalidate = 300; // ISR: the New pills depend on go-live dates

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Lock, MapPin } from "lucide-react";
import { getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { prisma } from "@/lib/db";
import { getDistrictHue } from "@/lib/design/hues";
import StateMapSection from "@/components/map/StateMapSection";
import StateSponsorSection from "@/components/common/StateSponsorSection";
import StateVoteList from "@/components/district/StateVoteList";
import { HealthScoreRing } from "@/components/district/DistrictHealthScoreCard";
import { getDistrictIcon } from "@/components/district/icons";
import { Card, EmptyState, Pill, Section, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

/** A district counts as New for this many days after it goes live. */
const NEW_WINDOW_DAYS = 30;

/** Above this many districts the picture switches from "one symbol each" to "out of 10". */
const MAX_SYMBOLS = 40;

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateData = getState(state);
  if (!stateData) return {};
  return {
    title: `${stateData.name} Districts — Government Data | ForThePeople.in`,
    description: `Explore all ${stateData.districts.length} districts in ${stateData.name}. Free district-level government data: crop prices, water levels, schemes, budgets, and more.`,
    alternates: { canonical: `${BASE_URL}/en/${state}` },
    openGraph: { url: `${BASE_URL}/en/${state}` },
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
      <dt style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</dt>
      <dd className="ftp-bignum" style={{ margin: 0, fontSize: 18, lineHeight: "24px", color: "var(--hue-deep)" }}>
        {value}
      </dd>
    </div>
  );
}

export default async function StatePage({ params }: Props) {
  const { locale, state: stateSlug } = await params;
  const stateData = getState(stateSlug);
  if (!stateData) notFound();

  const live = stateData.districts.filter((d) => d.active);
  const coming = stateData.districts.filter((d) => !d.active);
  const totalDistricts = stateData.districts.length;
  const subUnitLabel = getStateConfig(stateSlug)?.subDistrictUnitPlural ?? "Taluks";

  // Totals across the LIVE districts only (what we can add up). Population
  // uses the sourced Census 2011 rows when EVERY live district has one;
  // otherwise it falls back to the registry and says "estimate".
  const censusPop = await getCensusPopulation(stateSlug);
  const allCensus = live.length > 0 && live.every((d) => censusPop.has(d.slug));
  const popOf = (d: { slug: string; population?: number }) =>
    allCensus ? censusPop.get(d.slug) ?? 0 : d.population ?? 0;
  const livePopulation = live.reduce((s, d) => s + popOf(d), 0);
  const liveArea = live.reduce((s, d) => s + (d.area ?? 0), 0);

  const goLive = await getGoLiveDates(stateSlug);
  // Server render: one clock read per request (ISR regenerates every 5 min).
  const renderedAt = new Date().getTime();
  const isNew = (slug: string) => {
    const d = goLive.get(slug);
    return d ? renderedAt - d.getTime() <= NEW_WINDOW_DAYS * 86_400_000 : false;
  };

  // The picture: one symbol per district when they fit, otherwise "out of 10".
  const oneEach = totalDistricts <= MAX_SYMBOLS;
  const pictoFilled = oneEach ? live.length : totalDistricts > 0 ? (live.length / totalDistricts) * 10 : 0;
  const pictoLabel = oneEach
    ? `${live.length} of ${totalDistricts} districts in ${stateData.name} ${live.length === 1 ? "is" : "are"} live.`
    : `About ${Math.round(pictoFilled)} of every 10 districts in ${stateData.name} are live.`;

  return (
    <main className="ftp-hue-blue" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px - 32px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* ═══ 1. Header ═══ */}
        <SiteHeader
          emoji="🗺️"
          icon={MapPin}
          chip={stateData.type === "ut" ? "Union territory" : "State"}
          title={stateData.name}
          titleLocal={stateData.nameLocal && stateData.nameLocal !== stateData.name ? stateData.nameLocal : null}
          description={
            stateData.active ? (
              "Pick a district to see its budget, crop prices, water levels, schools and more."
            ) : (
              <>
                This state is coming soon to ForThePeople.in. District data is being prepared. You can{" "}
                <Link href={`/${locale}/support`} style={{ color: "#fff", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
                  sponsor a district
                </Link>{" "}
                to help us launch faster.
              </>
            )
          }
          backHref={`/${locale}`}
          backLabel="India"
        >
          {/* Icons go in as children, not via the `icon` prop: this is a
              server component and a component function cannot be passed
              as a prop to the (client) kit Pill. */}
          <Pill tone="live">
            <CheckCircle2 size={12} aria-hidden />
            <span><span className="ftp-num">{live.length}</span>&nbsp;live</span>
          </Pill>
          <Pill tone="neutral">
            <Clock size={12} aria-hidden />
            <span><span className="ftp-num">{coming.length}</span>&nbsp;coming</span>
          </Pill>
          {stateData.capital && <Pill tone="neutral">Capital: {stateData.capital}</Pill>}
        </SiteHeader>

        {/* ═══ 2. Numbers ═══ */}
        <StatStrip cols={4}>
          <StatTile emoji="🏙️" label="Districts live" value={live.length} />
          <StatTile emoji="⏳" label="Coming soon" value={coming.length} sub={`of ${totalDistricts} districts`} />
          <StatTile
            emoji="👥"
            label="Population covered"
            value={livePopulation > 0 ? livePopulation.toLocaleString("en-IN") : "—"}
            sub={allCensus ? "Live districts only" : "Live districts only, latest available estimate"}
            asOfPeriod={allCensus && livePopulation > 0 ? "Census 2011" : undefined}
            source={allCensus && livePopulation > 0 ? { label: "Census of India", href: "https://censusindia.gov.in/" } : undefined}
          />
          <StatTile
            emoji="📐"
            label="Area covered"
            value={liveArea > 0 ? liveArea.toLocaleString("en-IN") : "—"}
            unit={liveArea > 0 ? "km²" : undefined}
            sub="Live districts only"
          />
        </StatStrip>

        {/* ═══ 3. The picture — straight from the registry counts ═══ */}
        {totalDistricts > 0 && (
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer title="In simple words" emoji="🧭">
              {live.length === 0 ? (
                <>
                  None of the <strong>{totalDistricts}</strong> districts in {stateData.name} is live yet. The ones people vote
                  for most go live first.
                </>
              ) : (
                <>
                  <strong>{live.length}</strong> of the <strong>{totalDistricts}</strong> districts in {stateData.name}{" "}
                  {live.length === 1 ? "is" : "are"} live on ForThePeople.in. The other <strong>{coming.length}</strong>{" "}
                  {coming.length === 1 ? "is" : "are"} waiting for votes.
                </>
              )}
            </Explainer>
            <Pictogram
              filled={pictoFilled}
              total={oneEach ? totalDistricts : 10}
              emoji="🏙️"
              size={oneEach && totalDistricts > 12 ? 18 : 26}
              label={pictoLabel}
            />
          </Card>
        )}

        {/* ═══ 4a. Live districts ═══ */}
        <Section title="Live districts" emoji="🏙️">
          {live.length === 0 ? (
            <EmptyState
              emoji="🗳️"
              title={`No ${stateData.name} district is live yet.`}
              body="Vote for the district you want first — the most-requested ones launch first."
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
                              <span lang="und" style={{ fontSize: 13, color: "var(--hue-deep)" }}>{d.nameLocal}</span>
                            )}
                          </div>
                          {d.tagline && <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>{d.tagline}</p>}
                          <div style={{ marginTop: 8 }}>
                            {isNew(d.slug) ? <Pill tone="brand">New</Pill> : <Pill tone="live" dot>Live</Pill>}
                          </div>
                        </div>
                        <HealthScoreRing districtSlug={d.slug} size={44} compact />
                      </div>
                      <dl style={{ display: "flex", gap: 24, margin: "14px 0 0", flexWrap: "wrap" }}>
                        <MiniStat label="Population" value={popOf(d) > 0 ? popOf(d).toLocaleString("en-IN") : "—"} />
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
          <Section title="Coming soon" emoji="⏳">
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
                          <span lang="und" style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{d.nameLocal}</span>
                        )}
                      </span>
                      <Pill tone="neutral"><Lock size={12} aria-hidden />Coming soon</Pill>
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ═══ 5a. Map ═══ */}
        <Section title="Map" emoji="🗺️">
          <Card padding={0} style={{ overflow: "hidden" }}>
            <StateMapSection locale={locale} stateSlug={stateSlug} activeDistrictSlugs={live.map((d) => d.slug)} />
          </Card>
        </Section>

        {/* ═══ 5b. Vote list (the vote colour from the home page) ═══ */}
        {coming.length > 0 && (
          <div className="ftp-hue-yellow">
            <Section title="Vote for the next district" emoji="🗳️">
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

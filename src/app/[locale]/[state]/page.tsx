/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  State page — Design v3 "Civic Ledger" (CONCEPT-v3 §5 "State")
// ═══════════════════════════════════════════════════════════
//
//  1. Header: state name + local-script name, chips (live / coming counts).
//  2. StatStrip: live districts, coming, and the Census 2011 population
//     and area covered by the live districts (summed from the registry —
//     we do not have state-wide census figures in the registry, so we only
//     show what we can add up honestly, and label it that way).
//  3. District grid: live districts as identity cards (name, script,
//     tagline, health grade, 2 numbers, NEW pill for the first 30 days),
//     then the not-live districts as compact cards with a COMING pill.
//  4. Map, "Vote for the next district" list, and supporters.
//
//  Every count is derived from the registry (src/lib/constants/districts.ts)
//  — never typed by hand.

export const revalidate = 300; // ISR: the NEW pills depend on go-live dates

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Lock, MapPin } from "lucide-react";
import { getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { prisma } from "@/lib/db";
import StateMapSection from "@/components/map/StateMapSection";
import StateSponsorSection from "@/components/common/StateSponsorSection";
import StateVoteList from "@/components/district/StateVoteList";
import { HealthScoreRing } from "@/components/district/DistrictHealthScoreCard";
import { Card, EmptyState, Pill, Section, SourcePill, StatStrip, StatTile } from "@/components/district/ui";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

/** A district counts as NEW for this many days after it goes live. */
const NEW_WINDOW_DAYS = 30;

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
 * simply shows no NEW pills rather than failing.
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

export default async function StatePage({ params }: Props) {
  const { locale, state: stateSlug } = await params;
  const stateData = getState(stateSlug);
  if (!stateData) notFound();

  const live = stateData.districts.filter((d) => d.active);
  const coming = stateData.districts.filter((d) => !d.active);
  const subUnitLabel = getStateConfig(stateSlug)?.subDistrictUnitPlural ?? "Taluks";

  // Census 2011 totals across the LIVE districts only (what we can add up).
  const livePopulation = live.reduce((s, d) => s + (d.population ?? 0), 0);
  const liveArea = live.reduce((s, d) => s + (d.area ?? 0), 0);

  const goLive = await getGoLiveDates(stateSlug);
  // Server render: one clock read per request (ISR regenerates every 5 min).
  const renderedAt = new Date().getTime();
  const isNew = (slug: string) => {
    const d = goLive.get(slug);
    return d ? renderedAt - d.getTime() <= NEW_WINDOW_DAYS * 86_400_000 : false;
  };

  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px - 32px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        {/* ═══ 1. Header ═══ */}
        <header style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 20 }}>
          <p className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <MapPin size={12} aria-hidden />
            <Link href={`/${locale}`} style={{ color: "inherit", textDecoration: "none" }}>India</Link>
            <span aria-hidden>·</span>
            {stateData.type === "ut" ? "Union territory" : "State"}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 className="ftp-h1">{stateData.name}</h1>
            {stateData.nameLocal && stateData.nameLocal !== stateData.name && (
              <span lang="und" style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text-2)" }}>{stateData.nameLocal}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
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
          </div>
          {!stateData.active && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
              This state is coming soon to ForThePeople.in. District data is being prepared. You can{" "}
              <Link href={`/${locale}/support`} style={{ color: "var(--ftp-brand)", textDecoration: "none" }}>
                sponsor a district
              </Link>{" "}
              to help us launch faster.
            </p>
          )}
        </header>

        {/* ═══ 2. Numbers ═══ */}
        <div style={{ marginTop: 24 }}>
          <StatStrip cols={4}>
            <StatTile label="Districts live" value={live.length} />
            <StatTile label="Coming soon" value={coming.length} sub={`of ${stateData.districts.length} districts`} />
            <StatTile
              label="Population covered"
              value={livePopulation > 0 ? livePopulation.toLocaleString("en-IN") : "—"}
              sub="Live districts only"
            />
            <StatTile
              label="Area covered"
              value={liveArea > 0 ? liveArea.toLocaleString("en-IN") : "—"}
              unit={liveArea > 0 ? "km²" : undefined}
              sub="Live districts only"
            />
          </StatStrip>
          {(livePopulation > 0 || liveArea > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>Population and area as of Census 2011</span>
              <SourcePill label="Census of India" href="https://censusindia.gov.in/" />
            </div>
          )}
        </div>

        {/* ═══ 3a. Live districts ═══ */}
        <Section title="Live districts">
          {live.length === 0 ? (
            <EmptyState
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
              {live.map((d) => (
                <li key={d.slug}>
                  <Card href={`/${locale}/${stateSlug}/${d.slug}`} padding={16} style={{ height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <h3 className="ftp-title">{d.name}</h3>
                          {d.nameLocal && d.nameLocal !== d.name && (
                            <span lang="und" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{d.nameLocal}</span>
                          )}
                        </div>
                        {d.tagline && <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>{d.tagline}</p>}
                        <div style={{ marginTop: 8 }}>
                          {isNew(d.slug) ? <Pill tone="brand">NEW</Pill> : <Pill tone="live" dot>Live</Pill>}
                        </div>
                      </div>
                      <HealthScoreRing districtSlug={d.slug} size={44} compact />
                    </div>
                    <dl style={{ display: "flex", gap: 20, margin: "12px 0 0", flexWrap: "wrap" }}>
                      <div>
                        <dt className="ftp-label">Population</dt>
                        <dd className="ftp-num" style={{ margin: 0, fontSize: 15, color: "var(--ftp-text)" }}>
                          {d.population ? d.population.toLocaleString("en-IN") : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="ftp-label">{subUnitLabel}</dt>
                        <dd className="ftp-num" style={{ margin: 0, fontSize: 15, color: "var(--ftp-text)" }}>
                          {d.talukCount ?? (d.taluks.length || "—")}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ═══ 3b. Coming districts (compact) ═══ */}
        {coming.length > 0 && (
          <Section title="Coming soon">
            <ul
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
                        <span style={{ display: "block", fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{d.name}</span>
                        {d.nameLocal && d.nameLocal !== d.name && (
                          <span lang="und" style={{ display: "block", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{d.nameLocal}</span>
                        )}
                      </span>
                      <Pill tone="neutral"><Lock size={12} aria-hidden />COMING</Pill>
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ═══ 4a. Map ═══ */}
        <Section title="Map">
          <Card padding={0} style={{ maxHeight: 420, overflow: "hidden" }}>
            <StateMapSection locale={locale} stateSlug={stateSlug} activeDistrictSlugs={live.map((d) => d.slug)} />
          </Card>
        </Section>

        {/* ═══ 4b. Vote list ═══ */}
        {coming.length > 0 && (
          <Section title="Vote for the next district">
            <StateVoteList
              locale={locale}
              stateSlug={stateSlug}
              stateName={stateData.name}
              lockedDistricts={coming.map((d) => ({ name: d.name, slug: d.slug }))}
            />
          </Section>
        )}

        {/* ═══ 4c. Supporters ═══ */}
        <div style={{ marginTop: 32 }}>
          <StateSponsorSection locale={locale} stateSlug={stateSlug} stateName={stateData.name} />
        </div>
      </div>
    </main>
  );
}

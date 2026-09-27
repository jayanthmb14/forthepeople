/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Population & Demographics — Design v4 "Rang" module page
// ═══════════════════════════════════════════════════════════════════════
//
//  Order (docs/DESIGN-SYSTEM.md, module-page recipe): PageHeader →
//  disclosure panel → AI summary → honest data-currency sentence →
//  StatStrip of emoji tiles (six Census figures, each "As of Census <year>")
//  → the census pictures (literacy pictogram, and a men-and-women row
//  from the sex ratio — both straight from the Census figures, shown only
//  when those figures exist) → one ChartCard per chart, each with a plain
//  "simple" sentence computed from the data, a "Show as table" view and
//  its own DataSourceCard citation → SourcesFooter → related news →
//  Toolbar (Share, Compare).
//
//  Colours: the page hue (teal) for single-series charts and pictures.
//  Religion, caste, education and employment keep their colour-blind-safe
//  or neutral palettes (see src/components/demographics/types.ts) — a
//  deliberate accessibility and neutrality choice.
//
"use client";
import { use, useState } from "react";
import { Users, Share2, GitCompare } from "lucide-react";

import { usePopulation, usePopulationProfile } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AsOfText,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";

import DemographicDisclaimer from "@/components/demographics/DemographicDisclaimer";
import DataSourceCard from "@/components/demographics/DataSourceCard";
import {
  ALPHABETICAL_RELIGIONS,
  type CasteMap,
  type EducationData,
  type EmploymentData,
  type HouseholdAmenitiesData,
  type LanguageData,
  type MigrationData,
  type EconomicClassData,
} from "@/components/demographics/types";

import ReligionDonut from "@/components/demographics/charts/ReligionDonut";
import CasteStackedBar from "@/components/demographics/charts/CasteStackedBar";
import LiteracyDumbbell from "@/components/demographics/charts/LiteracyDumbbell";
import EducationBreakdownBar, { LEVELS as EDUCATION_LEVELS } from "@/components/demographics/charts/EducationBreakdownBar";
import EmploymentStackedBar from "@/components/demographics/charts/EmploymentStackedBar";
import HouseholdAmenitiesWaffle, { AMENITIES } from "@/components/demographics/charts/HouseholdAmenitiesWaffle";
import MigrationBreakdown, { migrationOrigins, migrationReasons } from "@/components/demographics/charts/MigrationBreakdown";
import LanguageBarChart from "@/components/demographics/charts/LanguageBarChart";
import MPIIndicatorCard from "@/components/demographics/charts/MPIIndicatorCard";
import SexRatioGauge, {
  canRenderSexRatioGauge,
} from "@/components/demographics/charts/SexRatioGauge";
import AgePyramidStacked, { ageRows } from "@/components/demographics/charts/AgePyramidStacked";

function formatInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "15–59" → "15 to 59", "60+" → "60 and over" (for plain sentences). */
function bandWords(band: string): string {
  if (band.endsWith("+")) return `${band.slice(0, -1)} and over`;
  return band.replace("–", " to ");
}

/** A percentage with one decimal ("64.5%"). */
function pct1(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
}

/**
 * The "Show as table" view of a chart: label / value rows, then the same
 * citation the chart carries, so the source never disappears.
 */
function RowsTable({
  rows,
  caption,
  cite,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
  caption: string;
  cite: React.ReactNode;
}) {
  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={{ borderBottom: "1px solid var(--ftp-border)" }}>
              <th scope="row" style={{ textAlign: "left", fontWeight: 400, padding: "6px 4px", color: "var(--ftp-text-2)" }}>
                {r.label}
              </th>
              <td className="ftp-num" style={{ textAlign: "right", padding: "6px 4px", color: "var(--ftp-text)" }}>
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cite}
    </>
  );
}

export default function PopulationPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = titleCase(district);

  const profileQ = usePopulationProfile(district, state);
  const historyQ = usePopulation(district, state);

  const profile = profileQ.data?.data ?? null;
  const history = historyQ.data?.data ?? [];

  const sources = getModuleSources("population", state);

  const cite = (override?: {
    source?: string;
    sourceUrl?: string;
    referenceYear?: number;
    license?: string;
  }) => (
    <DataSourceCard
      source={override?.source ?? profile?.sourceName ?? "Census of India 2011"}
      sourceUrl={override?.sourceUrl ?? profile?.sourceUrl ?? undefined}
      license={override?.license ?? profile?.sourceLicense ?? undefined}
      referenceYear={
        override?.referenceYear ??
        (profile?.totalPopulation ? profile.year : 2011)
      }
      retrievedAt={
        profile?.retrievedAt ? new Date(profile.retrievedAt) : new Date()
      }
      boundaryVintage={profile?.boundaryVintage ?? undefined}
    />
  );

  const isLoading = profileQ.isLoading && historyQ.isLoading;
  const hasAnyData = Boolean(profile) || history.length > 0;

  // Reference year shown under each Census tile ("Census 2011").
  const refYear = profile?.year ?? 2011;
  const censusSub = `Census ${refYear}`;

  // Headline population: the profile figure, else the 2011 Census row from
  // history, else the latest non-estimate row. Never an estimate.
  const headlinePopulation = (() => {
    if (profile?.totalPopulation) {
      return { year: profile.year, value: profile.totalPopulation };
    }
    const census2011 = history.find((h) => h.year === 2011 && !h.source?.startsWith("Estimate"));
    if (census2011) return { year: 2011, value: census2011.population };
    const nonEstimate = [...history].reverse().find((h) => !h.source?.startsWith("Estimate"));
    if (nonEstimate) return { year: nonEstimate.year, value: nonEstimate.population };
    return null;
  })();

  // ── Numbers for the pictures and the "simple" sentences. Every one is
  //    read straight from the profile; missing figures stay missing. ──
  const literacy = typeof profile?.literacyTotal === "number" && profile.literacyTotal > 0 ? profile.literacyTotal : null;
  const sexRatio = typeof profile?.sexRatio === "number" && profile.sexRatio > 0 ? profile.sexRatio : null;
  const womenPerTenMen = sexRatio ? sexRatio / 100 : null;

  const ages = ageRows({
    pop_0_6: profile?.pop_0_6 ?? null,
    pop_7_14: profile?.pop_7_14 ?? null,
    pop_15_59: profile?.pop_15_59 ?? null,
    pop_60_plus: profile?.pop_60_plus ?? null,
  });
  const biggestAge = ages.length > 0 ? [...ages].sort((a, b) => b.value - a.value)[0] : null;

  const religion = profile?.religion ?? null;
  const religionRows = religion
    ? ALPHABETICAL_RELIGIONS.filter((k) => typeof religion[k] === "number").map((k) => ({
        label: k === "NotStated" ? "Not stated" : k,
        value: `${(religion[k] as number).toFixed(2)}%`,
      }))
    : [];

  const caste = (profile?.caste ?? null) as CasteMap | null;
  const casteRows = caste
    ? [
        { label: "Scheduled Caste", v: caste.SC },
        { label: "Scheduled Tribe", v: caste.ST },
        { label: "Other", v: caste.Other },
      ]
        .filter((r) => typeof r.v === "number")
        .map((r) => ({ label: r.label, value: `${(r.v as number).toFixed(2)}%` }))
    : [];

  const litMale = typeof profile?.literacyMale === "number" ? profile.literacyMale : null;
  const litFemale = typeof profile?.literacyFemale === "number" ? profile.literacyFemale : null;
  const literacyRows = [
    { label: "Male", v: litMale },
    { label: "Female", v: litFemale },
    { label: "District total", v: literacy },
  ]
    .filter((r) => typeof r.v === "number")
    .map((r) => ({ label: r.label, value: pct1(r.v as number) }));

  const education = (profile?.education ?? null) as EducationData | null;
  const educationRows = education
    ? EDUCATION_LEVELS.filter((l) => typeof education[l.key] === "number").map((l) => ({
        label: l.label,
        n: education[l.key] as number,
      }))
    : [];
  const topEducation = educationRows.length > 0 ? [...educationRows].sort((a, b) => b.n - a.n)[0] : null;

  const employment = (profile?.employment ?? null) as EmploymentData | null;
  const employmentRows = employment
    ? [
        { label: "Main workers", v: employment.mainWorkersPct },
        { label: "Marginal workers", v: employment.marginalWorkersPct },
        { label: "Non-workers", v: employment.nonWorkersPct },
        { label: "Worker participation rate", v: employment.workerParticipationRate },
      ]
        .filter((r) => typeof r.v === "number")
        .map((r) => ({ label: r.label, value: `${(r.v as number).toFixed(2)}%` }))
    : [];

  const amenities = (profile?.householdAmenities ?? null) as HouseholdAmenitiesData | null;
  const amenityRows = amenities
    ? AMENITIES.filter((a) => typeof amenities[a.key] === "number").map((a) => ({
        label: a.label,
        n: amenities[a.key] as number,
      }))
    : [];
  const amenityHigh = amenityRows.length > 1 ? [...amenityRows].sort((a, b) => b.n - a.n)[0] : null;
  const amenityLow = amenityRows.length > 1 ? [...amenityRows].sort((a, b) => a.n - b.n)[0] : null;

  const migration = (profile?.migration ?? null) as MigrationData | null;
  const origins = migration ? migrationOrigins(migration) : [];
  const reasons = migration ? migrationReasons(migration) : [];
  const topReason = reasons.length > 0 ? [...reasons].sort((a, b) => b.value - a.value)[0] : null;
  const migrationRows = [
    ...origins.map((o) => ({ label: `From: ${o.name.toLowerCase()}`, value: `${o.value.toFixed(2)}%` })),
    ...reasons.map((r) => ({ label: `Reason: ${r.name.toLowerCase()}`, value: `${r.value.toFixed(2)}%` })),
  ];

  const language = (profile?.language ?? null) as LanguageData | null;
  const languageRows = language?.top10 ? [...language.top10].sort((a, b) => b.pct - a.pct) : [];

  return (
    <ModuleErrorBoundary moduleName="Population & Demographics">
      <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
        <PageHeader
          icon={Users}
          title="Population & Demographics"
          description="Census data, literacy, sex ratio, religion, caste, age, economy, migration, household amenities"
          backHref={base}
          accent="blue"
          freshness={{ asOf: profileQ.data?.meta.lastUpdated ?? null }}
          source={{ label: "Census of India", href: "https://censusindia.gov.in" }}
        />

        <DemographicDisclaimer districtName={districtName} defaultOpen={false} />

        <AIInsightCard module="population" district={district} />

        {isLoading && <LoadingShell rows={8} />}
        {profileQ.error && <ErrorBlock />}

        {!isLoading && !hasAnyData && (
          <div style={{ marginBottom: 20 }}>
            <EmptyState
              emoji="📈"
              title="Data being collected"
              body={`Demographic profile for ${districtName} is being assembled. Historical census totals will also appear here once available.`}
              action={
                <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                  Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
                </p>
              }
            />
          </div>
        )}

        {!isLoading && hasAnyData && (
          <>
            {/* Data-currency notice — Census 2011 is the primary baseline.
                Plain body text (no tinted box), first sentence in weight 600. */}
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px", fontSize: 14, lineHeight: "21px" }}>
              <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
                Headline figures are from Census of India 2011.
              </span>{" "}
              India&apos;s next decennial Census is in progress — Phase I
              houselisting April–September 2026, population enumeration reference
              date 1 March 2027. Updated figures will appear here within 90 days
              of official release. Recent survey indicators (NFHS, NITI MPI,
              PLFS) are shown separately in their own sections with the survey
              year clearly labelled.
            </p>

            {/* Headline stats — six Census figures, each labelled with its year. */}
            <StatStrip cols={3}>
              <StatTile
                emoji="👥"
                label={headlinePopulation ? `Population (${headlinePopulation.year})` : "Population"}
                value={headlinePopulation ? formatInt(headlinePopulation.value) : "—"}
                asOfPeriod={headlinePopulation ? `Census ${headlinePopulation.year}` : undefined}
              />
              <StatTile
                emoji="⚖️"
                label="Sex ratio"
                value={profile?.sexRatio ? String(profile.sexRatio) : "—"}
                sub="Females per 1,000 males"
                asOfPeriod={censusSub}
              />
              <StatTile
                emoji="🧒"
                label="Child sex ratio"
                value={profile?.childSexRatio ? String(profile.childSexRatio) : "—"}
                sub="Age 0 to 6*"
                asOfPeriod={censusSub}
              />
              <StatTile
                emoji="📖"
                label="Literacy"
                value={profile?.literacyTotal ? profile.literacyTotal.toFixed(1) : "—"}
                unit={profile?.literacyTotal ? "%" : undefined}
                sub="Aged 7 and over"
                asOfPeriod={censusSub}
              />
              <StatTile
                emoji="🏙️"
                label="Urban share"
                value={profile?.urbanPct ? profile.urbanPct.toFixed(1) : "—"}
                unit={profile?.urbanPct ? "%" : undefined}
                asOfPeriod={censusSub}
              />
              <StatTile
                emoji="🏘️"
                label="Density"
                value={profile?.density ? formatInt(profile.density) : "—"}
                unit={profile?.density ? "/km²" : undefined}
                sub="Persons per sq km"
                asOfPeriod={censusSub}
              />
            </StatStrip>

            {/* The census pictures. Literacy: 10 books, one per 10 % of
                people aged 7+ who can read. Sex ratio: a row of 10 men and
                the matching row of women. Only drawn from real figures. */}
            {(literacy || womenPerTenMen) && (
              <div className={literacy && womenPerTenMen ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
                <Card tinted padding={18}>
                  <Explainer title="In simple words" emoji="💡">
                    In {districtName},{" "}
                    {literacy ? (
                      <>
                        about <strong>{Math.round(literacy / 10)} in every 10</strong> people aged 7 and over can read and write
                        {sexRatio ? ", and " : " "}
                      </>
                    ) : null}
                    {sexRatio ? (
                      <>
                        there are <strong className="ftp-num">{sexRatio.toLocaleString("en-IN")}</strong> women and girls for every{" "}
                        <strong className="ftp-num">1,000</strong> men and boys{" "}
                      </>
                    ) : null}
                    (Census {refYear}).
                  </Explainer>
                  {literacy ? (
                    <Pictogram
                      filled={literacy / 10}
                      emoji="📖"
                      label={`About ${Math.round(literacy / 10)} of every 10 people aged 7 and over can read and write (${pct1(literacy)}).`}
                    />
                  ) : null}
                  {!literacy && womenPerTenMen ? <SexRatioPicture womenPerTenMen={womenPerTenMen} sexRatio={sexRatio as number} /> : null}
                </Card>
                {literacy && womenPerTenMen ? (
                  <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                      Men and women
                    </p>
                    <SexRatioPicture womenPerTenMen={womenPerTenMen} sexRatio={sexRatio as number} />
                    <AsOfText period={censusSub} />
                  </Card>
                ) : null}
              </div>
            )}

            {/* Age groups (4-group fallback — schema doesn't store 5-year bands yet) */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Age structure"
                emoji="🎂"
                units="Number of people in each Census age group"
                simple={
                  biggestAge ? (
                    <>
                      The biggest group is people aged {bandWords(biggestAge.band)}:{" "}
                      <strong className="ftp-num">{formatInt(biggestAge.value)}</strong> people.
                    </>
                  ) : undefined
                }
                table={
                  ages.length > 0 ? (
                    <RowsTable
                      caption="People in each age group"
                      rows={ages.map((r) => ({ label: `Aged ${bandWords(r.band)}`, value: formatInt(r.value) }))}
                      cite={cite()}
                    />
                  ) : undefined
                }
              >
                <AgePyramidStacked
                  pop_0_6={profile?.pop_0_6 ?? null}
                  pop_7_14={profile?.pop_7_14 ?? null}
                  pop_15_59={profile?.pop_15_59 ?? null}
                  pop_60_plus={profile?.pop_60_plus ?? null}
                />
                {cite()}
              </ChartCard>
            </div>

            {/* Religion — alphabetical on purpose; the simple line never ranks. */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Religion (alphabetical)"
                emoji="🧩"
                units="Share of people, in per cent. Listed A to Z, not by size."
                simple={religionRows.length > 0 ? <>Each slice is one religion&apos;s share of the people counted in the Census.</> : undefined}
                table={
                  religionRows.length > 0 ? (
                    <RowsTable caption="Religion shares, exact percentages" rows={religionRows} cite={cite()} />
                  ) : undefined
                }
              >
                <ReligionDonut religion={profile?.religion ?? null} />
                {cite()}
              </ChartCard>
            </div>

            {/* Caste categories */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Caste categories"
                emoji="🗂️"
                units="Share of people, in per cent, in the three constitutional categories"
                simple={casteRows.length > 0 ? <>The bar is everyone counted, split into Scheduled Caste, Scheduled Tribe and Other.</> : undefined}
                table={
                  casteRows.length > 0 ? (
                    <RowsTable caption="Caste-category shares" rows={casteRows} cite={cite()} />
                  ) : undefined
                }
              >
                <CasteStackedBar caste={caste} />
                {cite()}
              </ChartCard>
            </div>

            {/* Literacy & education — two cards side by side, one column on phones */}
            <div
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
                gap: 16,
              }}
            >
              <ChartCard
                title="Literacy by sex"
                emoji="📖"
                units="Per cent of people aged 7 and over who can read and write"
                simple={
                  litMale !== null && litFemale !== null ? (
                    <>
                      <strong className="ftp-num">{pct1(litMale)}</strong> of men and <strong className="ftp-num">{pct1(litFemale)}</strong> of women can
                      read and write, a gap of <strong className="ftp-num">{Math.abs(litMale - litFemale).toFixed(1)}</strong> points.
                    </>
                  ) : undefined
                }
                table={
                  literacyRows.length > 0 ? (
                    <RowsTable caption="Literacy by sex" rows={literacyRows} cite={cite()} />
                  ) : undefined
                }
              >
                <LiteracyDumbbell
                  literacyTotal={profile?.literacyTotal ?? null}
                  literacyMale={profile?.literacyMale ?? null}
                  literacyFemale={profile?.literacyFemale ?? null}
                />
                {cite()}
              </ChartCard>
              <ChartCard
                title="Education attainment"
                emoji="🎓"
                units="Share of people, in per cent, from no schooling to postgraduate"
                simple={
                  topEducation ? (
                    <>
                      The biggest group is <strong>{topEducation.label}</strong> (
                      <span className="ftp-num">{pct1(topEducation.n)}</span>).
                    </>
                  ) : undefined
                }
                table={
                  educationRows.length > 0 ? (
                    <RowsTable
                      caption="Education attainment"
                      rows={educationRows.map((r) => ({ label: r.label, value: `${r.n.toFixed(2)}%` }))}
                      cite={cite()}
                    />
                  ) : undefined
                }
              >
                <EducationBreakdownBar education={education} />
                {cite()}
              </ChartCard>
            </div>

            {/* Employment */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Employment"
                emoji="👷"
                units="Share of people, in per cent"
                simple={
                  employment &&
                  typeof employment.mainWorkersPct === "number" &&
                  typeof employment.marginalWorkersPct === "number" &&
                  typeof employment.nonWorkersPct === "number" ? (
                    <>
                      <strong className="ftp-num">{pct1(employment.mainWorkersPct)}</strong> of people work for most of the year,{" "}
                      <strong className="ftp-num">{pct1(employment.marginalWorkersPct)}</strong> for part of it, and{" "}
                      <strong className="ftp-num">{pct1(employment.nonWorkersPct)}</strong> are not counted as workers.
                    </>
                  ) : undefined
                }
                table={
                  employmentRows.length > 0 ? (
                    <RowsTable caption="Employment shares" rows={employmentRows} cite={cite()} />
                  ) : undefined
                }
              >
                <EmploymentStackedBar employment={employment} />
                {cite()}
              </ChartCard>
            </div>

            {/* Economic class (NITI MPI) — the component renders its own tiles */}
            <Section title="Multidimensional poverty (NITI MPI)" emoji="🧾">
              <MPIIndicatorCard economicClass={(profile?.economicClass ?? null) as EconomicClassData | null} />
            </Section>

            {/* Household amenities */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Household amenities"
                emoji="🏠"
                units="Each square is 1% of households"
                simple={
                  amenityHigh && amenityLow ? (
                    <>
                      <strong>{amenityHigh.label}</strong> reaches <strong className="ftp-num">{pct1(amenityHigh.n)}</strong> of homes;{" "}
                      <strong>{amenityLow.label.toLowerCase()}</strong> reaches only <strong className="ftp-num">{pct1(amenityLow.n)}</strong>.
                    </>
                  ) : undefined
                }
                table={
                  amenityRows.length > 0 ? (
                    <RowsTable
                      caption="Share of households with each amenity"
                      rows={amenityRows.map((r) => ({ label: r.label, value: pct1(r.n) }))}
                      cite={cite()}
                    />
                  ) : undefined
                }
              >
                <HouseholdAmenitiesWaffle amenities={amenities} />
                {cite()}
              </ChartCard>
            </div>

            {/* Migration */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Migration"
                emoji="🧳"
                units="Share of people who moved here, in per cent"
                simple={
                  migration && (typeof migration.totalInMigrantsPct === "number" || topReason) ? (
                    <>
                      {typeof migration.totalInMigrantsPct === "number" && (
                        <>
                          <strong className="ftp-num">{pct1(migration.totalInMigrantsPct)}</strong> of residents were born outside this district.{" "}
                        </>
                      )}
                      {topReason && (
                        <>
                          The most common reason for moving is <strong>{topReason.name.toLowerCase()}</strong>.
                        </>
                      )}
                    </>
                  ) : undefined
                }
                table={
                  migrationRows.length > 0 ? (
                    <RowsTable caption="In-migrants by origin and reason" rows={migrationRows} cite={cite()} />
                  ) : undefined
                }
              >
                <MigrationBreakdown migration={migration} />
                {cite()}
              </ChartCard>
            </div>

            {/* Language (mother tongue) */}
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Mother tongue, top 10"
                emoji="🗣️"
                units="Share of people by mother tongue, in per cent"
                simple={
                  languageRows.length > 0 ? (
                    <>
                      The most common mother tongue is <strong>{languageRows[0].name}</strong> (
                      <span className="ftp-num">{pct1(languageRows[0].pct)}</span>).
                    </>
                  ) : undefined
                }
                table={
                  languageRows.length > 0 ? (
                    <RowsTable
                      caption="Top mother tongues"
                      rows={languageRows.map((l) => ({ label: l.name, value: pct1(l.pct) }))}
                      cite={cite()}
                    />
                  ) : undefined
                }
              >
                <LanguageBarChart language={language} />
                {cite()}
              </ChartCard>
            </div>

            {/* Sex ratio gauge (only if sex ratio data present) */}
            {canRenderSexRatioGauge(profile) && (
              <div style={{ marginTop: 24 }}>
                <ChartCard
                  title="Sex ratio"
                  emoji="⚖️"
                  units="Females per 1,000 males, on a scale from 700 to 1,100"
                  simple={
                    sexRatio ? (
                      <>
                        There are <strong className="ftp-num">{sexRatio.toLocaleString("en-IN")}</strong> women and girls for every 1,000 men and boys.
                      </>
                    ) : undefined
                  }
                  table={
                    <RowsTable
                      caption="Sex ratio, females per 1,000 males"
                      rows={[
                        { label: "Sex ratio (all ages)", value: profile?.sexRatio ?? "—" },
                        ...(typeof profile?.childSexRatio === "number"
                          ? [{ label: "Child sex ratio (0–6)", value: profile.childSexRatio }]
                          : []),
                      ]}
                      cite={cite()}
                    />
                  }
                >
                  <SexRatioGauge
                    sexRatio={profile?.sexRatio ?? null}
                    childSexRatio={profile?.childSexRatio ?? null}
                  />
                  {cite()}
                </ChartCard>
              </div>
            )}
          </>
        )}

        {/* Rainfall removed — it belongs on /weather, not /population. */}

        <SourcesFooter
          sources={sources.sources.map((name) => ({ name }))}
        />
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "8px 0 0" }}>
          {sources.frequency}
        </p>

        {/* Related news (filtered by targetModule === "population") */}
        <ModuleNews district={district} state={state} locale={locale} module="population" />

        <Toolbar>
          <SharePageButton />
          <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=population&a=${district}`}>
            Compare with another district
          </ToolbarButton>
        </Toolbar>
      </div>
    </ModuleErrorBoundary>
  );
}

/**
 * The sex-ratio picture: a row of 10 men, and under it the matching number
 * of women (sexRatio ÷ 100). 985 → 9.85 women; above 1,000 the row grows
 * past 10. Straight from the Census figure, nothing rounded away.
 */
function SexRatioPicture({ womenPerTenMen, sexRatio }: { womenPerTenMen: number; sexRatio: number }) {
  const womenTotal = Math.max(10, Math.ceil(womenPerTenMen));
  return (
    <div role="group" aria-label={`${sexRatio} women and girls for every 1,000 men and boys`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Pictogram filled={10} total={10} emoji="👨" size={16} label="10 men and boys" />
      <Pictogram
        filled={womenPerTenMen}
        total={womenTotal}
        emoji="👩"
        size={16}
        label={`About ${womenPerTenMen.toFixed(1)} women and girls`}
      />
    </div>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Population & Demographics — Design v3 "Civic Ledger" module page
// ═══════════════════════════════════════════════════════════════════════
//
//  Order (CONCEPT-v3 §5): PageHeader → honest data-currency sentence →
//  disclosure panel → AI summary → StatStrip (6 Census figures, each with
//  its reference year) → one Section + Card per chart (every chart keeps
//  its own DataSourceCard citation) → SourcesFooter → related news →
//  Toolbar (Share, Compare).
//
//  Accent: "blue" — the data accent (CONCEPT-v3 §3), because this module
//  is reference data rather than community content.
//
//  Chart series colours stay on the colour-blind-safe Okabe-Ito / Viridis
//  palettes (see src/components/demographics/types.ts); everything around
//  the charts uses design tokens.
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
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";

import DemographicDisclaimer from "@/components/demographics/DemographicDisclaimer";
import DataSourceCard from "@/components/demographics/DataSourceCard";
import type {
  CasteMap,
  EducationData,
  EmploymentData,
  HouseholdAmenitiesData,
  LanguageData,
  MigrationData,
  EconomicClassData,
} from "@/components/demographics/types";

import ReligionDonut from "@/components/demographics/charts/ReligionDonut";
import CasteStackedBar from "@/components/demographics/charts/CasteStackedBar";
import LiteracyDumbbell from "@/components/demographics/charts/LiteracyDumbbell";
import EducationBreakdownBar from "@/components/demographics/charts/EducationBreakdownBar";
import EmploymentStackedBar from "@/components/demographics/charts/EmploymentStackedBar";
import HouseholdAmenitiesWaffle from "@/components/demographics/charts/HouseholdAmenitiesWaffle";
import MigrationBreakdown from "@/components/demographics/charts/MigrationBreakdown";
import LanguageBarChart from "@/components/demographics/charts/LanguageBarChart";
import MPIIndicatorCard from "@/components/demographics/charts/MPIIndicatorCard";
import SexRatioGauge, {
  canRenderSexRatioGauge,
} from "@/components/demographics/charts/SexRatioGauge";
import AgePyramidStacked from "@/components/demographics/charts/AgePyramidStacked";

function formatInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

/** Small caption above a chart inside a Card (11 px uppercase label). */
function CardCaption({ children }: { children: React.ReactNode }) {
  return <p className="ftp-label" style={{ marginBottom: 8 }}>{children}</p>;
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
          <NoDataCard
            module="population"
            district={district}
            state={state}
            customMessage={`Demographic profile for ${districtName} is being assembled. Historical census totals will also appear here once available.`}
          />
        )}

        {!isLoading && hasAnyData && (
          <>
            {/* Data-currency notice — Census 2011 is the primary baseline.
                Plain body text (no tinted box), first sentence in weight 500. */}
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
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
                label={headlinePopulation ? `Population (${headlinePopulation.year})` : "Population"}
                value={headlinePopulation ? formatInt(headlinePopulation.value) : "—"}
                icon={Users}
                sub={headlinePopulation ? `Census ${headlinePopulation.year}` : undefined}
              />
              <StatTile
                label="Sex ratio"
                value={profile?.sexRatio ? String(profile.sexRatio) : "—"}
                sub={`Females per 1,000 males · ${censusSub}`}
              />
              <StatTile
                label="Child sex ratio"
                value={profile?.childSexRatio ? String(profile.childSexRatio) : "—"}
                sub={`Age 0–6* · ${censusSub}`}
              />
              <StatTile
                label="Literacy"
                value={profile?.literacyTotal ? profile.literacyTotal.toFixed(1) : "—"}
                unit={profile?.literacyTotal ? "%" : undefined}
                sub={censusSub}
              />
              <StatTile
                label="Urban share"
                value={profile?.urbanPct ? profile.urbanPct.toFixed(1) : "—"}
                unit={profile?.urbanPct ? "%" : undefined}
                sub={censusSub}
              />
              <StatTile
                label="Density"
                value={profile?.density ? formatInt(profile.density) : "—"}
                unit={profile?.density ? "/km²" : undefined}
                sub={`Persons per sq km · ${censusSub}`}
              />
            </StatStrip>

            {/* Age pyramid (4-group fallback — schema doesn't store 5-year bands yet) */}
            <Section title="Age structure">
              <Card>
                <AgePyramidStacked
                  pop_0_6={profile?.pop_0_6 ?? null}
                  pop_7_14={profile?.pop_7_14 ?? null}
                  pop_15_59={profile?.pop_15_59 ?? null}
                  pop_60_plus={profile?.pop_60_plus ?? null}
                />
                {cite()}
              </Card>
            </Section>

            {/* Religion */}
            <Section title="Religion (alphabetical)">
              <Card>
                <ReligionDonut religion={profile?.religion ?? null} />
                {profile?.religion && (
                  <details style={{ marginTop: 8, fontSize: 13, lineHeight: "20px" }}>
                    <summary style={{ cursor: "pointer", color: "var(--ftp-text-2)", minHeight: 44, display: "flex", alignItems: "center" }}>
                      Show exact percentages
                    </summary>
                    <table style={{ marginTop: 4, borderCollapse: "collapse", width: "100%" }}>
                      <caption className="sr-only">Religion shares, exact percentages</caption>
                      <tbody>
                        {Object.keys(profile.religion)
                          .sort()
                          .map((k, i) => (
                            <tr key={k} style={{ background: i % 2 ? "var(--ftp-surface-2)" : "transparent" }}>
                              <th scope="row" style={{ padding: "6px 8px", color: "var(--ftp-text)", fontWeight: 400, textAlign: "left", width: "60%" }}>
                                {k === "NotStated" ? "Not Stated" : k}
                              </th>
                              <td className="ftp-num" style={{ padding: "6px 8px", color: "var(--ftp-text)", textAlign: "right" }}>
                                {(profile.religion![k] as number).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </details>
                )}
                {cite()}
              </Card>
            </Section>

            {/* Caste categories */}
            <Section title="Caste categories">
              <Card>
                <CasteStackedBar caste={(profile?.caste ?? null) as CasteMap | null} />
                {cite()}
              </Card>
            </Section>

            {/* Literacy & Education — two cards side by side, one column on phones */}
            <Section title="Literacy & education">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
                  gap: 16,
                }}
              >
                <Card>
                  <CardCaption>Literacy by sex</CardCaption>
                  <LiteracyDumbbell
                    literacyTotal={profile?.literacyTotal ?? null}
                    literacyMale={profile?.literacyMale ?? null}
                    literacyFemale={profile?.literacyFemale ?? null}
                  />
                </Card>
                <Card>
                  <CardCaption>Education attainment</CardCaption>
                  <EducationBreakdownBar education={(profile?.education ?? null) as EducationData | null} />
                </Card>
              </div>
              {cite()}
            </Section>

            {/* Employment */}
            <Section title="Employment">
              <Card>
                <EmploymentStackedBar employment={(profile?.employment ?? null) as EmploymentData | null} />
                {cite()}
              </Card>
            </Section>

            {/* Economic class (NITI MPI) — the component renders its own tiles */}
            <Section title="Multidimensional poverty (NITI MPI)">
              <MPIIndicatorCard economicClass={(profile?.economicClass ?? null) as EconomicClassData | null} />
            </Section>

            {/* Household amenities */}
            <Section title="Household amenities">
              <Card>
                <HouseholdAmenitiesWaffle
                  amenities={(profile?.householdAmenities ?? null) as HouseholdAmenitiesData | null}
                />
                {cite()}
              </Card>
            </Section>

            {/* Migration */}
            <Section title="Migration">
              <Card>
                <MigrationBreakdown migration={(profile?.migration ?? null) as MigrationData | null} />
                {cite()}
              </Card>
            </Section>

            {/* Language (mother tongue) */}
            <Section title="Mother tongue — top 10">
              <Card>
                <LanguageBarChart language={(profile?.language ?? null) as LanguageData | null} />
                {cite()}
              </Card>
            </Section>

            {/* Sex ratio gauge (only if sex ratio data present) */}
            {canRenderSexRatioGauge(profile) && (
              <Section title="Sex ratio">
                <Card>
                  <SexRatioGauge
                    sexRatio={profile?.sexRatio ?? null}
                    childSexRatio={profile?.childSexRatio ?? null}
                  />
                  {cite()}
                </Card>
              </Section>
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

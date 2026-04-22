/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Users } from "lucide-react";

import { usePopulation, usePopulationProfile } from "@/hooks/useRealtimeData";
import {
  ModuleHeader,
  LastUpdatedBadge,
  StatCard,
  SectionLabel,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
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

const cardShell: React.CSSProperties = {
  background: "#FFF",
  border: "1px solid #E8E8E4",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
};

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

  return (
    <ModuleErrorBoundary moduleName="Population & Demographics">
      <div style={{ padding: 24 }}>
        <ModuleHeader
          icon={Users}
          title="Population & Demographics"
          description="Census data, literacy, sex ratio, religion, caste, age, economy, migration, household amenities"
          backHref={base}
        >
          <LastUpdatedBadge lastUpdated={profileQ.data?.meta.lastUpdated ?? null} />
        </ModuleHeader>

        <DemographicDisclaimer districtName={districtName} defaultOpen={false} />

        <DataSourceBanner
          moduleName="population"
          sources={sources.sources}
          updateFrequency={sources.frequency}
          isLive={sources.isLive}
        />

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
            {/* Data-currency notice — Census 2011 is the primary baseline */}
            <div
              style={{
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#9A3412",
                lineHeight: 1.5,
              }}
            >
              <strong>Headline figures are from Census of India 2011.</strong>{" "}
              India&apos;s next decennial Census is in progress — Phase I
              houselisting April–September 2026, population enumeration reference
              date 1 March 2027. Updated figures will appear here within 90 days
              of official release. Recent survey indicators (NFHS, NITI MPI,
              PLFS) are shown separately in their own sections with the survey
              year clearly labelled.
            </div>

            {/* 5. Headline stats */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {(() => {
                if (profile?.totalPopulation) {
                  return (
                    <StatCard
                      label={`Population (${profile.year})`}
                      value={formatInt(profile.totalPopulation)}
                      icon={Users}
                    />
                  );
                }
                const census2011 = history.find(
                  (h) => h.year === 2011 && !h.source?.startsWith("Estimate"),
                );
                if (census2011) {
                  return (
                    <StatCard
                      label={`Population (2011)`}
                      value={formatInt(census2011.population)}
                      icon={Users}
                    />
                  );
                }
                const nonEstimate = [...history]
                  .reverse()
                  .find((h) => !h.source?.startsWith("Estimate"));
                if (nonEstimate) {
                  return (
                    <StatCard
                      label={`Population (${nonEstimate.year})`}
                      value={formatInt(nonEstimate.population)}
                      icon={Users}
                    />
                  );
                }
                return <StatCard label="Population" value="—" icon={Users} />;
              })()}
              <StatCard
                label="Sex Ratio"
                value={profile?.sexRatio ? `${profile.sexRatio}/1k` : "—"}
                sub="♀/1000 ♂"
              />
              <StatCard
                label="Child Sex Ratio"
                value={
                  profile?.childSexRatio ? `${profile.childSexRatio}/1k` : "—"
                }
                sub="0–6 age*"
              />
              <StatCard
                label="Literacy"
                value={
                  profile?.literacyTotal
                    ? `${profile.literacyTotal.toFixed(1)}%`
                    : "—"
                }
                accent="#16A34A"
              />
              <StatCard
                label="Urban share"
                value={profile?.urbanPct ? `${profile.urbanPct.toFixed(1)}%` : "—"}
              />
              <StatCard
                label="Density"
                value={profile?.density ? `${formatInt(profile.density)}/km²` : "—"}
                sub="persons / sq km"
              />
            </div>

            {/* 6. Age pyramid (4-group fallback — schema doesn't store 5-year bands yet) */}
            <SectionLabel>Age Structure</SectionLabel>
            <div style={cardShell}>
              <AgePyramidStacked
                pop_0_6={profile?.pop_0_6 ?? null}
                pop_7_14={profile?.pop_7_14 ?? null}
                pop_15_59={profile?.pop_15_59 ?? null}
                pop_60_plus={profile?.pop_60_plus ?? null}
              />
              {cite()}
            </div>

            {/* 7. Religion */}
            <SectionLabel>Religion (Alphabetical)</SectionLabel>
            <div style={cardShell}>
              <ReligionDonut religion={profile?.religion ?? null} />
              {profile?.religion && (
                <details style={{ marginTop: 8, fontSize: 12 }}>
                  <summary style={{ cursor: "pointer", color: "#6B6B6B" }}>
                    Show exact percentages
                  </summary>
                  <table
                    style={{
                      marginTop: 8,
                      borderCollapse: "collapse",
                      width: "100%",
                    }}
                  >
                    <tbody>
                      {Object.keys(profile.religion)
                        .sort()
                        .map((k) => (
                          <tr key={k}>
                            <td
                              style={{
                                padding: "4px 8px",
                                color: "#4B4B4B",
                                width: "60%",
                              }}
                            >
                              {k === "NotStated" ? "Not Stated" : k}
                            </td>
                            <td
                              style={{
                                padding: "4px 8px",
                                fontFamily: "var(--font-mono)",
                                color: "#1A1A1A",
                              }}
                            >
                              {(profile.religion![k] as number).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </details>
              )}
              {cite()}
            </div>

            {/* 8. Caste categories */}
            <SectionLabel>Caste Categories</SectionLabel>
            <div style={cardShell}>
              <CasteStackedBar
                caste={(profile?.caste ?? null) as CasteMap | null}
              />
              {cite()}
            </div>

            {/* 9. Literacy & Education */}
            <SectionLabel>Literacy &amp; Education</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 6 }}>
                  Literacy by sex
                </div>
                <LiteracyDumbbell
                  literacyTotal={profile?.literacyTotal ?? null}
                  literacyMale={profile?.literacyMale ?? null}
                  literacyFemale={profile?.literacyFemale ?? null}
                />
              </div>
              <div
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 6 }}>
                  Education attainment
                </div>
                <EducationBreakdownBar
                  education={(profile?.education ?? null) as EducationData | null}
                />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>{cite()}</div>

            {/* 10. Employment */}
            <SectionLabel>Employment</SectionLabel>
            <div style={cardShell}>
              <EmploymentStackedBar
                employment={(profile?.employment ?? null) as EmploymentData | null}
              />
              {cite()}
            </div>

            {/* 11. Economic class (NITI MPI) */}
            <SectionLabel>Multidimensional Poverty (NITI MPI)</SectionLabel>
            <div style={{ marginBottom: 20 }}>
              <MPIIndicatorCard
                economicClass={
                  (profile?.economicClass ?? null) as EconomicClassData | null
                }
              />
            </div>

            {/* 12. Household amenities */}
            <SectionLabel>Household Amenities</SectionLabel>
            <div style={cardShell}>
              <HouseholdAmenitiesWaffle
                amenities={
                  (profile?.householdAmenities ?? null) as
                    | HouseholdAmenitiesData
                    | null
                }
              />
              {cite()}
            </div>

            {/* 13. Migration */}
            <SectionLabel>Migration</SectionLabel>
            <div style={cardShell}>
              <MigrationBreakdown
                migration={(profile?.migration ?? null) as MigrationData | null}
              />
              {cite()}
            </div>

            {/* 14. Language (mother tongue) */}
            <SectionLabel>Mother Tongue — Top 10</SectionLabel>
            <div style={cardShell}>
              <LanguageBarChart
                language={(profile?.language ?? null) as LanguageData | null}
              />
              {cite()}
            </div>

            {/* Bonus: Sex Ratio gauge (only if sex ratio data present) */}
            {canRenderSexRatioGauge(profile) && (
              <>
                <SectionLabel>Sex Ratio</SectionLabel>
                <div style={cardShell}>
                  <SexRatioGauge
                    sexRatio={profile?.sexRatio ?? null}
                    childSexRatio={profile?.childSexRatio ?? null}
                  />
                  {cite()}
                </div>
              </>
            )}
          </>
        )}

        {/* Rainfall removed — it belongs on /weather, not /population. */}

        {/* 16. Related news (filtered by targetModule === "population") */}
        <ModuleNews
          district={district}
          state={state}
          locale={locale}
          module="population"
        />
      </div>
    </ModuleErrorBoundary>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  People (census) — "How many people live here, and what are they like?"
//  (docs/LAYOUT.md recipe; docs/MODULE-MAP.md "Know your district")
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader → AI summary → Explainer (how many people at the
//  last Census, then literacy and the sex ratio in words) + a line on how
//  old the Census is → 4 StatTiles (people, literacy, sex ratio, living in
//  towns) → ONE picture row: 10 books with the readers lit, 10 men and the
//  matching women, and a card of the other Census numbers → the disclosure
//  panel (legal text, English is official) → the charts, 2 per row on
//  laptop/PC, 1 on phones: each is a ChartCard with a plain sentence, a
//  "Show as table" view and its own source badge. Charts with no data for
//  this district are not drawn; one line names them instead → the poverty
//  index → sources → related news → Share / Compare.
//
//  Colours: the page hue (teal) for single-series charts and pictures.
//  Religion, caste, education and employment keep their colour-blind-safe
//  or neutral palettes (src/components/demographics/types.ts), a deliberate
//  accessibility and neutrality choice. Religion stays alphabetical.
//
//  i18n: page_population (en / kn / hi). The disclosure panel's legal body
//  text is English only by design (a translated note says so). Language
//  names, dataset and source names are data, shown as published.
"use client";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Users, GitCompare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { usePopulation, usePopulationProfile } from "@/hooks/useRealtimeData";
import {
  ModulePage,
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
import { ChartCard, ChartGradients, Explainer, Pictogram } from "@/components/district/visuals";
import { DetailList } from "@/components/district/DetailSheet";
import { ShareDonut } from "@/components/community/CommunityVisuals";
import { SharePageButton } from "@/components/community/pageTools";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

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
import { AXIS_LINE, AXIS_TICK, TOOLTIP_PROPS } from "@/components/demographics/chartKit";

import ReligionDonut from "@/components/demographics/charts/ReligionDonut";
import CasteStackedBar from "@/components/demographics/charts/CasteStackedBar";
import LiteracyDumbbell from "@/components/demographics/charts/LiteracyDumbbell";
import EducationBreakdownBar, { LEVELS as EDUCATION_LEVELS } from "@/components/demographics/charts/EducationBreakdownBar";
import EmploymentStackedBar from "@/components/demographics/charts/EmploymentStackedBar";
import HouseholdAmenitiesWaffle, { AMENITIES } from "@/components/demographics/charts/HouseholdAmenitiesWaffle";
import MigrationBreakdown, { migrationOrigins, migrationReasons } from "@/components/demographics/charts/MigrationBreakdown";
import LanguageBarChart from "@/components/demographics/charts/LanguageBarChart";
import MPIIndicatorCard from "@/components/demographics/charts/MPIIndicatorCard";
import SexRatioGauge, { canRenderSexRatioGauge } from "@/components/demographics/charts/SexRatioGauge";
import AgePyramidStacked, { ageRows } from "@/components/demographics/charts/AgePyramidStacked";

/** Census age band ("15–59") → page_population.ageBands.<key>. */
const BAND_KEY: Record<string, string> = { "0–6": "b0", "7–14": "b7", "15–59": "b15", "60+": "b60" };

/** A history row counts as a Census figure only when its source says so. */
const CENSUS_SOURCE = /^census of india/i;

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

function PopulationPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_population");
  const tNo = useTranslations("noData");
  const tOv = useTranslations("overview");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);

  const profileQ = usePopulationProfile(district, state);
  const historyQ = usePopulation(district, state);

  const profile = profileQ.data?.data ?? null;
  const history = historyQ.data?.data ?? [];

  const sources = getModuleSources("population", state);

  // Number helpers in the page language.
  const int = (n: number | null | undefined) => (n == null ? "—" : f.number(n));
  const pct = (n: number, d = 1) => f.number(n / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  const bandWords = (band: string) => (BAND_KEY[band] ? t(`ageBands.${BAND_KEY[band]}`) : band);
  const bold = (c: React.ReactNode) => <strong>{c}</strong>;
  const boldNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const cite = (override?: { source?: string; sourceUrl?: string; referenceYear?: number; license?: string }) => (
    <DataSourceCard
      source={override?.source ?? profile?.sourceName ?? "Census of India 2011"}
      sourceUrl={override?.sourceUrl ?? profile?.sourceUrl ?? undefined}
      license={override?.license ?? profile?.sourceLicense ?? undefined}
      referenceYear={override?.referenceYear ?? (profile?.totalPopulation ? profile.year : 2011)}
      retrievedAt={profile?.retrievedAt ? new Date(profile.retrievedAt) : new Date()}
      boundaryVintage={profile?.boundaryVintage ?? undefined}
    />
  );

  const isLoading = profileQ.isLoading && historyQ.isLoading;
  const hasAnyData = Boolean(profile) || history.length > 0;

  // Reference year shown under each Census figure ("Census 2011").
  const refYear = profile?.year ?? 2011;
  const censusSub = t("censusYear", { year: String(refYear) });

  // Headline population: the profile figure, else the 2011 Census row from
  // history, else the latest non-estimate row. Never an estimate.
  const headlinePopulation = (() => {
    if (profile?.totalPopulation) return { year: profile.year, value: profile.totalPopulation };
    const census2011 = history.find((h) => h.year === 2011 && !h.source?.startsWith("Estimate"));
    if (census2011) return { year: 2011, value: census2011.population };
    const nonEstimate = [...history].reverse().find((h) => !h.source?.startsWith("Estimate"));
    if (nonEstimate) return { year: nonEstimate.year, value: nonEstimate.population };
    return null;
  })();

  // ── Numbers for the pictures and sentences, straight from the profile. ──
  const literacy = typeof profile?.literacyTotal === "number" && profile.literacyTotal > 0 ? profile.literacyTotal : null;
  const sexRatio = typeof profile?.sexRatio === "number" && profile.sexRatio > 0 ? profile.sexRatio : null;
  const womenPerTenMen = sexRatio ? sexRatio / 100 : null;
  const thousand = f.number(1000);

  // The population at each Census (Census rows only).
  const censusRows = Array.from(
    new Map(history.filter((h) => CENSUS_SOURCE.test(h.source ?? "") && h.population > 0).map((h) => [h.year, h] as const)).values(),
  ).sort((a, b) => a.year - b.year);
  const firstCensus = censusRows[0];
  const lastCensus = censusRows[censusRows.length - 1];
  const showTrend = censusRows.length >= 2;

  // Towns and villages (only from real counts).
  const urbanCount = typeof profile?.urbanPopulation === "number" && profile.urbanPopulation > 0 ? profile.urbanPopulation : null;
  const ruralCount = typeof profile?.ruralPopulation === "number" && profile.ruralPopulation > 0 ? profile.ruralPopulation : null;
  const showTowns = urbanCount !== null && ruralCount !== null;
  const urbanShare = showTowns ? urbanCount / (urbanCount + ruralCount) : 0;

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
        label: t.has(`religions.${k}`) ? t(`religions.${k}`) : k,
        value: pct(religion[k] as number, 2),
      }))
    : [];

  const caste = (profile?.caste ?? null) as CasteMap | null;
  const casteRows = caste
    ? (["SC", "ST", "Other"] as const).filter((k) => typeof caste[k] === "number").map((k) => ({ label: t(`caste.${k}`), value: pct(caste[k] as number, 2) }))
    : [];

  const litMale = typeof profile?.literacyMale === "number" ? profile.literacyMale : null;
  const litFemale = typeof profile?.literacyFemale === "number" ? profile.literacyFemale : null;
  const literacyRows = [
    { label: t("male"), v: litMale },
    { label: t("female"), v: litFemale },
    { label: t("districtTotal"), v: literacy },
  ]
    .filter((r) => typeof r.v === "number")
    .map((r) => ({ label: r.label, value: pct(r.v as number) }));

  const education = (profile?.education ?? null) as EducationData | null;
  const educationRows = education
    ? EDUCATION_LEVELS.filter((l) => typeof education[l.key] === "number").map((l) => ({ label: t(`education.${l.key}`), n: education[l.key] as number }))
    : [];
  const topEducation = educationRows.length > 0 ? [...educationRows].sort((a, b) => b.n - a.n)[0] : null;

  const employment = (profile?.employment ?? null) as EmploymentData | null;
  const employmentRows = employment
    ? [
        { label: t("employment.main"), v: employment.mainWorkersPct },
        { label: t("employment.marginal"), v: employment.marginalWorkersPct },
        { label: t("employment.non"), v: employment.nonWorkersPct },
        { label: t("employment.wpr"), v: employment.workerParticipationRate },
      ]
        .filter((r) => typeof r.v === "number")
        .map((r) => ({ label: r.label, value: pct(r.v as number, 2) }))
    : [];

  const amenities = (profile?.householdAmenities ?? null) as HouseholdAmenitiesData | null;
  const amenityRows = amenities
    ? AMENITIES.filter((a) => typeof amenities[a.key] === "number").map((a) => ({ label: t(`amenities.${a.key}`), n: amenities[a.key] as number }))
    : [];
  const amenityHigh = amenityRows.length > 1 ? [...amenityRows].sort((a, b) => b.n - a.n)[0] : null;
  const amenityLow = amenityRows.length > 1 ? [...amenityRows].sort((a, b) => a.n - b.n)[0] : null;

  const migration = (profile?.migration ?? null) as MigrationData | null;
  const origins = migration ? migrationOrigins(migration) : [];
  const reasons = migration ? migrationReasons(migration) : [];
  const topReason = reasons.length > 0 ? [...reasons].sort((a, b) => b.value - a.value)[0] : null;
  const migrationRows = [
    ...origins.map((o) => ({ label: t("migrationFrom", { origin: t(`origins.${o.key}`) }), value: pct(o.value, 2) })),
    ...reasons.map((r) => ({ label: t("migrationReason", { reason: t(`reasons.${r.key}`) }), value: pct(r.value, 2) })),
  ];

  const language = (profile?.language ?? null) as LanguageData | null;
  const languageRows = language?.top10 ? [...language.top10].sort((a, b) => b.pct - a.pct) : [];

  const economicClass = (profile?.economicClass ?? null) as EconomicClassData | null;
  const hasMpi = Boolean(economicClass && (typeof economicClass.mpiHeadcount === "number" || typeof economicClass.mpi === "number"));

  // Which charts have data here; the rest are named in one line, not drawn empty.
  const has = {
    age: ages.length > 0,
    religion: religionRows.length > 0,
    caste: casteRows.length > 0,
    literacy: literacyRows.length > 0,
    education: educationRows.length > 0,
    employment: employmentRows.length > 0,
    amenities: amenityRows.length > 0,
    migration: migrationRows.length > 0,
    language: languageRows.length > 0,
    sexRatio: canRenderSexRatioGauge(profile),
    mpi: hasMpi,
  };
  const missing = (Object.keys(has) as Array<keyof typeof has>).filter((k) => !has[k]).map((k) => t(`short.${k}`));
  const listFormat = new Intl.ListFormat(f.intl, { style: "long", type: "conjunction" });

  // The literacy and sex-ratio sentence: whichever figures exist.
  const simpleKey = literacy && sexRatio ? "simpleBoth" : literacy ? "simpleLiteracy" : sexRatio ? "simpleRatio" : null;

  // Other Census numbers, each only when the Census has it.
  const moreRows = [
    { emoji: "🧒", label: t("statChildSexRatio"), value: profile?.childSexRatio ? t("childRatioValue", { v: int(profile.childSexRatio), thousand }) : null },
    { emoji: "🏘️", label: t("statDensity"), value: profile?.density ? t("densityValue", { v: int(profile.density) }) : null },
    { emoji: "🏠", label: t("households"), value: profile?.households ? int(profile.households) : null },
    {
      emoji: "👪",
      label: t("avgHousehold"),
      value: profile?.avgHouseholdSize ? f.number(profile.avgHouseholdSize, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null,
    },
    { emoji: "👨", label: t("menCount"), value: profile?.malePopulation ? int(profile.malePopulation) : null },
    { emoji: "👩", label: t("womenCount"), value: profile?.femalePopulation ? int(profile.femalePopulation) : null },
    { emoji: "📐", label: t("areaLabel"), value: profile?.areaSqKm ? t("areaValue", { v: int(profile.areaSqKm) }) : null },
    { emoji: "🎂", label: t("medianAge"), value: profile?.medianAge ? t("medianAgeValue", { v: f.number(profile.medianAge, { maximumFractionDigits: 1 }) }) : null },
  ];
  const moreCount = moreRows.filter((r) => r.value).length;

  const chartGrid: React.CSSProperties = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
    alignItems: "start",
  };

  return (
    <ModulePage>
      <PageHeader
        icon={Users}
        title={t("title")}
        description={t("description")}
        backHref={base}
        freshness={{ asOf: profileQ.data?.meta.lastUpdated ?? null }}
        source={{ label: tOv("censusOfIndia"), href: "https://censusindia.gov.in" }}
      />

      <AIInsightCard module="population" district={district} />

      {isLoading && <LoadingShell rows={8} />}
      {profileQ.error && <ErrorBlock />}

      {!isLoading && !hasAnyData && (
        <EmptyState
          emoji="📈"
          title={tNo("population.title")}
          body={tNo("population.body", { district: districtName })}
          action={<p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>{tNo("footer")}</p>}
        />
      )}

      {!isLoading && hasAnyData && (
        <>
          {(headlinePopulation || simpleKey) && (
          <Explainer emoji="👥">
            {headlinePopulation && (
              <>
                {t.rich("answerPop", { name: districtName, pop: int(headlinePopulation.value), year: String(headlinePopulation.year), b: boldNum })}{" "}
              </>
            )}
            {simpleKey &&
              t.rich(simpleKey, {
                name: districtName,
                lit: literacy ? String(Math.round(literacy / 10)) : "",
                ratio: sexRatio ? f.number(sexRatio) : "",
                thousand,
                year: String(refYear),
                b: boldNum,
              })}
          </Explainer>
          )}
          {/* How old the Census is: Census 2011 is the baseline until 2027. */}
          <p className="ftp-prose" style={{ color: "var(--ftp-text-2)", margin: "-8px 0 16px", fontSize: 13, lineHeight: "20px" }}>
            <span className="ftp-emoji" aria-hidden>📅 </span>
            <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{t("currencyLead")}</span> {t("currencyBody")}
          </p>

          <StatStrip cols={4}>
            <StatTile
              emoji="👥"
              label={headlinePopulation ? t("statPopulationYear", { year: String(headlinePopulation.year) }) : t("statPopulation")}
              value={headlinePopulation ? int(headlinePopulation.value) : "—"}
              asOfPeriod={headlinePopulation ? t("censusYear", { year: String(headlinePopulation.year) }) : undefined}
            />
            <StatTile
              emoji="📖"
              label={t("statLiteracy")}
              value={literacy ? f.number(literacy, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
              unit={literacy ? "%" : undefined}
              sub={t("statLiteracySub")}
              asOfPeriod={censusSub}
            />
            <StatTile emoji="⚖️" label={t("statSexRatio")} value={sexRatio ? int(sexRatio) : "—"} sub={t("statSexRatioSub")} asOfPeriod={censusSub} />
            <StatTile
              emoji="🏙️"
              label={t("statUrban")}
              value={profile?.urbanPct ? f.number(profile.urbanPct, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
              unit={profile?.urbanPct ? "%" : undefined}
              sub={t("statUrbanSub")}
              asOfPeriod={censusSub}
            />
          </StatStrip>

          {/* The picture row: readers, men and women, and the other Census numbers. */}
          {(literacy || womenPerTenMen || moreCount > 0) && (
            <div style={{ marginTop: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", alignItems: "stretch" }}>
              {literacy ? (
                <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                    <span className="ftp-emoji" aria-hidden>📖 </span>
                    {t("readersTitle")}
                  </p>
                  <Pictogram filled={literacy / 10} emoji="📖" label={t("literacyPicto", { n: Math.round(literacy / 10), pct: pct(literacy) })} />
                  <AsOfText period={censusSub} />
                </Card>
              ) : null}
              {womenPerTenMen && sexRatio ? (
                <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                    <span className="ftp-emoji" aria-hidden>👫 </span>
                    {t("menAndWomen")}
                  </p>
                  <SexRatioPicture womenPerTenMen={womenPerTenMen} sexRatio={sexRatio} />
                  <AsOfText period={censusSub} />
                </Card>
              ) : null}
              {moreCount > 0 && (
                <Card padding={18} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                    <span className="ftp-emoji" aria-hidden>🔢 </span>
                    {t("moreTitle")}
                  </p>
                  <DetailList rows={moreRows} />
                  <AsOfText period={censusSub} />
                  {profile?.childSexRatio ? <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("childNote")}</p> : null}
                </Card>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <DemographicDisclaimer districtName={districtName} defaultOpen={false} />
          </div>

          <Section emoji="📊" title={t("chartsTitle")}>
            <div style={chartGrid}>
              {showTrend && firstCensus && lastCensus && (
                <ChartCard
                  title={t("trendTitle")}
                  emoji="📈"
                  units={t("trendUnits")}
                  simple={t.rich("trendSimple", {
                    first: String(firstCensus.year),
                    last: String(lastCensus.year),
                    from: int(firstCensus.population),
                    to: int(lastCensus.population),
                    b: boldNum,
                  })}
                  source={{ label: tOv("censusOfIndia"), href: "https://censusindia.gov.in" }}
                  asOfPeriod={t("censusYear", { year: String(lastCensus.year) })}
                  table={censusRows.map((r) => ({ label: t("censusYear", { year: String(r.year) }), value: int(r.population) }))}
                >
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <BarChart data={censusRows.map((r) => ({ year: String(r.year), population: r.population }))} margin={{ left: 0, right: 8, top: 8 }}>
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                        <XAxis dataKey="year" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                        <YAxis
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                          tickFormatter={(v: number) => f.number(v, { notation: "compact", maximumFractionDigits: 1 })}
                        />
                        <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? f.number(v) : "—")} />
                        <Bar dataKey="population" name={t("trendTooltip")} fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}

              {showTowns && urbanCount !== null && ruralCount !== null && (
                <ChartCard
                  title={t("townsTitle")}
                  emoji="🏙️"
                  units={t("townsUnits")}
                  simple={
                    Math.round(urbanShare * 10) === 0
                      ? t.rich("townsSimpleFew", { name: districtName, b: boldNum })
                      : Math.round(urbanShare * 10) === 10
                        ? t.rich("townsSimpleAll", { name: districtName, pct: f.number(urbanShare, { style: "percent", maximumFractionDigits: 0 }), b: boldNum })
                        : t.rich("townsSimple", { n: String(Math.round(urbanShare * 10)), name: districtName, b: boldNum })
                  }
                  source={{ label: tOv("censusOfIndia"), href: "https://censusindia.gov.in" }}
                  asOfPeriod={censusSub}
                  table={[
                    { label: t("towns"), value: int(urbanCount) },
                    { label: t("villages"), value: int(ruralCount) },
                  ]}
                >
                  <ShareDonut
                    slices={[
                      { key: "urban", label: t("towns"), value: urbanCount, emoji: "🏙️", color: "var(--hue-deep)" },
                      { key: "rural", label: t("villages"), value: ruralCount, emoji: "🏡", color: "var(--hue-pop)" },
                    ]}
                    centerValue={f.number(urbanShare, { style: "percent", maximumFractionDigits: 0 })}
                    centerLabel={t("towns")}
                    ariaLabel={t("townsAria", {
                      urban: f.number(urbanShare, { style: "percent", maximumFractionDigits: 0 }),
                      rural: f.number(1 - urbanShare, { style: "percent", maximumFractionDigits: 0 }),
                    })}
                  />
                </ChartCard>
              )}

              {has.age && (
                <ChartCard
                  title={t("ageTitle")}
                  emoji="🎂"
                  units={t("ageUnits")}
                  simple={biggestAge ? t.rich("ageSimple", { band: bandWords(biggestAge.band), n: int(biggestAge.value), b: boldNum }) : undefined}
                  table={<RowsTable caption={t("ageCaption")} rows={ages.map((r) => ({ label: t("ageRow", { band: bandWords(r.band) }), value: int(r.value) }))} cite={cite()} />}
                >
                  <AgePyramidStacked
                    pop_0_6={profile?.pop_0_6 ?? null}
                    pop_7_14={profile?.pop_7_14 ?? null}
                    pop_15_59={profile?.pop_15_59 ?? null}
                    pop_60_plus={profile?.pop_60_plus ?? null}
                  />
                  {cite()}
                </ChartCard>
              )}

              {has.literacy && (
                <ChartCard
                  title={t("literacyTitle")}
                  emoji="📖"
                  units={t("literacyUnits")}
                  simple={
                    litMale !== null && litFemale !== null
                      ? t.rich("literacySimple", {
                          m: pct(litMale),
                          w: pct(litFemale),
                          gap: f.number(Math.abs(litMale - litFemale), { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                          b: boldNum,
                        })
                      : undefined
                  }
                  table={<RowsTable caption={t("literacyCaption")} rows={literacyRows} cite={cite()} />}
                >
                  <LiteracyDumbbell literacyTotal={profile?.literacyTotal ?? null} literacyMale={profile?.literacyMale ?? null} literacyFemale={profile?.literacyFemale ?? null} />
                  {cite()}
                </ChartCard>
              )}

              {has.education && (
                <ChartCard
                  title={t("educationTitle")}
                  emoji="🎓"
                  units={t("educationUnits")}
                  simple={topEducation ? t.rich("educationSimple", { level: topEducation.label, pct: pct(topEducation.n), b: bold }) : undefined}
                  table={<RowsTable caption={t("educationCaption")} rows={educationRows.map((r) => ({ label: r.label, value: pct(r.n, 2) }))} cite={cite()} />}
                >
                  <EducationBreakdownBar education={education} />
                  {cite()}
                </ChartCard>
              )}

              {has.employment && (
                <ChartCard
                  title={t("employmentTitle")}
                  emoji="👷"
                  units={t("employmentUnits")}
                  simple={
                    employment &&
                    typeof employment.mainWorkersPct === "number" &&
                    typeof employment.marginalWorkersPct === "number" &&
                    typeof employment.nonWorkersPct === "number"
                      ? t.rich("employmentSimple", {
                          main: pct(employment.mainWorkersPct),
                          marginal: pct(employment.marginalWorkersPct),
                          non: pct(employment.nonWorkersPct),
                          b: boldNum,
                        })
                      : undefined
                  }
                  table={<RowsTable caption={t("employmentCaption")} rows={employmentRows} cite={cite()} />}
                >
                  <EmploymentStackedBar employment={employment} />
                  {cite()}
                </ChartCard>
              )}

              {has.amenities && (
                <ChartCard
                  title={t("amenitiesTitle")}
                  emoji="🏠"
                  units={t("amenitiesUnits")}
                  simple={
                    amenityHigh && amenityLow
                      ? t.rich("amenitiesSimple", { high: amenityHigh.label, highPct: pct(amenityHigh.n), low: amenityLow.label, lowPct: pct(amenityLow.n), b: bold })
                      : undefined
                  }
                  table={<RowsTable caption={t("amenitiesCaption")} rows={amenityRows.map((r) => ({ label: r.label, value: pct(r.n) }))} cite={cite()} />}
                >
                  <HouseholdAmenitiesWaffle amenities={amenities} />
                  {cite()}
                </ChartCard>
              )}

              {has.language && (
                <ChartCard
                  title={t("languageTitle")}
                  emoji="🗣️"
                  units={t("languageUnits")}
                  simple={t.rich("languageSimple", { name: languageRows[0].name, pct: pct(languageRows[0].pct), b: bold })}
                  table={<RowsTable caption={t("languageCaption")} rows={languageRows.map((l) => ({ label: l.name, value: pct(l.pct) }))} cite={cite()} />}
                >
                  <LanguageBarChart language={language} />
                  {cite()}
                </ChartCard>
              )}

              {has.migration && (
                <ChartCard
                  title={t("migrationTitle")}
                  emoji="🧳"
                  units={t("migrationUnits")}
                  simple={
                    migration && (typeof migration.totalInMigrantsPct === "number" || topReason) ? (
                      <>
                        {typeof migration.totalInMigrantsPct === "number" && <>{t.rich("migrationSimplePct", { pct: pct(migration.totalInMigrantsPct), b: boldNum })} </>}
                        {topReason && t.rich("migrationSimpleReason", { reason: t(`reasons.${topReason.key}`), b: bold })}
                      </>
                    ) : undefined
                  }
                  table={<RowsTable caption={t("migrationCaption")} rows={migrationRows} cite={cite()} />}
                >
                  <MigrationBreakdown migration={migration} />
                  {cite()}
                </ChartCard>
              )}

              {/* Its sentence says how far the figure is from equal, not the figure again. */}
              {has.sexRatio && (
                <ChartCard
                  title={t("sexRatioTitle")}
                  emoji="⚖️"
                  units={t("sexRatioUnits")}
                  simple={
                    sexRatio
                      ? sexRatio === 1000
                        ? t("sexRatioEqual")
                        : t.rich(sexRatio < 1000 ? "sexRatioFewer" : "sexRatioMore", { n: f.number(Math.abs(1000 - sexRatio)), thousand, b: boldNum })
                      : undefined
                  }
                  table={
                    <RowsTable
                      caption={t("sexRatioCaption")}
                      rows={[
                        { label: t("sexRatioAll"), value: profile?.sexRatio != null ? int(profile.sexRatio) : "—" },
                        ...(typeof profile?.childSexRatio === "number" ? [{ label: t("sexRatioChild"), value: int(profile.childSexRatio) }] : []),
                      ]}
                      cite={cite()}
                    />
                  }
                >
                  <SexRatioGauge sexRatio={profile?.sexRatio ?? null} childSexRatio={profile?.childSexRatio ?? null} />
                  {cite()}
                </ChartCard>
              )}

              {/* Religion (alphabetical on purpose; the sentence never ranks) and caste. */}
              {has.religion && (
                <ChartCard
                  title={t("religionTitle")}
                  emoji="🧩"
                  units={t("religionUnits")}
                  simple={t("religionSimple")}
                  table={<RowsTable caption={t("religionCaption")} rows={religionRows} cite={cite()} />}
                >
                  <ReligionDonut religion={profile?.religion ?? null} />
                  {cite()}
                </ChartCard>
              )}

              {has.caste && (
                <ChartCard
                  title={t("casteTitle")}
                  emoji="🗂️"
                  units={t("casteUnits")}
                  simple={t("casteSimple")}
                  table={<RowsTable caption={t("casteCaption")} rows={casteRows} cite={cite()} />}
                >
                  <CasteStackedBar caste={caste} />
                  {cite()}
                </ChartCard>
              )}
            </div>

            {missing.length > 0 && (
              <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                <span className="ftp-emoji" aria-hidden>🗂️ </span>
                {t("missingLine", { list: listFormat.format(missing) })}
              </p>
            )}
          </Section>

          {/* Economic class (NITI MPI): the component draws its own tiles. */}
          {has.mpi && (
            <Section title={t("mpiTitle")} emoji="🧾">
              <MPIIndicatorCard economicClass={economicClass} />
            </Section>
          )}
        </>
      )}

      <SourcesFooter sources={sources.sources.map((name) => ({ name }))} />
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "8px 0 0" }}>{t("frequency")}</p>

      {/* Related news (targetModule === "population") */}
      <ModuleNews district={district} state={state} locale={locale} module="population" />

      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=population&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </ModulePage>
  );
}

export default function PopulationPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("population")}>
      <PopulationPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

/**
 * The sex-ratio picture: a row of 10 men, and under it the matching number
 * of women (sexRatio ÷ 100). 985 → 9.85 women; above 1,000 the row grows
 * past 10. Straight from the Census figure, nothing rounded away.
 */
function SexRatioPicture({ womenPerTenMen, sexRatio }: { womenPerTenMen: number; sexRatio: number }) {
  const t = useTranslations("page_population");
  const f = useFormat();
  const womenTotal = Math.max(10, Math.ceil(womenPerTenMen));
  return (
    <div role="group" aria-label={t("sexRatioGroup", { ratio: f.number(sexRatio), thousand: f.number(1000) })} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Pictogram filled={10} total={10} emoji="👨" size={16} label={t("tenMen")} />
      <Pictogram
        filled={womenPerTenMen}
        total={womenTotal}
        emoji="👩"
        size={16}
        label={t("aboutWomen", { n: f.number(womenPerTenMen, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
      />
    </div>
  );
}

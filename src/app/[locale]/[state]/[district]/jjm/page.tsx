/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Jal Jeevan Mission — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useJJM() → one row per village (households, tap connections,
//  coverage %, water-quality test). Each row has its own updatedAt; the
//  newest one is the "as of" for the headline tiles.
//  Urban districts in states where JJM does not apply get a short note
//  pointing to the municipal water board instead of an empty table.
//
//  Picture: a water tank filled to the district's real tap coverage and
//  ten houses with the same share lit. Both use the same totals as the
//  tiles; with no households on record the picture is not drawn.
"use client";
import { use } from "react";
import { AlertTriangle, CheckCircle2, Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useJJM } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  DataTable,
  LoadingShell,
  ErrorBlock,
  AsOfText,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, WaterTank, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getStateConfig } from "@/lib/constants/state-config";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const EJALSHAKTI = { label: "eJalShakti", href: "https://ejalshakti.gov.in" };

/** Coverage → text colour: 100 % green, 50 %+ amber, below that red. */
function coverageColor(pct: number): string {
  return pct >= 100 ? "var(--ftp-live-text)" : pct >= 50 ? "var(--ftp-warn)" : "var(--ftp-danger)";
}

function JJMPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useJJM(district, state);

  const villages = data?.data ?? [];
  const totalHH = villages.reduce((s, v) => s + v.totalHouseholds, 0);
  const totalTaps = villages.reduce((s, v) => s + v.tapConnections, 0);
  const overallCoverage = totalHH > 0 ? (totalTaps / totalHH) * 100 : 0;
  const tested = villages.filter((v) => v.waterQualityTested).length;
  const testedPct = villages.length > 0 ? (tested / villages.length) * 100 : 0;
  const fullyConverted = villages.filter((v) => v.coveragePct >= 100).length;

  // Newest update across all villages (ISO strings sort correctly as text).
  const asOf = villages.reduce<string | null>((m, v) => (!m || v.updatedAt > m ? v.updatedAt : m), null);

  const chartData = [...villages]
    .sort((a, b) => b.coveragePct - a.coveragePct)
    .slice(0, 20)
    .map((v) => ({
      name: (v.villageName ?? "Unknown").slice(0, 12),
      nameFull: v.villageName ?? "Unknown village",
      coverage: Math.round(v.coveragePct),
      full: v.coveragePct >= 100,
    }));
  const fullInChart = chartData.filter((d) => d.full).length;

  // Houses lit out of 10: the same share the tank shows.
  const homesOfTen = Math.round(Math.min(100, overallCoverage) / 10);

  // Urban districts where JJM does not apply: point to the water board.
  const sc = getStateConfig(state);
  const urbanWaterBoard = sc && !sc.jjmApplicable && sc.waterBoard ? sc.waterBoard : null;
  const districtName = district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <ModulePage>
      <PageHeader
        icon={Droplets}
        title="Jal Jeevan Mission"
        description="Tap water connection coverage across villages"
        backHref={base}
        accent={getModuleAccent("jjm")}
        freshness={asOf ? { asOf } : undefined}
        source={EJALSHAKTI}
      />

      <AIInsightCard module="jjm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && villages.length === 0 && (
        urbanWaterBoard ? (
          <Card tinted style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                🚰
              </span>
              <h2 className="ftp-title" style={{ fontWeight: 600 }}>Municipal water supply</h2>
            </div>
            <p className="ftp-body" style={{ margin: "0 0 8px" }}>
              Jal Jeevan Mission provides tap water connections to rural households. {districtName} is an urban district —
              its water supply is managed by {urbanWaterBoard}.
            </p>
            <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0 }}>
              For water supply complaints and information, contact {urbanWaterBoard} or visit the{" "}
              {sc?.municipalBody ?? "municipal corporation"} portal.
            </p>
          </Card>
        ) : (
          <NoDataCard module="jjm" district={district} state={state} isUrban={true} />
        )
      )}

      {!isLoading && villages.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏘️" label="Villages tracked" value={villages.length.toLocaleString("en-IN")} asOf={asOf} />
            <StatTile emoji="💧" label="Overall coverage" value={overallCoverage.toFixed(1)} unit="%" asOf={asOf} />
            <StatTile emoji="🚰" label="Tap connections" value={totalTaps.toLocaleString("en-IN")} asOf={asOf} />
            <StatTile emoji="🏠" label="Total households" value={totalHH.toLocaleString("en-IN")} asOf={asOf} />
            <StatTile emoji="✅" label="Fully covered" value={fullyConverted.toLocaleString("en-IN")} sub="villages at 100%" asOf={asOf} />
            <StatTile emoji="🧪" label="Quality tested" value={testedPct.toFixed(0)} unit="%" sub="of villages" asOf={asOf} />
          </StatStrip>

          {/* The picture: a tank filled to the real coverage, and ten houses
              with the same share lit. Only when households are on record. */}
          {totalHH > 0 && (
            <Section title="District-wide tap coverage" emoji="🚰" action={<AsOfText asOf={asOf} />}>
              <div className="ftp-picture-row">
                <Card tinted padding={18}>
                  <Explainer title="In simple words" emoji="💧">
                    In the {villages.length.toLocaleString("en-IN")} villages we track,{" "}
                    <strong className="ftp-num">{totalTaps.toLocaleString("en-IN")}</strong> of{" "}
                    <strong className="ftp-num">{totalHH.toLocaleString("en-IN")}</strong> homes have a tap connection at home.
                  </Explainer>
                  <Pictogram
                    filled={Math.min(100, overallCoverage) / 10}
                    emoji="🏠"
                    label={`About ${homesOfTen} of every 10 homes have a tap connection.`}
                  />
                </Card>
                <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WaterTank pct={overallCoverage} label="Homes with a tap connection" />
                </Card>
              </div>
            </Section>
          )}

          {/* Bar chart of the 20 best-covered villages. */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={chartData.length < villages.length ? `The ${chartData.length} best-covered villages` : "Tap coverage in each village"}
                emoji="🏘️"
                units="Share of homes with a tap, per village (%). The dashed line is 100%: a tap in every home."
                simple={
                  fullInChart > 0 ? (
                    <>
                      <strong>{fullInChart === chartData.length ? `All ${chartData.length}` : `${fullInChart} of these ${chartData.length}`}</strong>{" "}
                      {fullInChart === 1 ? "village has" : "villages have"} a tap in every home.
                    </>
                  ) : (
                    <>
                      The best-covered village, <strong>{chartData[0].nameFull}</strong>, has a tap in {chartData[0].coverage}% of homes.
                    </>
                  )
                }
                legend={[
                  { label: "Homes with a tap", swatch: "linear-gradient(180deg, var(--hue), var(--hue-pop))" },
                  { label: "Every home (100%)", swatch: "var(--hue-deep)" },
                ]}
                source={EJALSHAKTI}
                asOf={asOf}
                table={chartData.map((d) => ({ label: d.nameFull, value: `${d.coverage}%` }))}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ ...CHART_AXIS, fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={CHART_AXIS} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v) => [`${Number(v)}%`, "Homes with a tap"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.nameFull ?? ""}
                    />
                    <ReferenceLine y={100} stroke="var(--hue-deep)" strokeDasharray="4 4" />
                    <Bar dataKey="coverage" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name="Coverage" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Village list. */}
          <Section title="Village-wise status" emoji="📋">
            <DataTable
              caption={`Jal Jeevan Mission status by village in ${districtName}`}
              columns={[
                { key: "village", label: "Village" },
                { key: "taps", label: "Taps / households", numeric: true },
                { key: "coverage", label: "Coverage", numeric: true },
                { key: "quality", label: "Water quality" },
              ]}
              rows={villages.map((v) => ({
                village: v.villageName ?? "Unknown village",
                taps: `${v.tapConnections.toLocaleString("en-IN")} / ${v.totalHouseholds.toLocaleString("en-IN")}`,
                coverage: <span style={{ color: coverageColor(v.coveragePct) }}>{Math.round(v.coveragePct)}%</span>,
                quality: v.waterQualityTested ? (
                  v.waterQualityResult === "safe" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-live-text)" }}>
                      <CheckCircle2 size={13} aria-hidden /> Safe
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-warn)" }}>
                      <AlertTriangle size={13} aria-hidden /> Quality issue
                    </span>
                  )
                ) : (
                  <span style={{ color: "var(--ftp-text-2)" }}>Not tested</span>
                ),
              }))}
            />
          </Section>
        </>
      )}

      <ModuleSources module="jjm" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="jjm" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="jjm"
        moduleLabel="Jal Jeevan Mission"
        shareText={
          villages.length > 0
            ? `Jal Jeevan Mission in ${districtName}: ${overallCoverage.toFixed(1)}% of households have a tap connection`
            : `Water supply information for ${districtName}`
        }
      />
    </ModulePage>
  );
}

export default function JJMPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Jal Jeevan Mission">
      <JJMPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

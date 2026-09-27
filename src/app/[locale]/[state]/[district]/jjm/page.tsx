/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Jal Jeevan Mission — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useJJM() → one row per village (households, tap connections,
//  coverage %, water-quality test). Each row has its own updatedAt; the
//  newest one is the "as of" for the headline tiles.
//  Urban districts in states where JJM does not apply get a short note
//  pointing to the municipal water board instead of an empty table.
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
  ProgressBar,
  DataTable,
  LoadingShell,
  ErrorBlock,
  AsOfText,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getStateConfig } from "@/lib/constants/state-config";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

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
      coverage: Math.round(v.coveragePct),
    }));

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
        source={{ label: "eJalShakti", href: "https://ejalshakti.gov.in" }}
      />

      <AIInsightCard module="jjm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && villages.length === 0 && (
        urbanWaterBoard ? (
          <Card style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Droplets size={18} aria-hidden style={{ color: "var(--ftp-brand)" }} />
              <h2 className="ftp-title">Municipal Water Supply</h2>
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
            <StatTile label="Villages tracked" value={villages.length.toLocaleString("en-IN")} icon={Droplets} asOf={asOf} />
            <StatTile label="Overall coverage" value={overallCoverage.toFixed(1)} unit="%" asOf={asOf} />
            <StatTile label="Tap connections" value={totalTaps.toLocaleString("en-IN")} asOf={asOf} />
            <StatTile label="Total households" value={totalHH.toLocaleString("en-IN")} asOf={asOf} />
            <StatTile label="Fully covered" value={fullyConverted.toLocaleString("en-IN")} sub="villages at 100%" asOf={asOf} />
            <StatTile label="Quality tested" value={testedPct.toFixed(0)} unit="%" sub="of villages" asOf={asOf} />
          </StatStrip>

          {/* District-wide progress. */}
          <Section title="District-wide tap coverage" action={<AsOfText asOf={asOf} />}>
            <Card>
              <ProgressBar label="Households with a tap connection" pct={overallCoverage} tone="teal" />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span><span className="ftp-num">{totalTaps.toLocaleString("en-IN")}</span> taps connected</span>
                <span><span className="ftp-num">{totalHH.toLocaleString("en-IN")}</span> total households</span>
              </div>
            </Card>
          </Section>

          {/* Bar chart of the 20 best-covered villages. */}
          {chartData.length > 0 && (
            <Section title="Village coverage % (top 20)">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                    <XAxis dataKey="name" tick={{ ...CHART.tick, fontSize: 10 }} stroke={CHART.axis} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={CHART.tick} stroke={CHART.axis} width={36} domain={[0, 100]} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "var(--ftp-surface-2)" }} formatter={(v) => [`${Number(v)}%`, "Coverage"]} />
                    <ReferenceLine y={100} stroke={CHART.secondary} strokeDasharray="4 4" />
                    <Bar dataKey="coverage" fill={CHART.primary} radius={[4, 4, 0, 0]} name="Coverage" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* Village list. */}
          <Section title="Village-wise status">
            <DataTable
              caption={`Jal Jeevan Mission status by village in ${districtName}`}
              columns={[
                { key: "village", label: "Village" },
                { key: "taps", label: "Taps / households", numeric: true },
                { key: "coverage", label: "Coverage", numeric: true },
                { key: "quality", label: "Water quality" },
              ]}
              rows={villages.map((v) => ({
                village: v.villageName ?? "Unknown Village",
                taps: `${v.tapConnections.toLocaleString("en-IN")} / ${v.totalHouseholds.toLocaleString("en-IN")}`,
                coverage: <span style={{ color: coverageColor(v.coveragePct) }}>{Math.round(v.coveragePct)}%</span>,
                quality: v.waterQualityTested ? (
                  v.waterQualityResult === "safe" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-live-text)" }}>
                      <CheckCircle2 size={13} aria-hidden /> Safe
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-warn)" }}>
                      <AlertTriangle size={13} aria-hidden /> Quality Issue
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

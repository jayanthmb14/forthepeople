/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Housing — Design v4 "Rang" module page (see docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useHousing() → one row per housing scheme per fiscal year
//  (target, sanctioned, completed, in progress, funds). Rows carry a
//  fiscal year rather than a timestamp, so the tiles name the fiscal
//  year(s) they cover. Funds are stored in whole rupees and only turned
//  into crores for display.
//
//  Order: PageHeader → summary → AI insight → emoji StatTiles → picture
//  (10 houses, N finished, plus a dial) → scheme chart in a ChartCard →
//  one card per scheme → sources → news → toolbar. Colours come from the
//  page hue (orange for housing), set by HueScope in the district layout.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { Home } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useHousing } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const AWAASSOFT = { label: "AwaasSoft", href: "https://pmayg.nic.in" };

/** Whole rupees → "₹12.3Cr" for display only. */
function crore(rupees: number): string {
  return `₹${(rupees / 10000000).toFixed(1)}Cr`;
}

/** One small labelled number inside a scheme card. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

function HousingPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useHousing(district, state);

  const schemes = data?.data ?? [];
  const totalTarget = schemes.reduce((s, h) => s + h.targetHouses, 0);
  const totalCompleted = schemes.reduce((s, h) => s + h.completed, 0);
  const totalInProgress = schemes.reduce((s, h) => s + h.inProgress, 0);
  const totalSanctioned = schemes.reduce((s, h) => s + h.sanctioned, 0);
  const overallPct = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

  // Fiscal years covered, e.g. "FY 2024-25" or "FY 2023-24 to 2024-25".
  const years = Array.from(new Set(schemes.map((h) => h.fiscalYear))).sort();
  const fyLabel = years.length === 0 ? undefined : years.length === 1 ? `FY ${years[0]}` : `FY ${years[0]} to ${years[years.length - 1]}`;

  const chartData = schemes.map((h) => ({
    name: h.schemeName.replace("Pradhan Mantri", "PM").replace("Awaas Yojana", "AY").slice(0, 16),
    // Full name + year for the tooltip and the "Show as table" view.
    full: `${h.schemeName} (FY ${h.fiscalYear})`,
    target: h.targetHouses,
    completed: h.completed,
    inProgress: h.inProgress,
    remaining: Math.max(0, h.targetHouses - h.sanctioned),
  }));
  // The scheme with the most finished houses, for the chart's one-line summary.
  const topScheme = [...chartData].sort((a, b) => b.completed - a.completed)[0];

  return (
    <ModulePage>
      <PageHeader
        icon={Home}
        title="Housing"
        description="PMAY and housing scheme progress: houses sanctioned, completed and in progress"
        backHref={base}
        accent={getModuleAccent("housing")}
        source={AWAASSOFT}
      />

      <ModuleSummary>
        This page tracks government housing schemes such as PMAY in this district: how many houses were planned,
        sanctioned, finished and are still being built, and how much money was allocated, released and spent. Figures
        come from AwaasSoft and are grouped by fiscal year.
      </ModuleSummary>

      <AIInsightCard module="housing" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && <NoDataCard module="housing" district={district} state={state} />}

      {!isLoading && schemes.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="🎯" label="Target houses" value={totalTarget.toLocaleString("en-IN")} sub={fyLabel} />
            <StatTile emoji="📝" label="Sanctioned" value={totalSanctioned.toLocaleString("en-IN")} sub={fyLabel} />
            <StatTile emoji="🏠" label="Completed" value={totalCompleted.toLocaleString("en-IN")} sub={fyLabel} />
            <StatTile emoji="🏗️" label="In progress" value={totalInProgress.toLocaleString("en-IN")} sub={fyLabel} />
          </StatStrip>

          {/* The picture: 10 houses, one per tenth of the target, lit for
              the share already finished; plus a dial. Same totals as above. */}
          {totalTarget > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🏠">
                  <strong>{totalCompleted.toLocaleString("en-IN")}</strong> of the{" "}
                  <strong>{totalTarget.toLocaleString("en-IN")}</strong> houses planned{fyLabel ? ` in ${fyLabel}` : ""} are
                  finished, and <strong>{totalInProgress.toLocaleString("en-IN")}</strong> more are being built.
                </Explainer>
                <Pictogram
                  filled={(totalCompleted / totalTarget) * 10}
                  emoji="🏠"
                  label={`About ${Math.round(Math.min(10, (totalCompleted / totalTarget) * 10))} of every 10 planned houses are finished.`}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge
                  value={overallPct}
                  label="Houses completed against target"
                  caption={fyLabel ? `Houses finished, ${fyLabel}` : "Houses finished"}
                />
              </Card>
            </div>
          )}

          {/* Stacked bar chart per scheme. */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Progress by scheme"
                emoji="🏗️"
                units="Number of houses in each scheme"
                simple={
                  topScheme && topScheme.target > 0 ? (
                    <>
                      <strong>{topScheme.full}</strong> has the most finished houses:{" "}
                      {topScheme.completed.toLocaleString("en-IN")} of {topScheme.target.toLocaleString("en-IN")} planned.
                    </>
                  ) : undefined
                }
                legend={[
                  { label: "Completed", swatch: "var(--hue)" },
                  { label: "In progress", swatch: "var(--hue-pop)" },
                  { label: "Not yet sanctioned", swatch: "#D8D5CB" },
                ]}
                source={AWAASSOFT}
                asOfPeriod={fyLabel}
                table={chartData.map((r) => ({
                  label: r.full,
                  value: `${r.completed.toLocaleString("en-IN")} done, ${r.inProgress.toLocaleString("en-IN")} in progress, of ${r.target.toLocaleString("en-IN")}`,
                }))}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ ...CHART_AXIS, fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={CHART_AXIS} width={48} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v, name) => [Number(v).toLocaleString("en-IN"), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                    />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="url(#ftpHueFill)" />
                    <Bar dataKey="inProgress" name="In progress" stackId="a" fill="var(--hue-pop)" />
                    <Bar dataKey="remaining" name="Not yet sanctioned" stackId="a" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* One card per scheme. */}
          <Section title="Scheme details" emoji="📋">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {schemes.map((h) => {
                const completedPct = h.targetHouses > 0 ? (h.completed / h.targetHouses) * 100 : 0;
                const fundsSpentPct = h.fundsAllocated && h.fundsSpent ? (h.fundsSpent / h.fundsAllocated) * 100 : 0;
                return (
                  <Card key={h.id} as="article">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{h.schemeName}</h3>
                        <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>FY {h.fiscalYear}</div>
                      </div>
                      <div className="ftp-bignum" style={{ fontSize: 24, lineHeight: "28px", color: "var(--hue-deep)", flexShrink: 0 }}>
                        {completedPct.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8, marginBottom: 12 }}>
                      <Figure label="Target" value={h.targetHouses.toLocaleString("en-IN")} />
                      <Figure label="Sanctioned" value={h.sanctioned.toLocaleString("en-IN")} />
                      <Figure label="Completed" value={h.completed.toLocaleString("en-IN")} />
                      <Figure label="In progress" value={h.inProgress.toLocaleString("en-IN")} />
                    </div>
                    <ProgressBar label="Houses completed" pct={completedPct} />
                    {h.fundsAllocated ? (
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                        <Figure label="Allocated" value={crore(h.fundsAllocated)} />
                        <Figure label="Released" value={crore(h.fundsReleased ?? 0)} />
                        <Figure label="Spent" value={crore(h.fundsSpent ?? 0)} />
                      </div>
                    ) : null}
                    {h.fundsAllocated && h.fundsSpent ? (
                      <div style={{ marginTop: 10 }}>
                        <ProgressBar label="Funds utilisation" pct={fundsSpentPct} />
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <ModuleSources module="housing" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="housing" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="housing"
        moduleLabel="Housing"
        shareText={
          schemes.length > 0
            ? `Housing in ${district}: ${totalCompleted.toLocaleString("en-IN")} of ${totalTarget.toLocaleString("en-IN")} target houses completed (${overallPct.toFixed(1)}%)`
            : `Housing scheme data for ${district}`
        }
      />
    </ModulePage>
  );
}

export default function HousingPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Housing">
      <HousingPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

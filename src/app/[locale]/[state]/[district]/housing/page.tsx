/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Housing — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useHousing() → one row per housing scheme per fiscal year
//  (target, sanctioned, completed, in progress, funds). Rows carry a
//  fiscal year rather than a timestamp, so the tiles name the fiscal
//  year(s) they cover. Funds are stored in whole rupees and only turned
//  into crores for display.
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
import { ModulePage, ModuleSources, ModuleToolbar, ChartLegend } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

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
    completed: h.completed,
    inProgress: h.inProgress,
    remaining: Math.max(0, h.targetHouses - h.sanctioned),
  }));

  return (
    <ModulePage>
      <PageHeader
        icon={Home}
        title="Housing"
        description="PMAY and housing scheme progress — houses sanctioned, completed, in-progress"
        backHref={base}
        accent={getModuleAccent("housing")}
        source={{ label: "AwaasSoft", href: "https://pmayg.nic.in" }}
      />

      <AIInsightCard module="housing" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && <NoDataCard module="housing" district={district} state={state} />}

      {!isLoading && schemes.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile label="Target houses" value={totalTarget.toLocaleString("en-IN")} icon={Home} sub={fyLabel} />
            <StatTile label="Sanctioned" value={totalSanctioned.toLocaleString("en-IN")} sub={fyLabel} />
            <StatTile label="Completed" value={totalCompleted.toLocaleString("en-IN")} sub={fyLabel} />
            <StatTile label="In progress" value={totalInProgress.toLocaleString("en-IN")} sub={fyLabel} />
          </StatStrip>

          {/* Overall progress. */}
          <Section title="Overall completion">
            <Card>
              <ProgressBar label="Houses completed against target" pct={overallPct} tone="teal" />
            </Card>
          </Section>

          {/* Stacked bar chart per scheme. */}
          {chartData.length > 0 && (
            <Section title="Scheme-wise progress">
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                    <XAxis dataKey="name" tick={{ ...CHART.tick, fontSize: 10 }} stroke={CHART.axis} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={CHART.tick} stroke={CHART.axis} width={48} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "var(--ftp-surface-2)" }} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill={CHART.primary} />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={CHART.secondary} />
                    <Bar dataKey="remaining" name="Remaining" stackId="a" fill={CHART.tertiary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ChartLegend
                  entries={[
                    { label: "Completed", color: CHART.primary },
                    { label: "In progress", color: CHART.secondary },
                    { label: "Remaining", color: CHART.tertiary },
                  ]}
                />
              </Card>
            </Section>
          )}

          {/* One card per scheme. */}
          <Section title="Scheme details">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {schemes.map((h) => {
                const completedPct = h.targetHouses > 0 ? (h.completed / h.targetHouses) * 100 : 0;
                const fundsSpentPct = h.fundsAllocated && h.fundsSpent ? (h.fundsSpent / h.fundsAllocated) * 100 : 0;
                return (
                  <Card key={h.id} as="article">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{h.schemeName}</h3>
                        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>FY {h.fiscalYear}</div>
                      </div>
                      <div className="ftp-num" style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text)", flexShrink: 0 }}>
                        {completedPct.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8, marginBottom: 12 }}>
                      <Figure label="Target" value={h.targetHouses.toLocaleString("en-IN")} />
                      <Figure label="Sanctioned" value={h.sanctioned.toLocaleString("en-IN")} />
                      <Figure label="Completed" value={h.completed.toLocaleString("en-IN")} />
                      <Figure label="In progress" value={h.inProgress.toLocaleString("en-IN")} />
                    </div>
                    <ProgressBar label="Houses completed" pct={completedPct} tone="teal" />
                    {h.fundsAllocated ? (
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                        <Figure label="Allocated" value={crore(h.fundsAllocated)} />
                        <Figure label="Released" value={crore(h.fundsReleased ?? 0)} />
                        <Figure label="Spent" value={crore(h.fundsSpent ?? 0)} />
                      </div>
                    ) : null}
                    {h.fundsAllocated && h.fundsSpent ? (
                      <div style={{ marginTop: 10 }}>
                        <ProgressBar label="Funds utilization" pct={fundsSpentPct} />
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

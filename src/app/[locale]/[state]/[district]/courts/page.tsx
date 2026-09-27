/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Courts module page — Design v3 "Civic Ledger" module template:
//   PageHeader → AI summary → StatStrip → Sections (pendency, chart, table)
//   → honest EmptyState when there are no rows → sources + Share/Compare.
// Data comes from useCourts() (NJDG figures stored per court per year).

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { use } from "react";
import { Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useCourts } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  DataTable,
} from "@/components/district/ui";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Shared chart styling — tokens only (text-2 axis, surface-2 grid). */
const AXIS_TICK = { fontSize: 11, fill: "var(--ftp-text-2)" };
const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--ftp-text)",
};

function CourtsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = useCourts(district, state);

  const stats = data?.data ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestStats = stats.filter((s) => s.year === recentYear);

  const totalFiled = latestStats.reduce((s, c) => s + (c.filed ?? 0), 0);
  const totalPending = latestStats.reduce((s, c) => s + (c.pending ?? 0), 0);
  const totalDisposed = latestStats.reduce((s, c) => s + (c.disposed ?? 0), 0);
  const pendingPct = (totalFiled + totalPending) > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;
  const avgDaysStats = latestStats.filter((c) => c.avgDays != null);
  // null (not 0) when no court reported an average, so we never show a fake zero.
  const avgDays = avgDaysStats.length > 0
    ? avgDaysStats.reduce((s, c) => s + (c.avgDays ?? 0), 0) / avgDaysStats.length
    : null;

  const chartData = latestStats.map((c) => ({
    court: c.courtName.slice(0, 14),
    filed: c.filed,
    disposed: c.disposed,
    pending: c.pending,
  }));

  // Pendency above 40 % is flagged in the danger colour, otherwise amber.
  const pendencyTone = pendingPct > 40 ? "danger" : "warn";

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Scale}
        title="Courts"
        description="Case pendency and disposal statistics for district courts"
        backHref={base}
        accent={getModuleAccent("courts")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={{ label: "NJDG", href: "https://njdg.ecourts.gov.in" }}
      />
      <AIInsightCard module="courts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState
          title={`No court data yet for ${districtName}.`}
          body="We are collecting case pendency and disposal data from the National Judicial Data Grid (NJDG)."
        />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile label="Cases filed" value={totalFiled.toLocaleString("en-IN")} sub={`Year ${recentYear}`} icon={Scale} />
            <StatTile label="Disposed" value={totalDisposed.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile label="Pending" value={totalPending.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile label="Avg disposal" value={avgDays != null ? avgDays.toFixed(0) : "—"} unit={avgDays != null ? "days" : undefined} sub={`Year ${recentYear}`} />
          </StatStrip>

          {/* Pendency */}
          <Section title={`Overall Pendency Rate (${recentYear})`}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Pending cases as a share of filed + pending</span>
                <span className="ftp-num" style={{ fontSize: 15, color: `var(--ftp-${pendencyTone})` }}>{pendingPct.toFixed(1)}%</span>
              </div>
              <ProgressBar pct={pendingPct} tone={pendencyTone} />
            </Card>
          </Section>

          {/* Chart */}
          {chartData.length > 0 && (
            <Section title={`Court-wise Caseload (${recentYear})`}>
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                    <XAxis dataKey="court" tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "var(--ftp-text-2)" }} verticalAlign="top" height={24} />
                    <Bar dataKey="filed" name="Filed" fill="var(--ftp-brand)" stackId="a" />
                    <Bar dataKey="disposed" name="Disposed" fill="var(--ftp-live)" stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill="var(--ftp-danger)" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* Table */}
          <Section title="All Court Statistics">
            <DataTable
              caption="Court statistics by year"
              columns={[
                { key: "year", label: "Year", mono: true, align: "left" },
                { key: "court", label: "Court" },
                { key: "filed", label: "Filed", numeric: true },
                { key: "disposed", label: "Disposed", numeric: true },
                { key: "pending", label: "Pending", numeric: true },
                { key: "days", label: "Avg Days", numeric: true },
              ]}
              rows={stats.map((c) => ({
                year: c.year,
                court: c.courtName,
                filed: (c.filed ?? 0).toLocaleString("en-IN"),
                disposed: (c.disposed ?? 0).toLocaleString("en-IN"),
                pending: (c.pending ?? 0).toLocaleString("en-IN"),
                days: c.avgDays != null ? c.avgDays.toFixed(0) : "—",
              }))}
            />
          </Section>
        </>
      )}

      <ModulePageFooter
        moduleSlug="courts"
        locale={locale}
        state={state}
        district={district}
        sourceUrls={{ "NJDG (National Judicial Data Grid)": "https://njdg.ecourts.gov.in" }}
      />
    </div>
  );
}

export default function CourtsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Courts">
      <CourtsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

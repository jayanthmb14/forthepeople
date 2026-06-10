/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { use } from "react";
import { Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCourts } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, ProgressBar, LoadingShell, ErrorBlock, DataTable } from "@/components/district/ui";

function CourtsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useCourts(district, state);

  const stats = data?.data ?? [];
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestStats = stats.filter((s) => s.year === recentYear);

  const totalFiled = latestStats.reduce((s, c) => s + (c.filed ?? 0), 0);
  const totalPending = latestStats.reduce((s, c) => s + (c.pending ?? 0), 0);
  const totalDisposed = latestStats.reduce((s, c) => s + (c.disposed ?? 0), 0);
  const pendingPct = (totalFiled + totalPending) > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;
  const avgDaysStats = latestStats.filter((c) => c.avgDays != null);
  const avgDays = avgDaysStats.length > 0
    ? avgDaysStats.reduce((s, c) => s + (c.avgDays ?? 0), 0) / avgDaysStats.length
    : 0;

  const chartData = latestStats.map((c) => ({
    court: c.courtName.slice(0, 14),
    filed: c.filed,
    disposed: c.disposed,
    pending: c.pending,
  }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Scale} title="Courts" description="Case pendency and disposal statistics for district courts" backHref={base} />
      {(() => { const _src = getModuleSources("courts", state); return <DataSourceBanner moduleName="courts" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="courts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <NoDataCard module="courts" district={district} state={state} />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label={`Filed (${recentYear})`} value={totalFiled.toLocaleString("en-IN")} icon={Scale} />
            <StatCard label="Disposed" value={totalDisposed.toLocaleString("en-IN")} accent="#16A34A" />
            <StatCard label="Pending" value={totalPending.toLocaleString("en-IN")} accent={pendingPct > 40 ? "#DC2626" : "#D97706"} />
            <StatCard label="Avg Disposal Days" value={avgDays.toFixed(0)} />
          </div>

          {/* Pendency */}
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Overall Pendency Rate ({recentYear})</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: pendingPct > 40 ? "#DC2626" : "#D97706" }}>{pendingPct.toFixed(1)}%</div>
            </div>
            <ProgressBar pct={pendingPct} />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Court-wise Caseload ({recentYear})</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="court" tick={{ fontSize: 9, fill: "#9B9B9B" }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip />
                    <Bar dataKey="filed" name="Filed" fill="#2563EB" stackId="a" />
                    <Bar dataKey="disposed" name="Disposed" fill="#16A34A" stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill="#DC2626" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          {stats.length > 0 && (
            <>
              <SectionLabel>All Court Statistics</SectionLabel>
              <DataTable
                columns={[
                  { key: "year", label: "Year", mono: true },
                  { key: "court", label: "Court" },
                  { key: "filed", label: "Filed", mono: true, align: "right" },
                  { key: "disposed", label: "Disposed", mono: true, align: "right" },
                  { key: "pending", label: "Pending", mono: true, align: "right" },
                  { key: "days", label: "Avg Days", mono: true, align: "right" },
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
            </>
          )}
        </>
      )}
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

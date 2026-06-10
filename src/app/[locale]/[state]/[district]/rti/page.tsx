/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useRTI } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, ProgressBar, LoadingShell, ErrorBlock, DataTable } from "@/components/district/ui";
import Link from "next/link";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

function RTIPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useRTI(district, state);

  const stats = data?.data?.stats ?? [];
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestStats = stats.filter((s) => s.year === recentYear);
  const totalFiled = latestStats.reduce((s, r) => s + r.filed, 0);
  const totalPending = latestStats.reduce((s, r) => s + r.pending, 0);
  const totalDisposed = latestStats.reduce((s, r) => s + r.disposed, 0);
  const pendingPct = (totalFiled + totalDisposed) > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;

  const chartData = latestStats.map((s) => ({
    dept: s.department.slice(0, 14),
    filed: s.filed,
    disposed: s.disposed,
    pending: s.pending,
  }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={FileText} title="RTI Statistics" description="Right to Information filing statistics by department" backHref={base} />
      {(() => { const _src = getModuleSources("rti", state); return <DataSourceBanner moduleName="rti" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="rti" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <NoDataCard module="rti" district={district} state={state} />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
            <StatCard label={`Filed (${recentYear})`} value={totalFiled.toLocaleString("en-IN")} icon={FileText} />
            <StatCard label="Disposed" value={totalDisposed.toLocaleString("en-IN")} accent="#16A34A" />
            <StatCard label="Pending" value={totalPending.toLocaleString("en-IN")} accent={totalPending > 100 ? "#DC2626" : "#D97706"} />
            <StatCard label="Pending %" value={`${pendingPct.toFixed(1)}%`} />
          </div>

          {/* File RTI CTA */}
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F5F3FF)", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Want to file an RTI?</div>
              <div style={{ fontSize: 12, color: "#6B6B6B" }}>Use our guided wizard with pre-filled templates</div>
            </div>
            <Link href={`${base}/file-rti`} style={{
              display: "inline-block", padding: "8px 16px", background: "#2563EB", color: "#FFF",
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              File RTI →
            </Link>
          </div>

          {/* Pendency bar */}
          {pendingPct > 0 && (
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Overall Pendency ({recentYear})</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: pendingPct > 30 ? "#DC2626" : "#D97706" }}>{pendingPct.toFixed(1)}%</div>
              </div>
              <ProgressBar pct={pendingPct} />
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Department-wise RTI ({recentYear})</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#9B9B9B" }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip />
                    <Bar dataKey="filed" name="Filed" stackId="a" fill="#2563EB" />
                    <Bar dataKey="disposed" name="Disposed" stackId="a" fill="#16A34A" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Full table */}
          {stats.length > 0 && (
            <>
              <SectionLabel>All RTI Stats</SectionLabel>
              <DataTable
                columns={[
                  { key: "year", label: "Year", mono: true },
                  { key: "dept", label: "Department" },
                  { key: "filed", label: "Filed", mono: true, align: "right" },
                  { key: "disposed", label: "Disposed", mono: true, align: "right" },
                  { key: "pending", label: "Pending", mono: true, align: "right" },
                  { key: "days", label: "Avg Days", mono: true, align: "right" },
                ]}
                rows={stats.map((s) => ({
                  year: s.year,
                  dept: s.department,
                  filed: s.filed.toLocaleString("en-IN"),
                  disposed: s.disposed.toLocaleString("en-IN"),
                  pending: s.pending.toLocaleString("en-IN"),
                  days: s.avgDays.toFixed(1),
                }))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function RTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="RTI">
      <RTIPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

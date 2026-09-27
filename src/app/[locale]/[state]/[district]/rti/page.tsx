/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// RTI Tracker module page — Design v3 "Civic Ledger" module template:
//   PageHeader → AI summary → StatStrip → "File an RTI" card → pendency,
//   department chart, full table → honest EmptyState when there are no
//   rows → sources + Share/Compare. Data comes from useRTI().

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { FileText, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useRTI } from "@/hooks/useRealtimeData";
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
import Link from "next/link";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
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

/** Primary call-to-action link (brand fill, 44 px tall so it is easy to tap). */
const PRIMARY_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  background: "var(--ftp-brand)",
  color: "var(--ftp-surface)",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

function RTIPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = useRTI(district, state);

  const stats = data?.data?.stats ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestStats = stats.filter((s) => s.year === recentYear);
  const totalFiled = latestStats.reduce((s, r) => s + r.filed, 0);
  const totalPending = latestStats.reduce((s, r) => s + r.pending, 0);
  const totalDisposed = latestStats.reduce((s, r) => s + r.disposed, 0);
  const pendingPct = (totalFiled + totalDisposed) > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;

  // Pendency above 30 % is flagged in the danger colour, otherwise amber.
  const pendencyTone = pendingPct > 30 ? "danger" : "warn";

  const chartData = latestStats.map((s) => ({
    dept: s.department.slice(0, 14),
    filed: s.filed,
    disposed: s.disposed,
    pending: s.pending,
  }));

  const fileRtiLink = (
    <Link href={`${base}/file-rti`} style={PRIMARY_LINK}>
      File RTI <ArrowRight size={14} aria-hidden />
    </Link>
  );

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={FileText}
        title="RTI Statistics"
        description="Right to Information filing statistics by department"
        backHref={base}
        accent={getModuleAccent("rti")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
      />
      <AIInsightCard module="rti" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState
          title={`No RTI filing data yet for ${districtName}.`}
          body="We are collecting RTI filing statistics and department-wise response data from official RTI portals. You can still file an RTI today."
          action={fileRtiLink}
        />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile label="RTIs filed" value={totalFiled.toLocaleString("en-IN")} sub={`Year ${recentYear}`} icon={FileText} />
            <StatTile label="Disposed" value={totalDisposed.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile label="Pending" value={totalPending.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile label="Pending share" value={pendingPct.toFixed(1)} unit="%" sub={`Year ${recentYear}`} />
          </StatStrip>

          {/* File RTI call to action — a plain card, no gradient. */}
          <Section title="Want to file an RTI?">
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Use our guided wizard with pre-filled templates</p>
                {fileRtiLink}
              </div>
            </Card>
          </Section>

          {/* Pendency bar */}
          {pendingPct > 0 && (
            <Section title={`Overall Pendency (${recentYear})`}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Pending RTIs as a share of filed + pending</span>
                  <span className="ftp-num" style={{ fontSize: 15, color: `var(--ftp-${pendencyTone})` }}>{pendingPct.toFixed(1)}%</span>
                </div>
                <ProgressBar pct={pendingPct} tone={pendencyTone} />
              </Card>
            </Section>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <Section title={`Department-wise RTI (${recentYear})`}>
              <Card>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                    <XAxis dataKey="dept" tick={AXIS_TICK} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "var(--ftp-text-2)" }} verticalAlign="top" height={24} />
                    <Bar dataKey="filed" name="Filed" stackId="a" fill="var(--ftp-brand)" />
                    <Bar dataKey="disposed" name="Disposed" stackId="a" fill="var(--ftp-live)" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--ftp-danger)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* Full table */}
          <Section title="All RTI Stats">
            <DataTable
              caption="RTI statistics by year and department"
              columns={[
                { key: "year", label: "Year", mono: true, align: "left" },
                { key: "dept", label: "Department" },
                { key: "filed", label: "Filed", numeric: true },
                { key: "disposed", label: "Disposed", numeric: true },
                { key: "pending", label: "Pending", numeric: true },
                { key: "days", label: "Avg Days", numeric: true },
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
          </Section>
        </>
      )}

      <ModulePageFooter moduleSlug="rti" locale={locale} state={state} district={district} />
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

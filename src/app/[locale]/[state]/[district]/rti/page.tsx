/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// RTI Tracker module page — Design v4 "Rang" module recipe (see the finance
// page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles →
//   picture (applications still waiting + the exact pendency rate) →
//   "File an RTI" card → department ChartCard → full table → honest
//   EmptyState when there are no rows → sources + Share/Compare.
// Data comes from useRTI().

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { FileText, FilePen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import Link from "next/link";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Primary call-to-action link, 44 px tall so it is easy to tap. The fill
    and hover come from .ftp-btn-primary (the page hue). */
const PRIMARY_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderWidth: 1,
  borderStyle: "solid",
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
  // Out of every 10 applications (new + waiting), how many were still waiting.
  const pendingOfTen = Math.round(pendingPct / 10);
  const showPicture = (totalFiled + totalPending) > 0 && Number.isFinite(pendingPct);

  const chartData = latestStats.map((s) => ({
    // Full name for the tooltip and table; a shorter one for the axis.
    deptFull: s.department,
    dept: s.department.length > 22 ? s.department.slice(0, 21) + "…" : s.department,
    filed: s.filed,
    disposed: s.disposed,
    pending: s.pending,
  }));
  const mostPending = [...chartData].sort((a, b) => b.pending - a.pending)[0];

  const fileRtiLink = (
    <Link href={`${base}/file-rti`} className="ftp-btn ftp-btn-primary" style={PRIMARY_LINK}>
      <FilePen size={14} aria-hidden /> File an RTI
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

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        This page shows how many Right to Information (RTI) applications were filed with government departments in{" "}
        {districtName}, how many were answered, how many are still waiting and how long replies take, department by
        department and year by year.
      </p>

      <AIInsightCard module="rti" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState
          emoji="🏛️"
          title={`No RTI filing data yet for ${districtName}.`}
          body="We are collecting RTI filing statistics and department-wise response data from official RTI portals. You can still file an RTI today."
          action={fileRtiLink}
        />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="📨" label="RTIs filed" value={totalFiled.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="✅" label="Disposed" value={totalDisposed.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="⏳" label="Pending" value={totalPending.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="📊" label="Pending share" value={pendingPct.toFixed(1)} unit="%" sub={`Year ${recentYear}`} />
          </StatStrip>

          {/* The picture: 10 letters, lit for the ones still waiting;
              beside it the exact pendency rate in its warning colour. */}
          {showPicture && (
            <div className={pendingPct > 0 ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="📨">
                  In {recentYear}, <strong>{totalFiled.toLocaleString("en-IN")}</strong> RTI applications were filed here,
                  and <strong>{totalPending.toLocaleString("en-IN")}</strong> applications were waiting for a reply. Out of
                  every 10 of these applications, about <strong>{pendingOfTen}</strong> were still waiting.
                </Explainer>
                <Pictogram
                  filled={pendingPct / 10}
                  emoji="✉️"
                  label={`About ${pendingOfTen} of every 10 RTI applications were still waiting for a reply in ${recentYear}.`}
                />
              </Card>
              {pendingPct > 0 && (
                <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                  <p className="ftp-label">Overall pendency, {recentYear}</p>
                  <div className="ftp-bignum" style={{ fontSize: 40, lineHeight: 1, color: `var(--ftp-${pendencyTone})` }}>
                    {pendingPct.toFixed(1)}%
                  </div>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Pending RTIs as a share of filed + pending</p>
                  <ProgressBar pct={pendingPct} tone={pendencyTone} />
                </Card>
              )}
            </div>
          )}

          {/* File RTI call to action */}
          <Section title="Want to file an RTI?" emoji="📜">
            <Card tinted>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Use our guided wizard with pre-filled templates</p>
                {fileRtiLink}
              </div>
            </Card>
          </Section>

          {/* Department chart */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={`RTIs by department, ${recentYear}`}
                emoji="🏢"
                units="Number of RTI applications per department. Grey is filed, colour is disposed (answered), red is still pending."
                simple={
                  mostPending && mostPending.pending > 0 ? (
                    <>
                      <strong>{mostPending.deptFull}</strong> had the most applications waiting:{" "}
                      {mostPending.pending.toLocaleString("en-IN")}.
                    </>
                  ) : null
                }
                legend={[
                  { label: "Filed", swatch: "var(--ftp-border-strong)" },
                  { label: "Disposed", swatch: "var(--hue)" },
                  { label: "Pending", swatch: "var(--ftp-danger)" },
                ]}
                asOf={lastUpdated}
                asOfPeriod={String(recentYear)}
                table={chartData.map((r) => ({
                  label: r.deptFull,
                  value: `${r.filed.toLocaleString("en-IN")} filed, ${r.disposed.toLocaleString("en-IN")} disposed, ${r.pending.toLocaleString("en-IN")} pending`,
                }))}
              >
                {/* 72 px per department (three bars each) so every name is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 72 + 40)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
                    <YAxis type="category" dataKey="dept" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v, name) => [Number(v).toLocaleString("en-IN"), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.deptFull ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="filed" name="Filed" fill="url(#ftpMutedFill)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="disposed" name="Disposed" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="var(--ftp-danger)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Full table */}
          <Section title="All RTI statistics" emoji="📋">
            <DataTable
              caption="RTI statistics by year and department"
              columns={[
                { key: "year", label: "Year", mono: true, align: "left" },
                { key: "dept", label: "Department" },
                { key: "filed", label: "Filed", numeric: true },
                { key: "disposed", label: "Disposed", numeric: true },
                { key: "pending", label: "Pending", numeric: true },
                { key: "days", label: "Average days", numeric: true },
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

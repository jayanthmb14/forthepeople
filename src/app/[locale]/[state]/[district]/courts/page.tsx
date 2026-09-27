/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Courts module page — Design v4 "Rang" module recipe (see the finance page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles →
//   picture (case files still waiting + the exact pendency rate) → court-wise
//   ChartCard → full table → honest EmptyState when there are no rows →
//   sources + Share/Compare.
// Data comes from useCourts() (NJDG figures stored per court per year).

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { use } from "react";
import { Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

const NJDG = { label: "NJDG", href: "https://njdg.ecourts.gov.in" };

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
    // Full name for the tooltip and table; a shorter one for the axis.
    courtFull: c.courtName,
    court: c.courtName.length > 22 ? c.courtName.slice(0, 21) + "…" : c.courtName,
    filed: c.filed,
    disposed: c.disposed,
    pending: c.pending,
  }));
  const mostPending = [...chartData].sort((a, b) => (b.pending ?? 0) - (a.pending ?? 0))[0];

  // Pendency above 40 % is flagged in the danger colour, otherwise amber.
  const pendencyTone = pendingPct > 40 ? "danger" : "warn";
  // Out of every 10 cases (new + waiting), how many were still waiting.
  const pendingOfTen = Math.round(pendingPct / 10);

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Scale}
        title="Courts"
        description="Case pendency and disposal statistics for district courts"
        backHref={base}
        accent={getModuleAccent("courts")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={NJDG}
      />

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        This page shows how many cases were filed, decided and still pending in the courts of {districtName}, with the
        average time a case takes, from the National Judicial Data Grid (NJDG). Figures are grouped by court and year.
      </p>

      <AIInsightCard module="courts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState
          emoji="⚖️"
          title={`No court data yet for ${districtName}.`}
          body="We are collecting case pendency and disposal data from the National Judicial Data Grid (NJDG)."
        />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="📥" label="Cases filed" value={totalFiled.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="✅" label="Disposed" value={totalDisposed.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="⏳" label="Pending" value={totalPending.toLocaleString("en-IN")} sub={`Year ${recentYear}`} />
            <StatTile emoji="📅" label="Avg disposal" value={avgDays != null ? avgDays.toFixed(0) : "—"} unit={avgDays != null ? "days" : undefined} sub={`Year ${recentYear}`} />
          </StatStrip>

          {/* The picture: 10 case files, lit for the ones still waiting;
              beside it the exact pendency rate in its warning colour. */}
          {(totalFiled + totalPending) > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="⚖️">
                  In {recentYear}, the courts here received <strong>{totalFiled.toLocaleString("en-IN")}</strong> new cases
                  and had <strong>{totalPending.toLocaleString("en-IN")}</strong> cases still waiting. Out of every 10 of
                  these cases, about <strong>{pendingOfTen}</strong> were still waiting for a decision.
                </Explainer>
                <Pictogram
                  filled={pendingPct / 10}
                  emoji="📁"
                  label={`About ${pendingOfTen} of every 10 cases were still pending in ${recentYear}.`}
                />
              </Card>
              <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <p className="ftp-label">Overall pendency rate, {recentYear}</p>
                <div className="ftp-bignum" style={{ fontSize: 40, lineHeight: 1, color: `var(--ftp-${pendencyTone})` }}>
                  {pendingPct.toFixed(1)}%
                </div>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Pending cases as a share of filed + pending</p>
                <ProgressBar pct={pendingPct} tone={pendencyTone} />
              </Card>
            </div>
          )}

          {/* Court-wise chart */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={`Cases in each court, ${recentYear}`}
                emoji="📂"
                units="Number of cases per court. Grey is new cases filed, colour is cases decided, red is cases still pending."
                simple={
                  mostPending && (mostPending.pending ?? 0) > 0 ? (
                    <>
                      <strong>{mostPending.courtFull}</strong> had the most cases waiting:{" "}
                      {(mostPending.pending ?? 0).toLocaleString("en-IN")}.
                    </>
                  ) : null
                }
                legend={[
                  { label: "Filed", swatch: "var(--ftp-border-strong)" },
                  { label: "Disposed", swatch: "var(--hue)" },
                  { label: "Pending", swatch: "var(--ftp-danger)" },
                ]}
                source={NJDG}
                asOf={lastUpdated}
                asOfPeriod={String(recentYear)}
                table={chartData.map((r) => ({
                  label: r.courtFull,
                  value: `${(r.filed ?? 0).toLocaleString("en-IN")} filed, ${(r.disposed ?? 0).toLocaleString("en-IN")} disposed, ${(r.pending ?? 0).toLocaleString("en-IN")} pending`,
                }))}
              >
                {/* 72 px per court (three bars each) so every name is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 72 + 40)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
                    <YAxis type="category" dataKey="court" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v, name) => [Number(v).toLocaleString("en-IN"), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.courtFull ?? ""}
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

          {/* Table */}
          <Section title="All court statistics" emoji="📋">
            <DataTable
              caption="Court statistics by year"
              columns={[
                { key: "year", label: "Year", mono: true, align: "left" },
                { key: "court", label: "Court" },
                { key: "filed", label: "Filed", numeric: true },
                { key: "disposed", label: "Disposed", numeric: true },
                { key: "pending", label: "Pending", numeric: true },
                { key: "days", label: "Average days", numeric: true },
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

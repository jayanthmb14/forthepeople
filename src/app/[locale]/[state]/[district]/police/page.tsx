/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Police & Traffic module page — Design v4 "Rang" module recipe (see the
// finance page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles
//   (only figures we actually have) → picture (traffic fines vs the monthly
//   target, only when the target is on file) → staffing → station directory
//   → crime + traffic ChartCards → crime table → honest EmptyState when
//   nothing is loaded → sources + Share/Compare → news.
// Data comes from usePolice() (stations, NCRB crime rows, traffic challans).

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Shield, Phone, MapPin } from "lucide-react";
import { usePolice } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  DataTable,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import StaffingWidget from "@/components/district/StaffingWidget";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** 1 lakh = 100,000 rupees. Traffic amounts are stored in rupees. */
const LAKH = 100_000;

/** "12.3" lakh, one decimal, Indian grouping. */
function lakh(amount: number): string {
  return (amount / LAKH).toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

function PolicePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = usePolice(district, state);

  const stations = data?.data?.stations ?? [];
  const crime = data?.data?.crime ?? [];
  const traffic = data?.data?.traffic ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const hasAnyData = stations.length > 0 || crime.length > 0 || traffic.length > 0;

  const totalCrimes = crime.reduce((s, c) => s + c.count, 0);
  const totalTraffic = traffic.reduce((s, t) => s + t.amount, 0);
  // How many stat tiles will show (2 minimum so a lone tile is not stretched).
  const tileCols = Math.max(2, [stations.length > 0, totalCrimes > 0, totalTraffic > 0].filter(Boolean).length) as 2 | 3;
  // Newest traffic month — the "as of" date for the revenue tile.
  const latestTrafficDate = traffic.reduce<string | null>(
    (latest, t) => (!latest || new Date(t.date) > new Date(latest) ? t.date : latest),
    null,
  );

  // Crime by category (latest year)
  const latestYear = crime.length > 0 ? Math.max(...crime.map((c) => c.year)) : 0;
  const latestCrime = crime.filter((c) => c.year === latestYear);
  const crimeChart = latestCrime.map((c) => ({
    // Full name for the tooltip and table; a shorter one for the axis.
    nameFull: c.category,
    name: c.category.length > 22 ? c.category.slice(0, 21) + "…" : c.category,
    count: c.count,
  }));
  // NCRB rows often include a "… total" category that already contains the
  // others, so the chart says so instead of implying the bars add up.
  const hasTotalRow = latestCrime.some((c) => /total/i.test(c.category));
  const topCrime = [...crimeChart].sort((a, b) => b.count - a.count)[0];

  // Traffic monthly
  const trafficChart = traffic.slice(0, 12).map((t) => ({
    label: new Date(t.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    amount: Math.round(t.amount / 1000),
    challans: t.challans ?? 0,
  })).reverse();
  const topTrafficMonth = [...trafficChart].sort((a, b) => b.amount - a.amount)[0];
  const trafficSource = traffic.find((t) => t.source)?.source ?? null;

  // The picture: the newest month's fines against its monthly target —
  // only when the target is on file, never an assumed one.
  const latestTraffic = latestTrafficDate ? traffic.find((t) => t.date === latestTrafficDate) : undefined;
  const target = latestTraffic?.monthlyTarget ?? 0;
  const targetPct = latestTraffic && target > 0 ? (latestTraffic.amount / target) * 100 : null;
  const latestMonthLabel = latestTraffic
    ? new Date(latestTraffic.date).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    : "";

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Shield}
        title="Police & Traffic"
        description="Police stations, crime statistics, and traffic revenue"
        backHref={base}
        accent={getModuleAccent("police")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={{ label: "NCRB", href: "https://ncrb.gov.in" }}
      />

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        This page lists police stations in {districtName}, crime figures reported to the National Crime Records Bureau
        (NCRB) and monthly traffic fine collections, where we have them. Every figure shows its year or date and its
        source.
      </p>

      <AIInsightCard module="police" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && !hasAnyData && (
        <EmptyState
          emoji="👮"
          title={`No police data yet for ${districtName}.`}
          body="We are collecting crime data from NCRB (National Crime Records Bureau) and traffic revenue data. NCRB publishes district-level data annually."
        />
      )}

      {/* Only figures we actually have — never a fake zero. */}
      {!isLoading && hasAnyData && (
        <StatStrip cols={tileCols}>
          {stations.length > 0 && <StatTile emoji="🚓" label="Police stations" value={stations.length} sub="In our directory" />}
          {totalCrimes > 0 && (
            <StatTile emoji="📁" label="Crimes recorded" value={totalCrimes.toLocaleString("en-IN")} sub={`All years on file, latest ${latestYear}`} />
          )}
          {totalTraffic > 0 && (
            <StatTile emoji="🧾" label="Traffic revenue" value={`₹${(totalTraffic / 100000).toFixed(1)}`} unit="L" sub="Challan collections on file" asOf={latestTrafficDate} />
          )}
        </StatStrip>
      )}

      {/* The picture: fines collected in the newest month against that
          month's target. Same numbers as the traffic chart below. */}
      {!isLoading && latestTraffic && targetPct !== null && (
        <div
          className={targetPct <= 100 ? "ftp-picture-row" : undefined}
          style={{ marginTop: 16 }}
        >
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="🚦">
              In {latestMonthLabel}, the traffic police collected <strong>₹{lakh(latestTraffic.amount)} lakh</strong> in
              fines. The target for the month was ₹{lakh(target)} lakh,{" "}
              {targetPct >= 100 ? (
                <>so the target was met.</>
              ) : (
                <>
                  so about <strong>{Math.round(targetPct)}%</strong> of the target was reached.
                </>
              )}
            </Explainer>
            <Pictogram
              filled={Math.min(10, targetPct / 10)}
              emoji="🪙"
              label={
                targetPct >= 100
                  ? `Every rupee of the ${latestMonthLabel} target was collected.`
                  : `About ${Math.round(targetPct / 10)} of every 10 rupees of the ${latestMonthLabel} target were collected.`
              }
            />
          </Card>
          {/* The dial stops at 100, so it only shows when the target was not passed. */}
          {targetPct <= 100 && (
            <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gauge value={targetPct} label="Target reached" caption={`Traffic fines against the target, ${latestMonthLabel}`} />
            </Card>
          )}
        </div>
      )}

      {/* Sanctioned vs. Filled staffing widget (renders nothing without data). */}
      {!isLoading && (
        <StaffingWidget
          module="police"
          roleLabel="Police Force"
          district={district}
          state={state}
          accentColor="var(--hue)"
        />
      )}

      {!isLoading && hasAnyData && (
        <>
          {/* Station Directory */}
          {stations.length > 0 && (
            <Section title="Police stations" emoji="🚓">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
                {stations.map((s) => (
                  <Card as="li" key={s.id} padding={14}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="ftp-icon-chip" aria-hidden style={{ width: 28, height: 28, borderRadius: 9 }}>
                        <Shield size={15} />
                      </span>
                      <h3 className="ftp-title">{s.name}</h3>
                    </div>
                    {s.sho && <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>SHO: {s.sho}</div>}
                    {s.address && (
                      <div className="ftp-body" style={{ display: "flex", gap: 4, color: "var(--ftp-text-2)", marginTop: 4 }}>
                        <MapPin size={12} aria-hidden style={{ flexShrink: 0, marginTop: 4 }} />
                        {s.address}
                      </div>
                    )}
                    {s.phone && (
                      <a
                        href={`tel:${s.phone}`}
                        className="ftp-num"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--hue-deep)", textDecoration: "none" }}
                      >
                        <Phone size={12} aria-hidden /> {s.phone}
                      </a>
                    )}
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {/* Crime chart — needs at least two categories to compare. */}
          {crimeChart.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={`Cases by category, ${latestYear}`}
                emoji="🚨"
                units={
                  hasTotalRow
                    ? "Number of cases recorded in each category. The total bar already includes the other categories."
                    : "Number of cases recorded in each category."
                }
                simple={
                  topCrime ? (
                    <>
                      The largest figure is <strong>{topCrime.nameFull}</strong>, with {topCrime.count.toLocaleString("en-IN")} cases.
                    </>
                  ) : null
                }
                legend={[{ label: "Cases recorded", swatch: "var(--hue)" }]}
                source={{ label: "NCRB", href: "https://ncrb.gov.in" }}
                asOf={lastUpdated}
                asOfPeriod={String(latestYear)}
                table={crimeChart.map((r) => ({ label: r.nameFull, value: r.count.toLocaleString("en-IN") }))}
              >
                {/* 40 px per category so every label is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(180, crimeChart.length * 40 + 40)}>
                  <BarChart data={crimeChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
                    <YAxis type="category" dataKey="name" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v) => [Number(v).toLocaleString("en-IN"), "Cases"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.nameFull ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="count" name="Cases" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Traffic revenue chart — needs at least two months. */}
          {trafficChart.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Traffic fines collected each month"
                emoji="🧾"
                units="Thousand rupees collected from traffic challans per month."
                simple={
                  topTrafficMonth ? (
                    <>
                      The highest month on file is <strong>{topTrafficMonth.label}</strong>, with ₹
                      {topTrafficMonth.amount.toLocaleString("en-IN")} thousand collected.
                    </>
                  ) : null
                }
                legend={[{ label: "Collected", swatch: "var(--hue)" }]}
                source={trafficSource ? { label: trafficSource } : undefined}
                asOf={latestTrafficDate}
                table={trafficChart.map((r) => ({ label: r.label, value: `₹${r.amount.toLocaleString("en-IN")} thousand` }))}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trafficChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-30} textAnchor="end" />
                    <YAxis tick={CHART_AXIS} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")} thousand`, "Collected"]}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="amount" name="Collected" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Crime Stats Table */}
          {crime.length > 0 && (
            <Section title="All crime figures" emoji="📋">
              <DataTable
                caption="Crime statistics by year and category"
                columns={[
                  { key: "year", label: "Year", mono: true, align: "left" },
                  { key: "cat", label: "Category" },
                  { key: "count", label: "Count", numeric: true },
                ]}
                rows={crime.map((c) => ({ year: c.year, cat: c.category, count: c.count.toLocaleString("en-IN") }))}
              />
            </Section>
          )}
        </>
      )}

      <ModulePageFooter
        moduleSlug="police"
        locale={locale}
        state={state}
        district={district}
        sourceUrls={{ "NCRB (National Crime Records Bureau)": "https://ncrb.gov.in", "data.gov.in": "https://data.gov.in" }}
      >
        <ModuleNews district={district} state={state} locale={locale} module="police" />
      </ModulePageFooter>
    </div>
  );
}

export default function PolicePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Police">
      <PolicePageInner params={params} />
    </ModuleErrorBoundary>
  );
}

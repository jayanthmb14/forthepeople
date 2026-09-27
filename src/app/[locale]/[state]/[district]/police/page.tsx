/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Police & Traffic module page — Design v3 "Civic Ledger" module template:
//   PageHeader → AI summary → StatStrip (only figures we actually have) →
//   staffing → station directory → crime + traffic charts → crime table →
//   honest EmptyState when nothing is loaded → sources + Share/Compare → news.
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
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import StaffingWidget from "@/components/district/StaffingWidget";
import ModuleNews from "@/components/district/ModuleNews";
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
  const crimeChart = latestCrime.map((c) => ({ name: c.category.replace(/\s+/g, "\n"), count: c.count }));

  // Traffic monthly
  const trafficChart = traffic.slice(0, 12).map((t) => ({
    label: new Date(t.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    amount: Math.round(t.amount / 1000),
    challans: t.challans ?? 0,
  })).reverse();

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
      <AIInsightCard module="police" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && !hasAnyData && (
        <EmptyState
          title={`No police data yet for ${districtName}.`}
          body="We are collecting crime data from NCRB (National Crime Records Bureau) and traffic revenue data. NCRB publishes district-level data annually."
        />
      )}

      {/* Only figures we actually have — never a fake zero. */}
      {!isLoading && hasAnyData && (
        <StatStrip cols={tileCols}>
          {stations.length > 0 && <StatTile label="Police stations" value={stations.length} icon={Shield} sub="In our directory" />}
          {totalCrimes > 0 && (
            <StatTile label="Crimes recorded" value={totalCrimes.toLocaleString("en-IN")} sub={`All years on file · latest ${latestYear}`} />
          )}
          {totalTraffic > 0 && (
            <StatTile label="Traffic revenue" value={`₹${(totalTraffic / 100000).toFixed(1)}`} unit="L" sub="Challan collections on file" asOf={latestTrafficDate} />
          )}
        </StatStrip>
      )}

      {/* Sanctioned vs. Filled staffing widget (renders nothing without data). */}
      {!isLoading && (
        <StaffingWidget
          module="police"
          roleLabel="Police Force"
          district={district}
          state={state}
          accentColor="var(--ftp-brand)"
        />
      )}

      {!isLoading && hasAnyData && (
        <>
          {/* Station Directory */}
          {stations.length > 0 && (
            <Section title="Police Stations">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
                {stations.map((s) => (
                  <Card as="li" key={s.id} padding={14}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Shield size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
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
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}
                      >
                        <Phone size={12} aria-hidden /> {s.phone}
                      </a>
                    )}
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {/* Crime Chart */}
          {crimeChart.length > 0 && (
            <Section title={`Crimes by Category (${latestYear})`}>
              <Card>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={crimeChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                    <XAxis dataKey="name" tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Cases" fill="var(--ftp-brand)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* Traffic Revenue Chart */}
          {trafficChart.length > 0 && (
            <Section title="Monthly Traffic Revenue (₹ thousands)">
              <Card>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trafficChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                    <XAxis dataKey="label" tick={AXIS_TICK} angle={-30} textAnchor="end" />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`₹${Number(v)}K`, "Revenue"]} />
                    <Bar dataKey="amount" fill="var(--ftp-brand)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* Crime Stats Table */}
          {crime.length > 0 && (
            <Section title="Crime Statistics">
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

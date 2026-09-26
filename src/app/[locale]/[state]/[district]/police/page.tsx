/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Shield, Phone, MapPin } from "lucide-react";
import { usePolice } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, ErrorBlock, DataTable } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import StaffingWidget from "@/components/district/StaffingWidget";
import ModuleNews from "@/components/district/ModuleNews";

function PolicePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePolice(district, state);

  const stations = data?.data?.stations ?? [];
  const crime = data?.data?.crime ?? [];
  const traffic = data?.data?.traffic ?? [];

  const totalCrimes = crime.reduce((s, c) => s + c.count, 0);
  const totalTraffic = traffic.reduce((s, t) => s + t.amount, 0);

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
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Shield} title="Police & Traffic" description="Police stations, crime statistics, and traffic revenue" backHref={base} />
      {(() => { const _src = getModuleSources("police", state); return <DataSourceBanner moduleName="police" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="police" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Stations" value={stations.length} icon={Shield} />
            <StatCard label={`Crimes (${latestYear})`} value={totalCrimes > 0 ? totalCrimes.toLocaleString("en-IN") : "No data"} />
            <StatCard label="Traffic Revenue" value={totalTraffic > 0 ? `₹${(totalTraffic / 100000).toFixed(1)}L` : "—"} />
          </div>

          {/* Sanctioned vs. Filled staffing widget */}
          <StaffingWidget
            module="police"
            roleLabel="Police Force"
            district={district}
            state={state}
            accentColor="#2563EB"
          />

          {/* Station Directory */}
          <SectionLabel>Police Stations</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginBottom: 24 }}>
            {stations.map((s) => (
              <div key={s.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, background: "#FEE2E2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={16} style={{ color: "#DC2626" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{s.name}</div>
                  </div>
                </div>
                {s.sho && <div style={{ fontSize: 12, color: "#6B6B6B" }}>SHO: {s.sho}</div>}
                {s.address && (
                  <div style={{ display: "flex", gap: 4, fontSize: 12, color: "#9B9B9B", marginTop: 4 }}>
                    <MapPin size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                    {s.address}
                  </div>
                )}
                {s.phone && (
                  <a href={`tel:${s.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 12, color: "#2563EB", textDecoration: "none" }}>
                    <Phone size={11} /> {s.phone}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Crime Chart */}
          {crimeChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Crimes by Category ({latestYear})</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={crimeChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9B9B9B" }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Traffic Revenue Chart */}
          {trafficChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Monthly Traffic Revenue (₹ thousands)</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={trafficChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9B9B9B" }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip formatter={(v) => [`₹${Number(v)}K`, "Revenue"]} />
                    <Bar dataKey="amount" fill="#D97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Crime Stats Table */}
          {crime.length > 0 && (
            <>
              <SectionLabel>Crime Statistics</SectionLabel>
              <DataTable
                columns={[
                  { key: "year", label: "Year", mono: true },
                  { key: "cat", label: "Category" },
                  { key: "count", label: "Count", mono: true, align: "right" },
                ]}
                rows={crime.map((c) => ({ year: c.year, cat: c.category, count: c.count.toLocaleString("en-IN") }))}
              />
            </>
          )}
        </>
      )}
      <ModuleNews district={district} state={state} locale={locale} module="police" />
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

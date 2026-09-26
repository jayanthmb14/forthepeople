/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Waves } from "lucide-react";
import { useWater } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock, LiveBadge, DataTable, ProgressBar, LastUpdatedBadge } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";

function WaterPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useWater(district, state);

  const dams = data?.data?.dams ?? [];
  const canals = data?.data?.canals ?? [];

  // Latest reading per dam
  const latestByDam: Record<string, typeof dams[0]> = {};
  dams.forEach((d) => { if (!latestByDam[d.damName]) latestByDam[d.damName] = d; });
  const damList = Object.values(latestByDam);

  // Historical data for first dam
  const firstDam = damList[0];
  const damHistory = dams.filter((d) => d.damName === firstDam?.damName).slice(0, 30).reverse().map((d) => ({
    date: new Date(d.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    storage: d.storagePct,
    inflow: d.inflow,
    outflow: d.outflow,
  }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Waves} title="Water & Dams" description="Live dam levels, inflow/outflow, canal release schedules" backHref={base} liveTag>
        <LastUpdatedBadge lastUpdated={data?.meta?.lastUpdated } />
      </ModuleHeader>

      {/* AI-crawler readable summary */}
      <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 16, padding: "12px 16px", background: "#FAFAF8", borderRadius: 8, borderLeft: "3px solid #2563EB" }}>
        This page shows live dam storage levels and canal release schedules for this district, updated every 30 minutes from India-WRIS (Water Resources Information System). Storage levels are shown as a percentage of total capacity. Data includes reservoir inflow, outflow, and current storage levels for dams and reservoirs serving this district.
      </p>
      {(() => { const _src = getModuleSources("water", state); return <DataSourceBanner moduleName="water" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="water" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && dams.length === 0 && canals.length === 0 && (
        <NoDataCard module="water" district={district} state={state} />
      )}

      {!isLoading && damList.length > 0 && (
        <>
          <SectionLabel action={<LiveBadge />}>Dam Status</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
            {damList.map((dam) => (
              <div key={dam.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{dam.damName}</div>
                    {dam.damNameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{dam.damNameLocal}</div>}
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-1px",
                    color: dam.storagePct > 75 ? "#16A34A" : dam.storagePct > 30 ? "#D97706" : "#DC2626",
                  }} title="Current water stored as a percentage of total reservoir capacity">
                    {dam.storagePct.toFixed(1)}%
                  </div>
                </div>
                <ProgressBar value={dam.storagePct} color={dam.storagePct > 75 ? "#2563EB" : dam.storagePct > 30 ? "#D97706" : "#DC2626"} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }} title="Current water level in the reservoir measured in feet">Level (ft) <span style={{ cursor: "help" }}>ℹ️</span></div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{dam.waterLevel.toFixed(1)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }} title="Volume of water flowing INTO the reservoir (cusecs)">Inflow <span style={{ cursor: "help" }}>ℹ️</span></div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{dam.inflow.toFixed(0)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }} title="Volume of water released FROM the reservoir for irrigation, drinking water, or flood management (cusecs)">Outflow <span style={{ cursor: "help" }}>ℹ️</span></div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#DC2626" }}>{dam.outflow.toFixed(0)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 10, textAlign: "right" }} title="Usable water stored vs total capacity in Million Cubic Metres">
                  Live Storage: {dam.storage.toFixed(0)} / {dam.maxStorage.toFixed(0)} MCM <span style={{ cursor: "help" }}>ℹ️</span>
                  · {new Date(dam.recordedAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          {/* Historical chart */}
          {damHistory.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>{firstDam.damName} — Storage % Trend</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={damHistory} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="damGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9B9B9B" }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Storage"]} />
                    <Area type="monotone" dataKey="storage" stroke="#2563EB" fill="url(#damGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Canal releases */}
          {canals.length > 0 && (
            <>
              <SectionLabel>Canal Release Schedule</SectionLabel>
              <DataTable
                columns={[
                  { key: "canal", label: "Canal" },
                  { key: "date", label: "Date" },
                  { key: "cusecs", label: "Cusecs", mono: true, align: "right" },
                  { key: "area", label: "Target Area" },
                  { key: "dur", label: "Duration" },
                ]}
                rows={canals.map((c) => ({
                  canal: c.canalName,
                  date: new Date(c.scheduledDate).toLocaleDateString("en-IN"),
                  cusecs: c.releaseCusecs.toFixed(0),
                  area: c.targetArea ?? "—",
                  dur: c.duration ?? "—",
                }))}
              />
            </>
          )}
        </>
      )}
      <ModuleNews district={district} state={state} locale={locale} module="water" />
    </div>
  );
}

export default function WaterPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Water & Dams">
      <WaterPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

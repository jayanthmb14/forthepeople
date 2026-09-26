/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { Building2 } from "lucide-react";
import { usePanchayats } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, ProgressBar, LoadingShell, ErrorBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";

export default function GramPanchayatPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePanchayats(district, state);
  const [search, setSearch] = useState("");

  const gps = data?.data ?? [];
  const filtered = search ? gps.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) : gps;

  const totalPop = gps.reduce((s, g) => s + (g.population ?? 0), 0);
  const totalHH = gps.reduce((s, g) => s + (g.households ?? 0), 0);
  const totalFunds = gps.reduce((s, g) => s + (g.totalFunds ?? 0), 0);
  const totalUtilized = gps.reduce((s, g) => s + (g.fundsUtilized ?? 0), 0);
  const overallUtilPct = totalFunds > 0 ? (totalUtilized / totalFunds) * 100 : 0;
  const roadConnected = gps.filter((g) => g.roadConnected).length;
  const totalMgnrega = gps.reduce((s, g) => s + (g.mgnregaWorks ?? 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Building2} title="Gram Panchayats" description="Panchayat-level data on population, water, MGNREGA, and funds" backHref={base} />
      {(() => { const _src = getModuleSources("gram-panchayat", state); return <DataSourceBanner moduleName="gram-panchayat" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="gram-panchayat" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && gps.length === 0 && (() => {
        const sc = getStateConfig(state);
        if (sc && !sc.gramPanchayatApplicable && sc.municipalBody) {
          const districtName = district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <div>
              <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)", border: "1px solid #BFDBFE", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1D4ED8", marginBottom: 6 }}>🏛️ Municipal Governance</div>
                <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.7 }}>
                  {districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>Municipal Body</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{sc.municipalBody}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>Responsible for urban governance, civic amenities, and infrastructure in {districtName}</div>
                </div>
                {sc.waterBoard && (
                  <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>Water Supply</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{sc.waterBoard}</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>Municipal water supply and sewerage management</div>
                  </div>
                )}
              </div>
              <div style={{ background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#9B9B9B" }}>
                📌 Data sourced from District NIC Portal and Municipal Corporation website.
              </div>
            </div>
          );
        }
        return <NoDataCard module="gram-panchayat" district={district} state={state} isUrban={true} />;
      })()}

      {!isLoading && gps.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="GPs" value={gps.length} icon={Building2} />
            <StatCard label="Population" value={totalPop > 0 ? `${(totalPop / 1000).toFixed(0)}K` : "—"} />
            <StatCard label="Households" value={totalHH > 0 ? `${(totalHH / 1000).toFixed(0)}K` : "—"} />
            <StatCard label="Road Connected" value={`${roadConnected}/${gps.length}`} accent="#16A34A" />
            <StatCard label="MGNREGA Works" value={totalMgnrega} />
            <StatCard label="Fund Utilization" value={`${overallUtilPct.toFixed(0)}%`} accent="#2563EB" />
          </div>

          {/* Funds overview */}
          {totalFunds > 0 && (
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Overall Fund Utilization</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#2563EB" }}>{overallUtilPct.toFixed(1)}%</div>
              </div>
              <ProgressBar pct={overallUtilPct} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#9B9B9B" }}>
                <span>₹{(totalUtilized / 100000).toFixed(1)}L utilized</span>
                <span>₹{(totalFunds / 100000).toFixed(1)}L allocated</span>
              </div>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search gram panchayat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E8E4",
              fontSize: 14, marginBottom: 16, background: "#FFF", boxSizing: "border-box",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {filtered.map((g) => {
              const utilPct = g.totalFunds && g.fundsUtilized ? (g.fundsUtilized / g.totalFunds) * 100 : 0;
              return (
                <div key={g.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{g.name}</div>
                      {g.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{g.nameLocal}</div>}
                    </div>
                    {g.roadConnected !== null && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10,
                        background: g.roadConnected ? "#F0FDF4" : "#FFF5F5",
                        color: g.roadConnected ? "#15803D" : "#DC2626",
                      }}>
                        {g.roadConnected ? "Road ✓" : "No Road"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {g.population && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>Population</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{g.population.toLocaleString("en-IN")}</div></div>}
                    {g.households && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>Households</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{g.households.toLocaleString("en-IN")}</div></div>}
                    {g.waterCoverage !== null && g.waterCoverage !== undefined && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>Water Coverage</div><div style={{ fontSize: 13, fontWeight: 600, color: "#0891B2" }}>{g.waterCoverage.toFixed(0)}%</div></div>}
                    {g.mgnregaWorks !== null && g.mgnregaWorks !== undefined && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>MGNREGA Works</div><div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{g.mgnregaWorks}</div></div>}
                  </div>
                  {g.totalFunds && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9B9B9B", marginBottom: 3 }}>
                        <span>Funds</span>
                        <span>{utilPct.toFixed(0)}% utilized</span>
                      </div>
                      <ProgressBar pct={utilPct} />
                      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
                        ₹{((g.fundsUtilized ?? 0) / 100000).toFixed(1)}L / ₹{(g.totalFunds / 100000).toFixed(1)}L
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

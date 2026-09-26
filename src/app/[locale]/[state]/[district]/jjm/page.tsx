/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useJJM } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, ProgressBar, LoadingShell, ErrorBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";

export default function JJMPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useJJM(district, state);

  const villages = data?.data ?? [];
  const totalHH = villages.reduce((s, v) => s + v.totalHouseholds, 0);
  const totalTaps = villages.reduce((s, v) => s + v.tapConnections, 0);
  const overallCoverage = totalHH > 0 ? (totalTaps / totalHH) * 100 : 0;
  const tested = villages.filter((v) => v.waterQualityTested).length;
  const testedPct = villages.length > 0 ? (tested / villages.length) * 100 : 0;

  const chartData = [...villages]
    .sort((a, b) => b.coveragePct - a.coveragePct)
    .slice(0, 20)
    .map((v) => ({
      name: (v.villageName ?? "Unknown").slice(0, 12),
      coverage: Math.round(v.coveragePct),
    }));

  const fullyConverted = villages.filter((v) => v.coveragePct >= 100).length;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Droplets} title="Jal Jeevan Mission" description="Tap water connection coverage across villages" backHref={base} />
      {(() => { const _src = getModuleSources("jjm", state); return <DataSourceBanner moduleName="jjm" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="jjm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && villages.length === 0 && (() => {
        const sc = getStateConfig(state);
        if (sc && !sc.jjmApplicable && sc.waterBoard) {
          const districtName = district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <div style={{ background: "linear-gradient(135deg, #ECFEFF 0%, #EFF6FF 100%)", border: "1px solid #A5F3FC", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0E7490", marginBottom: 6 }}>💧 Municipal Water Supply</div>
              <div style={{ fontSize: 13, color: "#155E75", lineHeight: 1.7, marginBottom: 12 }}>
                Jal Jeevan Mission provides tap water connections to rural households. {districtName} is an urban district — its water supply is managed by <strong>{sc.waterBoard}</strong>.
              </div>
              <div style={{ fontSize: 12, color: "#9B9B9B" }}>
                📌 For water supply complaints and information, contact {sc.waterBoard} or visit the {sc.municipalBody ?? "municipal corporation"} portal.
              </div>
            </div>
          );
        }
        return <NoDataCard module="jjm" district={district} state={state} isUrban={true} />;
      })()}

      {!isLoading && villages.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Villages Tracked" value={villages.length} icon={Droplets} />
            <StatCard label="Overall Coverage" value={`${overallCoverage.toFixed(1)}%`} accent="#16A34A" />
            <StatCard label="Tap Connections" value={totalTaps.toLocaleString("en-IN")} />
            <StatCard label="Total Households" value={totalHH.toLocaleString("en-IN")} />
            <StatCard label="Fully Covered" value={fullyConverted} />
            <StatCard label="Quality Tested" value={`${testedPct.toFixed(0)}%`} />
          </div>

          {/* Overall Progress */}
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>District-wide Tap Coverage</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{overallCoverage.toFixed(1)}%</div>
            </div>
            <ProgressBar pct={overallCoverage} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#9B9B9B" }}>
              <span>{totalTaps.toLocaleString("en-IN")} taps connected</span>
              <span>{totalHH.toLocaleString("en-IN")} total households</span>
            </div>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Village Coverage % (Top 20)</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9B9B9B" }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${Number(v)}%`, "Coverage"]} />
                    <ReferenceLine y={100} stroke="#16A34A" strokeDasharray="4 4" />
                    <Bar dataKey="coverage" fill="#0891B2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Village list */}
          <SectionLabel>Village-wise Status</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {villages.map((v) => (
              <div key={v.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{v.villageName ?? "Unknown Village"}</div>
                    <div style={{ fontSize: 12, color: "#9B9B9B" }}>
                      {v.tapConnections.toLocaleString("en-IN")} / {v.totalHouseholds.toLocaleString("en-IN")} households
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: v.coveragePct >= 100 ? "#16A34A" : v.coveragePct >= 50 ? "#D97706" : "#DC2626" }}>
                      {Math.round(v.coveragePct)}%
                    </div>
                    {v.waterQualityTested && (
                      <div style={{ fontSize: 10, color: v.waterQualityResult === "safe" ? "#16A34A" : "#D97706", fontWeight: 600 }}>
                        {v.waterQualityResult === "safe" ? "✓ Safe" : "⚠ Quality Issue"}
                      </div>
                    )}
                  </div>
                </div>
                <ProgressBar pct={v.coveragePct} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

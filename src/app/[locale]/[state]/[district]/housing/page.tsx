/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { use } from "react";
import { Home } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useHousing } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, ProgressBar, LoadingShell, ErrorBlock } from "@/components/district/ui";

function HousingPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useHousing(district, state);

  const schemes = data?.data ?? [];
  const totalTarget = schemes.reduce((s, h) => s + h.targetHouses, 0);
  const totalCompleted = schemes.reduce((s, h) => s + h.completed, 0);
  const totalInProgress = schemes.reduce((s, h) => s + h.inProgress, 0);
  const totalSanctioned = schemes.reduce((s, h) => s + h.sanctioned, 0);
  const overallPct = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

  const chartData = schemes.map((h) => ({
    name: h.schemeName.replace("Pradhan Mantri", "PM").replace("Awaas Yojana", "AY").slice(0, 16),
    completed: h.completed,
    inProgress: h.inProgress,
    remaining: Math.max(0, h.targetHouses - h.sanctioned),
  }));

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @media (max-width: 480px) {
          .housing-scheme-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .housing-fund-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 340px) {
          .housing-scheme-grid { grid-template-columns: 1fr !important; }
          .housing-fund-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <ModuleHeader icon={Home} title="Housing" description="PMAY and housing scheme progress — houses sanctioned, completed, in-progress" backHref={base} />
      <AIInsightCard module="housing" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Target Houses" value={totalTarget.toLocaleString("en-IN")} icon={Home} />
            <StatCard label="Sanctioned" value={totalSanctioned.toLocaleString("en-IN")} accent="#2563EB" />
            <StatCard label="Completed" value={totalCompleted.toLocaleString("en-IN")} accent="#16A34A" />
            <StatCard label="In Progress" value={totalInProgress.toLocaleString("en-IN")} accent="#D97706" />
          </div>

          {/* Overall progress */}
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Overall Completion</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{overallPct.toFixed(1)}%</div>
            </div>
            <ProgressBar pct={overallPct} />
          </div>

          {/* Stacked bar chart */}
          {chartData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Scheme-wise Progress</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9B9B9B" }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#16A34A" />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#D97706" />
                    <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
                  {[["#16A34A", "Completed"], ["#D97706", "In Progress"], ["#E5E7EB", "Remaining"]].map(([color, label]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B6B6B" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scheme cards */}
          <SectionLabel>Scheme Details</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {schemes.map((h) => {
              const completedPct = h.targetHouses > 0 ? (h.completed / h.targetHouses) * 100 : 0;
              const fundsSpentPct = h.fundsAllocated && h.fundsSpent ? (h.fundsSpent / h.fundsAllocated) * 100 : 0;
              return (
                <div key={h.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{h.schemeName}</div>
                      <div style={{ fontSize: 12, color: "#9B9B9B" }}>{h.fiscalYear}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{completedPct.toFixed(0)}%</div>
                  </div>
                  <div className="housing-scheme-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Target", value: h.targetHouses },
                      { label: "Sanctioned", value: h.sanctioned },
                      { label: "Completed", value: h.completed },
                      { label: "In Progress", value: h.inProgress },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{value.toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9B9B9B", marginBottom: 4 }}>
                      <span>Houses Completed</span><span>{completedPct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar pct={completedPct} />
                  </div>
                  {h.fundsAllocated && (
                    <div className="housing-fund-grid" style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { label: "Allocated", value: h.fundsAllocated },
                        { label: "Released", value: h.fundsReleased ?? 0 },
                        { label: "Spent", value: h.fundsSpent ?? 0 },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 11, color: "#9B9B9B" }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: label === "Spent" ? "#16A34A" : "#1A1A1A" }}>
                            ₹{(value / 10000000).toFixed(1)}Cr
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {h.fundsAllocated && h.fundsSpent && (
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar pct={fundsSpentPct} />
                      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>Funds utilization: {fundsSpentPct.toFixed(1)}%</div>
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

export default function HousingPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Housing">
      <HousingPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

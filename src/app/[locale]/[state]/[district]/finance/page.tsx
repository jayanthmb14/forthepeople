/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { PiggyBank, ShieldAlert, Award, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useBudget, useRevenue, useAIInsight } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, DataTable, ProgressBar, AIInsightBanner } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";

interface RedFlag {
  name: string;
  type: "Sector" | "Department";
  rate: number;
  metric: "Disbursement" | "Absorption";
  threshold: string;
}

function FinancePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: budgetData, isLoading: bLoading } = useBudget(district, state);
  const { data: revenueData, isLoading: rLoading } = useRevenue(district, state);
  const { data: aiInsight } = useAIInsight(district, "finance");

  // State to filter data feed type: "all" (includes live and estimates) or "cag" (strictly audited records)
  const [feedType, setFeedType] = useState<"all" | "cag">("all");

  const entries = budgetData?.data?.entries ?? [];
  const allocations = budgetData?.data?.allocations ?? [];
  const collections = revenueData?.data?.collections ?? [];

  // Determine if there is any officially audited CAG record in the database for this district
  const hasCagData = entries.some(
    (e) => !(e.source || "").toLowerCase().includes("estimate")
  ) || allocations.some(
    (a) => !(a.source || "").toLowerCase().includes("estimate") && !(a.remarks || "").toLowerCase().includes("estimate")
  );

  // Filter lists based on the interactive feed toggle
  const filteredEntries = entries.filter((e) => {
    if (feedType === "cag" && hasCagData) {
      return !(e.source || "").toLowerCase().includes("estimate");
    }
    return true;
  });

  const filteredAllocations = allocations.filter((a) => {
    if (feedType === "cag" && hasCagData) {
      return !(a.source || "").toLowerCase().includes("estimate") && !(a.remarks || "").toLowerCase().includes("estimate");
    }
    return true;
  });

  // Calculate year-specific metrics based on the filtered records
  const latestYear = filteredEntries.length > 0 ? filteredEntries[0].fiscalYear : null;
  const latestEntries = filteredEntries.filter((e) => e.fiscalYear === latestYear);
  const latestAllocations = filteredAllocations.filter((a) => a.fiscalYear === latestYear);

  // Sum values (stored in Rupees, divided by 1e7 for Crores)
  const totalAllocated = latestEntries.reduce((s, e) => s + e.allocated, 0);
  const totalReleased = latestEntries.reduce((s, e) => s + e.released, 0) || latestAllocations.reduce((s, a) => s + a.released, 0);
  const totalSpent = latestEntries.reduce((s, e) => s + e.spent, 0);
  const totalLapsed = latestAllocations.reduce((s, a) => s + a.lapsed, 0);

  // Ratios
  const releaseRate = totalAllocated > 0 ? Math.round((totalReleased / totalAllocated) * 100) : 0;
  const absorptionRate = totalReleased > 0 ? Math.round((totalSpent / totalReleased) * 100) : 0;
  const overallUtilRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const lapseRate = totalAllocated > 0 ? Math.round((totalLapsed / totalAllocated) * 100) : 0;

  // Red-Flag Identifiers check: release rate < 40% or overall utilization < 50%
  const redFlags: RedFlag[] = [];
  latestEntries.forEach((e) => {
    const eRelease = e.allocated > 0 ? (e.released / e.allocated) * 100 : 0;
    const eUtil = e.allocated > 0 ? (e.spent / e.allocated) * 100 : 0;
    if (eRelease < 40 && e.allocated > 0) {
      redFlags.push({ name: e.sector, type: "Sector", rate: Math.round(eRelease), metric: "Disbursement", threshold: "< 40%" });
    }
    if (eUtil < 50 && e.allocated > 0) {
      redFlags.push({ name: e.sector, type: "Sector", rate: Math.round(eUtil), metric: "Absorption", threshold: "< 50%" });
    }
  });

  latestAllocations.forEach((a) => {
    const aRelease = a.allocated > 0 ? (a.released / a.allocated) * 100 : 0;
    const aUtil = a.allocated > 0 ? (a.spent / a.allocated) * 100 : 0;
    if (aRelease < 40 && a.allocated > 0) {
      redFlags.push({ name: a.department, type: "Department", rate: Math.round(aRelease), metric: "Disbursement", threshold: "< 40%" });
    }
    if (aUtil < 50 && a.allocated > 0) {
      redFlags.push({ name: a.department, type: "Department", rate: Math.round(aUtil), metric: "Absorption", threshold: "< 50%" });
    }
  });

  const budgetChart = latestEntries.map((e) => ({
    sector: e.sector.length > 15 ? e.sector.slice(0, 15) + "…" : e.sector,
    allocated: Math.round(e.allocated / 10000000),
    released: Math.round(e.released / 10000000),
    spent: Math.round(e.spent / 10000000),
    utilPct: e.allocated > 0 ? Math.round((e.spent / e.allocated) * 100) : 0,
  }));

  const revChart = collections.slice(0, 12).map((c) => ({
    label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][c.month - 1]}`,
    amount: Math.round(c.amount / 100000),
    target: c.target ? Math.round(c.target / 100000) : 0,
  })).reverse();

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <ModuleHeader icon={PiggyBank} title="Finance & Budget" description="District budget allocation, treasury releases, expenditures and lapsed funds" backHref={base} />

      {(() => {
        const sc = getStateConfig(state);
        const stateFinSource = sc ? `${sc.name} Finance Department, PFMS, eGramSwaraj` : "State Finance Department, PFMS, eGramSwaraj";
        return (
          <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 20, padding: "12px 16px", background: "#F9FAFB", borderRadius: 8, borderLeft: "3px solid #7C3AED", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            This dashboard displays the budget lifecycle flow for this district. Figures are scaled to <strong>Indian Rupees in Crores</strong> (1 Crore = ₹10 million). Funding progresses from original allocations to actual treasury releases, and finally local expenditures. Unspent treasury releases that return to the central/state pool at the end of the year are tracked under &ldquo;Lapsed Funds.&rdquo;
          </p>
        );
      })()}

      {aiInsight && (
        <AIInsightBanner
          headline={aiInsight.headline}
          summary={aiInsight.summary}
          sentiment={aiInsight.sentiment}
          confidence={aiInsight.confidence}
          sourceUrls={aiInsight.sourceUrls}
          createdAt={aiInsight.createdAt}
        />
      )}

      {(() => { 
        const _src = getModuleSources("budget", state); 
        return <DataSourceBanner moduleName="budget" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; 
      })()}

      <AIInsightCard module="budget" district={district} />

      {bLoading && <LoadingShell rows={4} />}

      {!bLoading && (
        <>
          {/* Interactive Feed Toggle Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, background: "#F3F4F6", padding: 4, borderRadius: 8 }}>
              <button
                onClick={() => setFeedType("all")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: feedType === "all" ? "#FFF" : "transparent",
                  color: feedType === "all" ? "#111827" : "#4B5563",
                  fontWeight: feedType === "all" ? 600 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: feedType === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <RefreshCw size={12} /> All Feeds (Live & Estimates)
              </button>
              <button
                onClick={() => setFeedType("cag")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: feedType === "cag" ? "#FFF" : "transparent",
                  color: feedType === "cag" ? "#111827" : "#4B5563",
                  fontWeight: feedType === "cag" ? 600 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: feedType === "cag" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Award size={12} /> Verified CAG Audits Only
              </button>
            </div>

            {/* Audit Status Badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: hasCagData ? "#ECFDF5" : "#FFFBEB",
              border: hasCagData ? "1px solid #A7F3D0" : "1px solid #FDE68A",
              color: hasCagData ? "#047857" : "#B45309",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500
            }}>
              {hasCagData ? (
                <>✨ Contains verified historical audit records</>
              ) : (
                <>⚠️ Estimates feed based on historical state municipal rates</>
              )}
            </div>
          </div>

          {/* If the user clicked CAG audits but none exist, display fallback notice */}
          {feedType === "cag" && !hasCagData && (
            <div style={{ fontSize: 13, color: "#D97706", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
              Official Comptroller and Auditor General (CAG) verified audits are currently pending upload for this district. Visualizing local state finance treasury estimates instead.
            </div>
          )}

          {/* Primary Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatCard label="1. Total Budget (Allocated)" value={`₹${(totalAllocated / 10000000).toFixed(1)}Cr`} icon={PiggyBank} sub="Original Promised Funds" />
            <StatCard label="2. Released Funds" value={`₹${(totalReleased / 10000000).toFixed(1)}Cr`} accent="#D97706" sub={`${releaseRate}% Release Speed`} />
            <StatCard label="3. Local Spent" value={totalSpent === 0 && totalAllocated > 0 ? "Data pending" : `₹${(totalSpent / 10000000).toFixed(1)}Cr`} accent="#16A34A" sub={`${absorptionRate}% Absorption Capacity`} />
            <StatCard label="4. Lapsed Funds" value={totalSpent === 0 && totalLapsed === 0 ? "—" : `₹${(totalLapsed / 10000000).toFixed(1)}Cr`} accent="#DC2626" sub={`${lapseRate}% Capital Returned`} trend="down" />
          </div>

          {/* Core Utilization Ratios Panel */}
          <div style={{
            background: "#FFF",
            border: "1px solid #E8E8E4",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}>
            <SectionLabel>Treasury Speed & Efficiency Indicators</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
              <div style={{ borderRight: "1px solid #F3F4F6", paddingRight: 8 }}>
                <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>RELEASE RATE (Treasury Speed)</div>
                <div style={{ fontSize: 24, fontWeight: 700, margin: "6px 0", color: "#111827" }}>{releaseRate}%</div>
                <div style={{ fontSize: 11, color: "#6B6B6B" }}>How quickly the State Treasury disbursed allocated funds to district bodies.</div>
              </div>
              <div style={{ borderRight: "1px solid #F3F4F6", paddingRight: 8 }}>
                <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>ABSORPTION CAPACITY</div>
                <div style={{ fontSize: 24, fontWeight: 700, margin: "6px 0", color: "#16A34A" }}>{absorptionRate}%</div>
                <div style={{ fontSize: 11, color: "#6B6B6B" }}>Percentage of cash in-hand actually spent by local offices on civic works.</div>
              </div>
              <div style={{ borderRight: "1px solid #F3F4F6", paddingRight: 8 }}>
                <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>NET EFFICIENCY</div>
                <div style={{ fontSize: 24, fontWeight: 700, margin: "6px 0", color: "#2563EB" }}>{overallUtilRate}%</div>
                <div style={{ fontSize: 11, color: "#6B6B6B" }}>How much of the total budget promised actually resulted in localized expenditure.</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 600 }}>LAPSE RATIO</div>
                <div style={{ fontSize: 24, fontWeight: 700, margin: "6px 0", color: "#DC2626" }}>{lapseRate}%</div>
                <div style={{ fontSize: 11, color: "#6B6B6B" }}>Promised funds returned unutilized due to delay or administrative friction.</div>
              </div>
            </div>
          </div>

          {/* Red Flag Warning Center */}
          {redFlags.length > 0 && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 24,
              borderLeft: "4px solid #EF4444"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShieldAlert size={18} style={{ color: "#EF4444" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>
                  Treasury & Disbursement Red-Flags ({redFlags.length})
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#7F1D1D", marginBottom: 10, lineHeight: 1.5 }}>
                The following sectors or departments show severe administrative delay. Red flags trigger when funding releases fall below 40% (release speed) or overall spent is under 50% of the promised budget (low absorption).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {redFlags.map((flag, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: "#991B1B", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700 }}>• {flag.name} ({flag.type})</span>
                    <span style={{ background: "#FEE2E2", padding: "1px 6px", borderRadius: 4, fontSize: 10, border: "1px solid #FCA5A5" }}>
                      {flag.metric}: {flag.rate}% (Threshold {flag.threshold})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sankey-style horizontal pipeline visualizer */}
          <div style={{
            background: "#FFF",
            border: "1px solid #E8E8E4",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}>
            <SectionLabel>Budget Flow Pipeline — {latestYear}</SectionLabel>
            <p style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 20 }}>
              Tracing the path of public funds from allocation to disbursement and expenditure.
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}>
              {/* Row 1: Allocation to Release */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16
              }}>
                {/* Node 1: Allocated */}
                <div style={{
                  flex: 1,
                  minWidth: 200,
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 10, color: "#6B6B6B", fontWeight: 600, textTransform: "uppercase" }}>1. Original Allocation</div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: "4px 0", color: "#111827" }}>
                    ₹{(totalAllocated / 10000000).toFixed(1)} Cr
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Promised Budget (100%)</div>
                </div>

                {/* Connecting Release rate */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 10px",
                  minWidth: 90
                }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#FEF3C7",
                    color: "#D97706",
                    padding: "2px 8px",
                    borderRadius: 10,
                    marginBottom: 4,
                    border: "1px solid #FDE68A"
                  }}>
                    {releaseRate}%
                  </div>
                  <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
                    <path d="M0 8H55M55 8L49 2M55 8L49 14" stroke="#D97706" strokeWidth="2" strokeDasharray="4 2" />
                  </svg>
                  <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>Release Speed</div>
                </div>

                {/* Node 2: Released */}
                <div style={{
                  flex: 1,
                  minWidth: 200,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 10, color: "#D97706", fontWeight: 600, textTransform: "uppercase" }}>2. Treasury Release</div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: "4px 0", color: "#B45309" }}>
                    ₹{(totalReleased / 10000000).toFixed(1)} Cr
                  </div>
                  <div style={{ fontSize: 11, color: "#D97706" }}>Disbursed to Local Units</div>
                </div>
              </div>

              {/* Row 2: Branching to Spent and Lapsed */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "space-between",
                background: "#FAFAF9",
                padding: 14,
                borderRadius: 8,
                border: "1px dashed #E8E8E4"
              }}>
                {/* Branch 3A: Spent */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 220,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8,
                  padding: 14
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#22C55E",
                    boxShadow: "0 0 0 4px #DCFCE7"
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#15803D", fontWeight: 600, textTransform: "uppercase" }}>3A. Spent (Expenditure)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#166534" }}>
                      ₹{(totalSpent / 10000000).toFixed(1)} Cr
                    </div>
                    <div style={{ fontSize: 11, color: "#16A34A" }}>
                      Absorption Rate: {absorptionRate}% of released cash
                    </div>
                  </div>
                </div>

                {/* Branch 3B: Lapsed */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 220,
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 8,
                  padding: 14
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#EF4444",
                    boxShadow: "0 0 0 4px #FEE2E2"
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#991B1B", fontWeight: 600, textTransform: "uppercase" }}>3B. Lapsed / Unspent</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#991B1B" }}>
                      ₹{(totalLapsed / 10000000).toFixed(1)} Cr
                    </div>
                    <div style={{ fontSize: 11, color: "#DC2626" }}>
                      Lapse Ratio: {lapseRate}% of original budget
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {totalSpent === 0 && totalAllocated > 0 && (
            <div style={{ fontSize: 12, color: "#4B5563", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", marginBottom: 20, borderLeft: "3px solid #2563EB" }}>
              Allocation records are fully indexed. Monthly local disbursement tables will update dynamically as state Treasury / PFMS feeds refresh.
            </div>
          )}

          {/* Sector-wise Chart (showing Allocated vs Released vs Spent) */}
          {budgetChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>{latestYear} — Sector-wise Allocation, Release & Spent (₹ Cr)</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={budgetChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9B9B9B" }} tickFormatter={(v) => `₹${v}Cr`} />
                    <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: "#6B6B6B" }} width={120} />
                    <Tooltip formatter={(v) => [`₹${Number(v)}Cr`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11, marginTop: 10 }} />
                    <Bar dataKey="allocated" fill="#E5E7EB" radius={[0, 4, 4, 0]} name="Allocated" />
                    <Bar dataKey="released" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Released" />
                    <Bar dataKey="spent" fill="#10B981" radius={[0, 4, 4, 0]} name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Lapsed funds — Warning section */}
          {filteredAllocations.filter((a) => a.lapsed > 0).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>
                <span style={{ color: "#DC2626" }}>⚠️ Lapsed Department Funds (Unspent Releases)</span>
              </SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredAllocations.filter((a) => a.lapsed > 0).sort((a, b) => b.lapsed - a.lapsed).map((a) => (
                  <div key={a.id} style={{ background: "#FFF1F0", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{a.department}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#DC2626" }}>
                        ₹{(a.lapsed / 10000000).toFixed(2)}Cr lapsed
                      </div>
                    </div>
                    <ProgressBar value={a.spent} max={a.allocated} label={`${a.fiscalYear} · ₹${(a.allocated / 10000000).toFixed(1)}Cr allocated · Released: ₹${(a.released / 10000000).toFixed(1)}Cr`} color="#DC2626" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocations Table */}
          <SectionLabel>Department allocations & releases details</SectionLabel>
          <div style={{ marginBottom: 24 }}>
            <DataTable
              columns={[
                { key: "fy", label: "FY" },
                { key: "dept", label: "Department" },
                { key: "alloc", label: "Allocated (Cr)", mono: true, align: "right" },
                { key: "released", label: "Released (Cr)", mono: true, align: "right" },
                { key: "spent", label: "Spent (Cr)", mono: true, align: "right" },
                { key: "lapsed", label: "Lapsed (Cr)", mono: true, align: "right" },
              ]}
              rows={filteredAllocations.map((a) => ({
                fy: a.fiscalYear,
                dept: a.department,
                alloc: (a.allocated / 10000000).toFixed(2),
                released: (a.released / 10000000).toFixed(2),
                spent: (a.spent / 10000000).toFixed(2),
                lapsed: <span style={{ color: a.lapsed > 0 ? "#DC2626" : "#16A34A", fontWeight: a.lapsed > 0 ? 700 : 400 }}>
                  {(a.lapsed / 10000000).toFixed(2)}
                </span>,
              }))}
            />
          </div>
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="budget" />

      {/* Revenue Collections */}
      {!rLoading && revChart.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <SectionLabel>Revenue Collections (₹ Lakhs)</SectionLabel>
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                <Tooltip formatter={(v) => [`₹${Number(v)}L`, ""]} />
                <Bar dataKey="amount" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="target" fill="#EDE9FE" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Finance & Budget">
      <FinancePageInner params={params} />
    </ModuleErrorBoundary>
  );
}

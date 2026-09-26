/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { Vote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useElections } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, ErrorBlock, DataTable } from "@/components/district/ui";

const PARTY_COLORS: Record<string, string> = {
  BJP: "#FF6B00", INC: "#19A0F5", AAP: "#00AEEF", JD: "#2E8B57",
  SP: "#CC0000", BSP: "#1565C0", DMK: "#FF0000", ADMK: "#008000",
  TRS: "#FF69B4", YCP: "#006400",
};

function ElectionsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useElections(district, state);
  const [typeFilter, setTypeFilter] = useState("all");

  const results = data?.data?.results ?? [];
  const booths = data?.data?.booths ?? [];

  const types = ["all", ...Array.from(new Set(results.map((r) => r.electionType)))];
  const filtered = typeFilter === "all" ? results : results.filter((r) => r.electionType === typeFilter);

  const recentYear = results.length > 0 ? Math.max(...results.map((r) => r.year)) : 0;
  const latestResults = results.filter((r) => r.year === recentYear);
  const avgTurnout = latestResults.filter((r) => r.turnoutPct).reduce((s, r) => s + (r.turnoutPct ?? 0), 0) / (latestResults.filter(r => r.turnoutPct).length || 1);

  const turnoutChart = filtered
    .filter((r) => r.turnoutPct)
    .slice(0, 12)
    .map((r) => ({ name: r.constituency.slice(0, 12), turnout: r.turnoutPct ?? 0 }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Vote} title="Elections" description="Election results, turnout data, and polling booth finder" backHref={base} />

      {/* AI-crawler readable summary */}
      {(() => {
        const sc = getStateConfig(state);
        const electionInfo = sc?.lastElectionYear && sc?.lastElectionType
          ? `The ${sc.lastElectionYear} ${sc.lastElectionType} election results are the most recent.`
          : "Results shown are from the most recent elections.";
        return (
          <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 16, padding: "12px 16px", background: "#FAFAF8", borderRadius: 8, borderLeft: "3px solid #D97706" }}>
            This page shows assembly and parliamentary election results for constituencies in this district, sourced from the Election Commission of India (ECI). Results include winner names, party affiliations, vote counts, margins of victory, and voter turnout percentages. {electionInfo}
          </p>
        );
      })()}
      {(() => { const _src = getModuleSources("elections", state); return <DataSourceBanner moduleName="elections" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="elections" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Constituencies" value={new Set(results.map(r => r.constituency)).size} icon={Vote} />
            <StatCard label={`Latest Year`} value={recentYear || "—"} />
            <StatCard label="Avg Turnout" value={`${avgTurnout.toFixed(1)}%`} />
            <StatCard label="Polling Booths" value={booths.length} />
          </div>

          {/* Filter by type */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {types.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: typeFilter === t ? "#2563EB" : "#F5F5F0",
                color: typeFilter === t ? "#FFF" : "#6B6B6B",
                border: typeFilter === t ? "1px solid #2563EB" : "1px solid #E8E8E4",
              }}>
                {t === "all" ? `All (${results.length})` : `${t} (${results.filter(r => r.electionType === t).length})`}
              </button>
            ))}
          </div>

          {/* Turnout Chart */}
          {turnoutChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Voter Turnout by Constituency (%)</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={turnoutChart} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9B9B9B" }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Turnout"]} />
                    <Bar dataKey="turnout" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Results grid */}
          <SectionLabel>Results</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 24 }}>
            {filtered.slice(0, 20).map((r) => {
              const winColor = PARTY_COLORS[r.winnerParty.toUpperCase()] ?? "#6B7280";
              const margin = r.margin ?? (r.winnerVotes - (r.runnerUpVotes ?? 0));
              return (
                <div key={r.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{r.constituency}</div>
                      <div style={{ fontSize: 11, color: "#9B9B9B" }}>{r.electionType} · {r.year}</div>
                    </div>
                    {r.turnoutPct && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>Turnout</div>
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{r.turnoutPct.toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                  {/* Winner */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: `${winColor}10`, borderRadius: 8, border: `1px solid ${winColor}30` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: winColor, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{r.winnerName}</div>
                      <div style={{ fontSize: 11, color: winColor, fontWeight: 600 }}>{r.winnerParty}</div>
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{r.winnerVotes.toLocaleString("en-IN")}</div>
                  </div>
                  {/* Runner-up */}
                  {r.runnerUpName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, padding: "6px 10px", background: "#F9F9F7", borderRadius: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#4B4B4B" }}>{r.runnerUpName}</div>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>{r.runnerUpParty}</div>
                      </div>
                      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#6B6B6B" }}>{r.runnerUpVotes?.toLocaleString("en-IN")}</div>
                    </div>
                  )}
                  {margin > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#9B9B9B" }}>
                      Margin: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#16A34A" }}>{margin.toLocaleString("en-IN")}</span> votes
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <ModuleNews district={district} state={state} locale={locale} module="elections" />

          {/* Booth list */}
          {booths.length > 0 && (
            <>
              <SectionLabel>Polling Booths ({booths.length})</SectionLabel>
              <DataTable
                columns={[
                  { key: "no", label: "Booth #", mono: true },
                  { key: "name", label: "Booth Name" },
                  { key: "loc", label: "Location" },
                  { key: "const", label: "Constituency" },
                  { key: "voters", label: "Voters", mono: true, align: "right" },
                ]}
                rows={booths.map((b) => ({
                  no: b.boothNumber,
                  name: b.name,
                  loc: b.location,
                  const: b.constituency,
                  voters: b.totalVoters?.toLocaleString("en-IN") ?? "—",
                }))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ElectionsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Elections">
      <ElectionsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Elections — module page (Design v3 "Civic Ledger", CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//  PageHeader → summary paragraph → StatStrip → type Chips → turnout chart
//  → result cards → booth table → SourcesFooter → ModuleNews → Toolbar.
//  Election results do not have a "fetched at" time, so every number says
//  which election year it comes from instead. Party colour is only ever a
//  6 px dot (from the shared party-colors table), never a tinted box.
"use client";

import { use, useState } from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getPartyColor } from "@/lib/constants/party-colors";
import ModuleNews from "@/components/district/ModuleNews";
import { ArrowLeftRight, Download, Share2, Vote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useElections } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  DataTable,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("elections"). */
const SOURCE_URLS: Record<string, string> = {
  "Election Commission of India (ECI)": "https://eci.gov.in",
};

/** Chart styling from tokens: brand bars, text-2 axis labels, surface-2 grid. */
const AXIS_TICK = { fontSize: 11, fill: "var(--ftp-text-2)" };
const TOOLTIP_STYLE = {
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--ftp-text)",
};

/** A 6 px dot in the party's colour — the only place party colour appears. */
function PartyDot({ party }: { party?: string | null }) {
  return (
    <span
      aria-hidden
      style={{ width: 6, height: 6, borderRadius: "50%", background: getPartyColor(party).border, flexShrink: 0 }}
    />
  );
}

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ElectionsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useElections(district, state);
  const [typeFilter, setTypeFilter] = useState("all");
  const [shareNote, setShareNote] = useState<string | null>(null);

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

  const sc = getStateConfig(state);
  const electionInfo = sc?.lastElectionYear && sc?.lastElectionType
    ? `The ${sc.lastElectionYear} ${sc.lastElectionType} election results are the most recent.`
    : "Results shown are from the most recent elections.";
  const src = getModuleSources("elections", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.elections : undefined;
  // Honest "as of" for election numbers = the election they come from.
  const yearSub = recentYear ? `${recentYear} results` : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Elections", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  const onCsv = () =>
    downloadCsv(
      `${district}-election-results.csv`,
      results.map((r) => ({
        year: r.year,
        election_type: r.electionType,
        constituency: r.constituency,
        winner: r.winnerName,
        winner_party: r.winnerParty,
        winner_votes: r.winnerVotes,
        runner_up: r.runnerUpName ?? "",
        runner_up_party: r.runnerUpParty ?? "",
        runner_up_votes: r.runnerUpVotes ?? "",
        turnout_pct: r.turnoutPct ?? "",
        margin: r.margin ?? "",
        source: r.source,
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Vote}
        accent={getModuleAccent("elections")}
        title="Elections"
        titleLocal={titleLocal}
        description="Election results, turnout data, and polling booth finder"
        backHref={base}
        source={{ label: "ECI", href: SOURCE_URLS["Election Commission of India (ECI)"] }}
      />

      {/* AI-crawler readable summary — plain body text. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        This page shows assembly and parliamentary election results for constituencies in this district, sourced from the Election Commission of India (ECI). Results include winner names, party affiliations, vote counts, margins of victory, and voter turnout percentages. {electionInfo}
      </p>

      <AIInsightCard module="elections" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && results.length === 0 && booths.length === 0 && (
        <EmptyState
          title="No election results yet for this district."
          body="We add constituency results and booths as the Election Commission of India publishes them."
        />
      )}

      {!isLoading && (results.length > 0 || booths.length > 0) && (
        <>
          <div style={{ marginBottom: 24 }}>
            <StatStrip cols={4}>
              <StatTile icon={Vote} label="Constituencies" value={new Set(results.map(r => r.constituency)).size} sub={yearSub} />
              <StatTile label="Latest Year" value={recentYear || "—"} />
              <StatTile label="Avg Turnout" value={avgTurnout.toFixed(1)} unit="%" sub={yearSub} />
              <StatTile label="Polling Booths" value={booths.length} sub="Listed on this page" />
            </StatStrip>
          </div>

          {/* Filter by election type */}
          {results.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Chips
                label="Filter results by election type"
                value={typeFilter}
                onChange={setTypeFilter}
                items={types.map((t) => ({
                  value: t,
                  label: t === "all" ? "All" : t,
                  count: t === "all" ? results.length : results.filter((r) => r.electionType === t).length,
                }))}
              />
            </div>
          )}

          {/* Turnout Chart */}
          {turnoutChart.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Section title="Voter Turnout by Constituency (%)">
                <Card>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={turnoutChart} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                      <XAxis dataKey="name" tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={AXIS_TICK} domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Turnout"]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--ftp-surface-2)" }} />
                      <Bar dataKey="turnout" fill="var(--ftp-brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Section>
            </div>
          )}

          {/* Results grid */}
          {results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Section title="Results">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
                  {filtered.slice(0, 20).map((r) => {
                    const margin = r.margin ?? (r.winnerVotes - (r.runnerUpVotes ?? 0));
                    return (
                      <Card key={r.id} as="article" padding={14}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <h3 className="ftp-title">{r.constituency}</h3>
                            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                              {r.electionType} · <span className="ftp-num">{r.year}</span>
                            </div>
                          </div>
                          {r.turnoutPct && (
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div className="ftp-label">Turnout</div>
                              <div className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text)" }}>{r.turnoutPct.toFixed(1)}%</div>
                            </div>
                          )}
                        </div>
                        {/* Winner */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--ftp-border)" }}>
                          <PartyDot party={r.winnerParty} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{r.winnerName}</div>
                            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.winnerParty} · Winner</div>
                          </div>
                          <div className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text)" }}>{r.winnerVotes.toLocaleString("en-IN")}</div>
                        </div>
                        {/* Runner-up */}
                        {r.runnerUpName && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--ftp-border)" }}>
                            <PartyDot party={r.runnerUpParty} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{r.runnerUpName}</div>
                              <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.runnerUpParty}</div>
                            </div>
                            <div className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{r.runnerUpVotes?.toLocaleString("en-IN")}</div>
                          </div>
                        )}
                        {margin > 0 && (
                          <div style={{ marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            Margin: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{margin.toLocaleString("en-IN")}</span> votes
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}

          {/* Booth list */}
          {booths.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Section title={<>Polling Booths (<span className="ftp-num">{booths.length}</span>)</>}>
                <DataTable
                  caption="Polling booths in this district"
                  columns={[
                    { key: "no", label: "Booth #", mono: true },
                    { key: "name", label: "Booth Name" },
                    { key: "loc", label: "Location" },
                    { key: "const", label: "Constituency" },
                    { key: "voters", label: "Voters", numeric: true },
                  ]}
                  rows={booths.map((b) => ({
                    no: b.boothNumber,
                    name: b.name,
                    loc: b.location,
                    const: b.constituency,
                    voters: b.totalVoters?.toLocaleString("en-IN") ?? "—",
                  }))}
                />
              </Section>
            </div>
          )}
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name, url: SOURCE_URLS[name], frequency: src.frequency }))} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="elections" />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={results.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=elections&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
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

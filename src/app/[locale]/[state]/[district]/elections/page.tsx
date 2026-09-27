/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Elections — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  PageHeader → summary paragraph → StatStrip of emoji tiles → the picture
//  ("In simple words" + a pictogram of voters and a turnout dial, from the
//  latest year's real turnout) → a ring of who won the seats in the latest
//  election with two or more constituencies here → type Chips → turnout
//  ChartCard → result cards (each with a head-to-head bar of the top two
//  candidates' votes) → booth table → SourcesFooter → ModuleNews → Toolbar.
//  Election results do not have a "fetched at" time, so every number says
//  which election year it comes from instead. Party colour is only ever a
//  6 px dot (from the shared party-colors table), never a tinted box.
//
//  Language: interface text comes from the "page_elections" namespace;
//  numbers and percentages go through useFormat(). Candidate, party and
//  constituency names are records and are shown as stored. Election types
//  arrive in several spellings ("ASSEMBLY", "Assembly", "LokSabha"…); they
//  are grouped by a normalised key and shown translated when known.
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getPartyColor } from "@/lib/constants/party-colors";
import ModuleNews from "@/components/district/ModuleNews";
import { ArrowLeftRight, Download, Share2, Vote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useElections } from "@/hooks/useRealtimeData";
import type { ElectionResult } from "@/hooks/useRealtimeData";
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
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import { useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("elections"). */
const SOURCE_URLS: Record<string, string> = {
  "Election Commission of India (ECI)": "https://eci.gov.in",
};
const ECI = { label: "ECI", href: SOURCE_URLS["Election Commission of India (ECI)"] };
/** Update frequencies from getModuleSources() that have a translation. */
const FREQ_KEY: Record<string, string> = { "Post-election": "postElection" };

/** "ASSEMBLY" / "Assembly" → "assembly"; "LOK_SABHA" / "Lok Sabha" / "LokSabha" → "loksabha". */
function typeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z]/g, "");
}

/** A 6 px dot in the party's colour — the only place party colour appears. */
function PartyDot({ party }: { party?: string | null }) {
  return (
    <span
      aria-hidden
      style={{ width: 6, height: 6, borderRadius: "50%", background: getPartyColor(party).border, flexShrink: 0 }}
    />
  );
}

/** The small filled "Winner" tag beside the winning candidate's name. */
const WINNER_TAG: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 18,
  padding: "0 8px",
  borderRadius: "var(--ftp-radius-pill)",
  background: "var(--hue)",
  color: "#fff",
  fontSize: 11,
  lineHeight: "16px",
  fontWeight: 600,
};

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

/**
 * Head-to-head bar for one result: the winner's share of the top two
 * candidates' votes in the page hue, the runner-up's in grey. Drawn only
 * when both vote counts are known.
 */
function VoteSplit({ r }: { r: ElectionResult }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const wv = r.winnerVotes;
  const rv = r.runnerUpVotes ?? 0;
  if (!r.runnerUpName || !(wv > 0) || !(rv > 0)) return null;
  const share = wv / (wv + rv);
  const pct = (x: number) => f.number(x, { style: "percent", maximumFractionDigits: 0 });
  return (
    <figure style={{ margin: "8px 10px 2px" }}>
      <div
        role="img"
        aria-label={t("splitAria", { winner: r.winnerName, wv: f.number(wv), runner: r.runnerUpName, rv: f.number(rv) })}
        style={{ display: "flex", gap: 2, height: 10, borderRadius: "var(--ftp-radius-pill)", overflow: "hidden" }}
      >
        <span className="ftp-grow-x" style={{ width: `${share * 100}%`, background: "linear-gradient(90deg, var(--hue-pop), var(--hue))" }} />
        <span style={{ flex: 1, background: "color-mix(in srgb, var(--ftp-text-2) 28%, #fff)" }} />
      </div>
      <figcaption style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        <span className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{pct(share)}</span>
        <span style={{ textAlign: "center" }}>{t("splitCaption")}</span>
        <span className="ftp-num">{pct(1 - share)}</span>
      </figcaption>
    </figure>
  );
}

/**
 * The seats ring: for the most recent election that has two or more
 * constituencies in this district, how many each party won. Hidden when no
 * election qualifies (a ring of one seat says nothing).
 */
function SeatsRing({ results, typeLabel }: { results: ElectionResult[]; typeLabel: (raw: string) => string }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const groups = new Map<string, ElectionResult[]>();
  for (const r of results) {
    const k = `${typeKey(r.electionType)}|${r.year}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const pick = [...groups.values()]
    .filter((g) => g.length >= 2)
    .sort((a, b) => b[0].year - a[0].year || b.length - a.length)[0];
  if (!pick) return null;
  const byParty = new Map<string, number>();
  for (const r of pick) byParty.set(r.winnerParty, (byParty.get(r.winnerParty) ?? 0) + 1);
  const slices = [...byParty.entries()].map(([party, value]) => ({ key: party, label: party, value })).sort((a, b) => b.value - a.value);
  const total = pick.length;
  const top = slices[0];
  const tied = slices.filter((s) => s.value === top.value).length;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const simple =
    tied > 1
      ? t("seatsTied", { count: f.number(tied), n: f.number(top.value), total: f.number(total) })
      : t.rich("seatsTop", { party: top.label, n: f.number(top.value), total: f.number(total), b });
  const summary = slices.map((s) => `${s.label}: ${f.number(s.value)}`).join(", ");
  const year = pick[0].year;
  return (
    <div style={{ marginBottom: 24 }}>
      <ChartCard
        title={t("seatsTitle")}
        emoji="🏆"
        units={t("seatsUnits", { type: typeLabel(pick[0].electionType), year })}
        simple={simple}
        source={ECI}
        asOfPeriod={t("yearResults", { year })}
        table={slices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
      >
        <HueDonut
          slices={slices}
          centerValue={f.number(total)}
          centerLabel={t("seatsCenter", { n: total })}
          ariaLabel={t("seatsAria", { summary })}
          otherLabel={t("seatsOther")}
        />
      </ChartCard>
    </div>
  );
}

function ElectionsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_elections");
  const mt = useModuleText();
  const place = usePlaceText();
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useElections(district, state);
  const [typeFilter, setTypeFilter] = useState("all");
  const [shareNote, setShareNote] = useState<string | null>(null);

  const results = data?.data?.results ?? [];
  // The API holds results back until they are checked against ECI.
  const withheld = Boolean((data?.data as { resultsWithheld?: boolean } | undefined)?.resultsWithheld);
  const booths = data?.data?.booths ?? [];

  const typeLabel = (raw: string) => {
    const k = typeKey(raw);
    return t.has(`types.${k}`) ? t(`types.${k}`) : raw;
  };
  const pctText = (v: number, digits = 1) =>
    f.number(v / 100, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits });
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  // Chips group the several spellings of one election type together.
  const typeKeys = Array.from(new Set(results.map((r) => typeKey(r.electionType))));
  const types = ["all", ...typeKeys];
  const filtered = typeFilter === "all" ? results : results.filter((r) => typeKey(r.electionType) === typeFilter);

  const recentYear = results.length > 0 ? Math.max(...results.map((r) => r.year)) : 0;
  const latestResults = results.filter((r) => r.year === recentYear);
  const avgTurnout = latestResults.filter((r) => r.turnoutPct).reduce((s, r) => s + (r.turnoutPct ?? 0), 0) / (latestResults.filter(r => r.turnoutPct).length || 1);
  // How many of the latest results carry a turnout figure. With none, the
  // average above is 0 by construction — shown as "—", never as "0 %".
  const turnoutCount = latestResults.filter((r) => r.turnoutPct).length;
  const hasTurnout = turnoutCount > 0;

  const withTurnout = filtered.filter((r) => r.turnoutPct).slice(0, 12);
  // The same constituency can appear for several years (Mandya 2019 and
  // 2024); add the year to those labels so the bars and the "highest /
  // lowest" sentence don't read "Mandya … Mandya".
  const repeated = new Set(
    withTurnout.map((r) => r.constituency).filter((c, i, all) => all.indexOf(c) !== i),
  );
  const turnoutChart = withTurnout
    .map((r) => ({
      name: repeated.has(r.constituency) ? `${r.constituency.slice(0, 9)} ${r.year}` : r.constituency.slice(0, 12),
      // Full name, type and year for the tooltip and the table view.
      nameFull: repeated.has(r.constituency) ? `${r.constituency} ${r.year}` : r.constituency,
      type: typeLabel(r.electionType),
      year: r.year,
      turnout: r.turnoutPct ?? 0,
    }));
  const chartYears = Array.from(new Set(turnoutChart.map((r) => r.year))).sort((a, b) => a - b);
  const chartPeriod =
    chartYears.length === 0
      ? undefined
      : chartYears.length === 1
        ? t("yearResults", { year: chartYears[0] })
        : t("yearsResults", { from: chartYears[0], to: chartYears[chartYears.length - 1] });
  const chartHigh = turnoutChart.length > 0 ? turnoutChart.reduce((a, b) => (b.turnout > a.turnout ? b : a)) : null;
  const chartLow = turnoutChart.length > 0 ? turnoutChart.reduce((a, b) => (b.turnout < a.turnout ? b : a)) : null;

  const sc = getStateConfig(state);
  const electionInfo =
    sc?.lastElectionYear && sc?.lastElectionType
      ? /assembly$/i.test(sc.lastElectionType)
        ? t("latestAssembly", { year: sc.lastElectionYear, state: place.state(state, sc.name) })
        : t("latestOther", { year: sc.lastElectionYear, type: sc.lastElectionType })
      : t("latestNone");
  const src = getModuleSources("elections", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.elections : undefined;
  // Honest "as of" for election numbers = the election they come from.
  const yearSub = recentYear ? t("yearResults", { year: recentYear }) : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: mt.label("elections"), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(t("linkCopied"));
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
        title={mt.label("elections")}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        source={ECI}
      />

      {/* AI-crawler readable summary — plain body text. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        {t("summary")} {electionInfo}
      </p>

      <AIInsightCard module="elections" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && results.length === 0 && booths.length === 0 && (
        withheld ? (
          <EmptyState emoji="🔎" title={t("withheldTitle")} body={t("withheldBody")} />
        ) : (
          <EmptyState emoji="🗳️" title={t("emptyTitle")} body={t("emptyBody")} />
        )
      )}

      {!isLoading && (results.length > 0 || booths.length > 0) && (
        <>
          <div style={{ marginBottom: 16 }}>
            <StatStrip cols={4}>
              <StatTile emoji="🗺️" label={t("tileConstituencies")} value={f.number(new Set(results.map(r => r.constituency)).size)} sub={yearSub} />
              {/* A year is a label, not an amount: no count-up from 0. */}
              <StatTile emoji="📅" label={t("tileLatestYear")} value={recentYear ? String(recentYear) : "—"} countUp={false} />
              <StatTile
                emoji="🙋"
                label={t("tileTurnout")}
                value={hasTurnout ? f.number(avgTurnout, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
                unit={hasTurnout ? "%" : undefined}
                sub={yearSub}
              />
              <StatTile emoji="🏫" label={t("tileBooths")} value={f.number(booths.length)} sub={t("tileBoothsSub")} />
            </StatStrip>
          </div>

          {/* The picture: ten voters with the turnout share lit, and a dial.
              Same number as the "Average turnout" tile; drawn only when the
              latest results carry turnout figures. */}
          {hasTurnout && (
            <div className="ftp-picture-row" style={{ marginBottom: 24 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🗳️">
                  {t.rich("simple", { year: recentYear, pct: Math.round(avgTurnout), count: turnoutCount, b })}
                </Explainer>
                <Pictogram
                  filled={avgTurnout / 10}
                  emoji="🙋"
                  label={t("pictogram", { n: Math.round(avgTurnout / 10), year: recentYear })}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge value={avgTurnout} label={t("gaugeLabel")} caption={t("gaugeCaption", { year: recentYear })} />
              </Card>
            </div>
          )}

          {/* Second picture: who won the seats in the latest multi-seat election. */}
          <SeatsRing results={results} typeLabel={typeLabel} />

          {/* Filter by election type */}
          {results.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Chips
                label={t("chipsLabel")}
                value={typeFilter}
                onChange={setTypeFilter}
                items={types.map((k) => ({
                  value: k,
                  label: k === "all" ? t("all") : typeLabel(results.find((r) => typeKey(r.electionType) === k)?.electionType ?? k),
                  count: k === "all" ? results.length : results.filter((r) => typeKey(r.electionType) === k).length,
                }))}
              />
            </div>
          )}

          {/* Turnout chart — only with two or more bars (never a chart of one point). */}
          {turnoutChart.length > 1 && chartHigh && chartLow && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("chartTitle")}
                emoji="📊"
                units={t("chartUnits")}
                simple={t.rich("chartSimple", {
                  high: chartHigh.nameFull,
                  highPct: pctText(chartHigh.turnout),
                  low: chartLow.nameFull,
                  lowPct: pctText(chartLow.turnout),
                  b: (c) => <strong>{c}</strong>,
                })}
                legend={[{ label: t("chartLegend"), swatch: "linear-gradient(180deg, var(--hue), var(--hue-pop))" }]}
                source={ECI}
                asOfPeriod={chartPeriod}
                table={turnoutChart.map((r) => ({
                  label: t("chartRow", { name: r.nameFull, type: r.type, year: r.year }),
                  value: pctText(r.turnout),
                }))}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={turnoutChart} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="name" tick={CHART_AXIS} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={CHART_AXIS} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(v) => [pctText(Number(v)), t("chartLegend")]}
                      labelFormatter={(_, payload) => {
                        const row = payload?.[0]?.payload;
                        return row ? `${row.nameFull}, ${row.year}` : "";
                      }}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="turnout" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("chartLegend")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Results grid */}
          {results.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Section title={t("results")} emoji="🏆">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
                  {filtered.slice(0, 20).map((r) => {
                    const margin = r.margin ?? (r.winnerVotes - (r.runnerUpVotes ?? 0));
                    return (
                      <Card key={r.id} as="article" padding={16}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 16, borderRadius: 10 }}>
                              {typeKey(r.electionType) === "loksabha" ? "🏛️" : "🏢"}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="ftp-title" style={{ fontWeight: 600 }}>{r.constituency}</h3>
                              <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                                {typeLabel(r.electionType)}, <span className="ftp-num">{r.year}</span>
                              </div>
                            </div>
                          </div>
                          {r.turnoutPct && (
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div className="ftp-label">{t("turnout")}</div>
                              <div className="ftp-num" style={{ fontSize: 15, color: "var(--hue-deep)" }}>{pctText(r.turnoutPct)}</div>
                            </div>
                          )}
                        </div>
                        {/* Winner — on a soft hue band */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: "var(--ftp-radius-tile)",
                            background: "var(--hue-tint)",
                          }}
                        >
                          <PartyDot party={r.winnerParty} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{r.winnerName}</span>
                              <span style={WINNER_TAG}>{t("winner")}</span>
                            </div>
                            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.winnerParty}</div>
                          </div>
                          <div className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)" }}>{f.number(r.winnerVotes)}</div>
                        </div>
                        {/* Runner-up */}
                        {r.runnerUpName && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                            <PartyDot party={r.runnerUpParty} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{r.runnerUpName}</div>
                              <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.runnerUpParty}</div>
                            </div>
                            {r.runnerUpVotes != null && (
                              <div className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{f.number(r.runnerUpVotes)}</div>
                            )}
                          </div>
                        )}
                        <VoteSplit r={r} />
                        {margin > 0 && (
                          <div style={{ marginTop: 6, paddingTop: 8, borderTop: "1px solid var(--ftp-border)", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            {t.rich("wonBy", {
                              n: f.number(margin),
                              b: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</span>,
                            })}
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
            <div style={{ marginTop: 8 }}>
              <Section title={t("boothsTitle", { n: f.number(booths.length) })} emoji="🏫">
                <DataTable
                  caption={t("boothsCaption")}
                  columns={[
                    { key: "no", label: t("colBoothNo"), mono: true },
                    { key: "name", label: t("colBoothName") },
                    { key: "loc", label: t("colLocation") },
                    { key: "const", label: t("colConstituency") },
                    { key: "voters", label: t("colVoters"), numeric: true },
                  ]}
                  rows={booths.map((booth) => ({
                    no: booth.boothNumber,
                    name: booth.name,
                    loc: booth.location,
                    const: booth.constituency,
                    voters: booth.totalVoters != null ? f.number(booth.totalVoters) : "—",
                  }))}
                />
              </Section>
            </div>
          )}
        </>
      )}

      <SourcesFooter
        sources={src.sources.map((name) => ({
          name,
          url: SOURCE_URLS[name],
          frequency: FREQ_KEY[src.frequency] ? t(`freq.${FREQ_KEY[src.frequency]}`) : src.frequency,
        }))}
      />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        {t("notOfficial")}
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="elections" />

      <Toolbar label={t("toolbar")}>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={results.length === 0}>
          {t("downloadCsv")}
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? t("share")}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=elections&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function ElectionsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("elections")}>
      <ElectionsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

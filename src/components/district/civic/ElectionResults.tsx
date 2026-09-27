/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  ElectionResults — past results for the Elections page
// ═══════════════════════════════════════════════════════════════════════
//  Shown only when /api/data/elections returns results. Today the API
//  WITHHOLDS them (resultsWithheld: true) until every row is re-checked
//  against results.eci.gov.in, so this renders nothing; it is kept ready
//  for when the owner switches results back on.
//
//  Turnout picture (10 voters lit + dial) → seats ring for the latest
//  multi-seat election → type chips → turnout chart → result cards (each
//  with a head-to-head bar of the top two candidates). Election results
//  have no "fetched at" time, so every number names its election year.
//  Party colour is only ever a small dot.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ElectionResult } from "@/hooks/useRealtimeData";
import { Card, Chips, Section } from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Gauge, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { Building2, Hand, Landmark } from "lucide-react";
import { IconPictogram } from "@/components/district/calm-parts";
import { HueDonut } from "@/components/district/civic/HueDonut";
import { getPartyColor } from "@/lib/constants/party-colors";
import { useFormat } from "@/i18n/client";

const ECI = { label: "ECI", href: "https://eci.gov.in" };

/** "ASSEMBLY" / "Assembly" → "assembly"; "LOK_SABHA" / "Lok Sabha" / "LokSabha" → "loksabha". */
export function typeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z]/g, "");
}

function PartyDot({ party }: { party?: string | null }) {
  return <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: getPartyColor(party).border, flexShrink: 0 }} />;
}

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

/** Head-to-head bar: winner's share of the top two candidates' votes. */
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

/** Seats ring for the most recent election with two or more constituencies here. */
function SeatsRing({ results, typeLabel }: { results: ElectionResult[]; typeLabel: (raw: string) => string }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const groups = new Map<string, ElectionResult[]>();
  for (const r of results) {
    const k = `${typeKey(r.electionType)}|${r.year}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const pick = [...groups.values()].filter((g) => g.length >= 2).sort((a, b) => b[0].year - a[0].year || b.length - a.length)[0];
  if (!pick) return null;
  const byParty = new Map<string, number>();
  for (const r of pick) byParty.set(r.winnerParty, (byParty.get(r.winnerParty) ?? 0) + 1);
  const slices = [...byParty.entries()].map(([party, value]) => ({ key: party, label: party, value })).sort((a, b) => b.value - a.value);
  const total = pick.length;
  const top = slices[0];
  const tied = slices.filter((s) => s.value === top.value).length;
  const simple =
    tied > 1
      ? t("seatsTied", { count: f.number(tied), n: f.number(top.value), total: f.number(total) })
      : t.rich("seatsTop", { party: top.label, n: f.number(top.value), total: f.number(total), b: (c) => <strong>{c}</strong> });
  const summary = slices.map((s) => `${s.label}: ${f.number(s.value)}`).join(", ");
  const year = pick[0].year;
  return (
    <ChartCard
      title={t("seatsTitle")}
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
  );
}

export function ElectionResults({ results }: { results: ElectionResult[] }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const [typeFilter, setTypeFilter] = useState("all");
  if (results.length === 0) return null;

  const typeLabel = (raw: string) => {
    const k = typeKey(raw);
    return t.has(`types.${k}`) ? t(`types.${k}`) : raw;
  };
  const pctText = (v: number, digits = 1) =>
    f.number(v / 100, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits });
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const typeKeys = Array.from(new Set(results.map((r) => typeKey(r.electionType))));
  const types = ["all", ...typeKeys];
  const filtered = typeFilter === "all" ? results : results.filter((r) => typeKey(r.electionType) === typeFilter);

  const recentYear = Math.max(...results.map((r) => r.year));
  const latest = results.filter((r) => r.year === recentYear && r.turnoutPct);
  const turnoutCount = latest.length;
  const avgTurnout = turnoutCount > 0 ? latest.reduce((s, r) => s + (r.turnoutPct ?? 0), 0) / turnoutCount : 0;

  const withTurnout = filtered.filter((r) => r.turnoutPct).slice(0, 12);
  const repeated = new Set(withTurnout.map((r) => r.constituency).filter((c, i, all) => all.indexOf(c) !== i));
  const turnoutChart = withTurnout.map((r) => ({
    name: repeated.has(r.constituency) ? `${r.constituency.slice(0, 9)} ${r.year}` : r.constituency.slice(0, 12),
    nameFull: repeated.has(r.constituency) ? `${r.constituency} ${r.year}` : r.constituency,
    type: typeLabel(r.electionType),
    year: r.year,
    turnout: r.turnoutPct ?? 0,
  }));
  const chartYears = Array.from(new Set(turnoutChart.map((r) => r.year))).sort((a, c) => a - c);
  const chartPeriod =
    chartYears.length === 0
      ? undefined
      : chartYears.length === 1
        ? t("yearResults", { year: chartYears[0] })
        : t("yearsResults", { from: chartYears[0], to: chartYears[chartYears.length - 1] });
  const chartHigh = turnoutChart.length > 0 ? turnoutChart.reduce((a, c) => (c.turnout > a.turnout ? c : a)) : null;
  const chartLow = turnoutChart.length > 0 ? turnoutChart.reduce((a, c) => (c.turnout < a.turnout ? c : a)) : null;

  return (
    <Section title={t("results")}>
      {turnoutCount > 0 && (
        <div className="ftp-picture-row" style={{ marginBottom: 16 }}>
          <Card tinted padding={18}>
            <Explainer>{t.rich("simple", { year: recentYear, pct: Math.round(avgTurnout), count: turnoutCount, b })}</Explainer>
            <IconPictogram filled={avgTurnout / 10} icon={Hand} label={t("pictogram", { n: Math.round(avgTurnout / 10), year: recentYear })} />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={avgTurnout} label={t("gaugeLabel")} caption={t("gaugeCaption", { year: recentYear })} />
          </Card>
        </div>
      )}

      <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "360px", marginBottom: 16 } as React.CSSProperties}>
        <SeatsRing results={results} typeLabel={typeLabel} />
        {turnoutChart.length > 1 && chartHigh && chartLow && (
          <ChartCard
            title={t("chartTitle")}
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
            table={turnoutChart.map((r) => ({ label: t("chartRow", { name: r.nameFull, type: r.type, year: r.year }), value: pctText(r.turnout) }))}
          >
            <ResponsiveContainer width="100%" height={240}>
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
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
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

      <div className="ftp-grid">
        {filtered.slice(0, 24).map((r) => {
          const margin = r.margin ?? r.winnerVotes - (r.runnerUpVotes ?? 0);
          return (
            <Card key={r.id} as="article" padding={16}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                  <span className="ftp-icon-chip" aria-hidden style={{ width: 28, height: 28, borderRadius: 9 }}>
                    {typeKey(r.electionType) === "loksabha" ? <Landmark size={15} /> : <Building2 size={15} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="ftp-title" style={{ fontWeight: 600 }}>{r.constituency}</h3>
                    <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                      {typeLabel(r.electionType)}, <span className="ftp-num">{r.year}</span>
                    </div>
                  </div>
                </div>
                {r.turnoutPct ? (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="ftp-label">{t("turnout")}</div>
                    <div className="ftp-num" style={{ fontSize: 15, color: "var(--hue-deep)" }}>{pctText(r.turnoutPct)}</div>
                  </div>
                ) : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: "var(--ftp-radius-tile)", background: "var(--hue-tint)" }}>
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
              {r.runnerUpName && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                  <PartyDot party={r.runnerUpParty} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{r.runnerUpName}</div>
                    <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.runnerUpParty}</div>
                  </div>
                  {r.runnerUpVotes != null && <div className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{f.number(r.runnerUpVotes)}</div>}
                </div>
              )}
              <VoteSplit r={r} />
              {margin > 0 && (
                <div style={{ marginTop: 6, paddingTop: 8, borderTop: "1px solid var(--ftp-border)", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                  {t.rich("wonBy", { n: f.number(margin), b: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</span> })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

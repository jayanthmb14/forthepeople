/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Police & safety — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Who keeps my district safe, how do I reach them, and is
//  crime going up or down?"
//
//    PageHeader (with a tap-to-call 112 button)
//    → Explainer: the answer in one or two sentences, from real data
//    → up to 4 StatTiles (stations, NCRB cases, change, traffic fines)
//    → ONE picture: NCRB total cases, last year vs this year; when NCRB
//      has no two years, the "how to report a crime" steps take its place
//    → station cards; tapping one opens a DetailSheet (officer, phone,
//      email, address; Call / Directions / Email)
//    → charts (NCRB only): cases by type, up or down by type, traffic fines
//    → police posts filled vs sanctioned → every crime figure with its source
//    → AI insight → Share / Compare → news. v5: no emoji; sources, "not
//    an official website" and the stale note come from the district shell.
//
//  Honesty: crime CHARTS use NCRB rows only (source mentions NCRB / Crime
//  in India). Rows from a police department's own report are listed at the
//  bottom with their source but never charted. The data API already drops
//  rows taken from news articles. Words: src/dictionaries/<locale>/page_police.json.
"use client";

import type React from "react";
import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileText, Hash, Phone, Receipt, Shield, Siren, TrendingUp } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleNews from "@/components/district/ModuleNews";
import { usePolice, type PoliceStation } from "@/hooks/useRealtimeData";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcePill,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, HowItWorks, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { ThenNowRow } from "@/components/accountability/AccountabilityVisuals";
import {
  CardChip,
  CardList,
  ChartRow,
  SheetAction,
  SheetNote,
  ShowAllButton,
  mapsHref,
  telHref,
} from "@/components/accountability/AccountabilityKit";
import { ListCard, SearchBox, ThenNowBars } from "@/components/district/calm-parts";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import PoliceStaffing from "@/components/accountability/PoliceStaffing";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

/** Stations as stored: the API also sends the map point when we have it. */
type Station = PoliceStation & { lat?: number | null; lng?: number | null };

/** NCRB rows: "NCRB", "NCRB / ncrb.gov.in", "Crime in India · NCRB". */
const NCRB_RE = /ncrb|crime in india/i;
/** The all-crimes row ("IPC Crimes Total", "IPC Crimes"), which already contains the other categories. */
const TOTAL_RE = /\btotal\b|^ipc crimes?$/i;
/** Cards shown before "Show all". */
const FIRST_CARDS = 12;
/** Search appears when the list is longer than this. */
const SEARCH_FROM = 12;
/** 1 lakh = 1,00,000 rupees. Traffic amounts are stored in rupees. */
const LAKH = 100_000;
const NCRB = { label: "NCRB", href: "https://ncrb.gov.in" };

/** National helplines (fixed numbers, not district data). */
const HELPLINES = [
  { key: "helpCyber", number: "1930" },
  { key: "helpWomen", number: "1091" },
  { key: "helpChild", number: "1098" },
] as const;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function PolicePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_police");
  const ta = useTranslations("page_accountability");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const hue = hueClass("police");
  const { data, isLoading, error } = usePolice(district, state);
  const [open, setOpen] = useState<Station | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpen(null), []);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const num = (n: number) => f.number(n);
  const lakh = (amount: number) => f.number(amount / LAKH, { maximumFractionDigits: 1 });
  const pct = (share: number) => f.number(share, { style: "percent", maximumFractionDigits: 0 });

  const stations = useMemo(() => (data?.data?.stations ?? []) as Station[], [data]);
  const crime = data?.data?.crime ?? [];
  const traffic = data?.data?.traffic ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const hasAnyData = stations.length > 0 || crime.length > 0 || traffic.length > 0;

  // ── Stations ────────────────────────────────────────────────────────
  const withPhone = stations.filter((s) => telHref(s.phone)).length;
  const q = query.trim().toLowerCase();
  const matches = q
    ? stations.filter((s) => [s.name, s.nameLocal, s.address, s.sho].some((v) => v?.toLowerCase().includes(q)))
    : stations;
  const shown = q || showAll ? matches : matches.slice(0, FIRST_CARDS);

  // ── Crime (NCRB only for anything drawn) ────────────────────────────
  const ncrb = crime.filter((c) => NCRB_RE.test(c.source));
  const years = [...new Set(ncrb.map((c) => c.year))].sort((a, b) => b - a);
  const latestYear = years[0] ?? null;
  const prevYear = years[1] ?? null;
  const totalFor = (year: number | null) =>
    year === null ? null : (ncrb.find((c) => c.year === year && TOTAL_RE.test(c.category))?.count ?? null);
  const totalNow = totalFor(latestYear);
  const totalPrev = totalFor(prevYear);
  const hasChange = totalNow !== null && totalPrev !== null && totalPrev > 0;
  const change = hasChange ? (totalNow - totalPrev) / totalPrev : 0;
  const changeText = !hasChange || totalNow === totalPrev ? t("pictureSame") : change > 0 ? t("pictureMore", { pct: pct(change) }) : t("pictureFewer", { pct: pct(-change) });

  // Types of crime in the newest NCRB year, without the all-crimes row.
  const latestTypes = ncrb.filter((c) => c.year === latestYear && !TOTAL_RE.test(c.category));
  const typeChart = [...latestTypes]
    .sort((a, b) => b.count - a.count)
    .map((c) => ({ nameFull: c.category, name: c.category.length > 18 ? `${c.category.slice(0, 17)}…` : c.category, count: c.count }));
  const topType = typeChart[0];

  // Up or down by type: same category name in both years, earlier figure above zero.
  const trendRows =
    prevYear === null
      ? []
      : latestTypes
          .map((c) => {
            const before = ncrb.find((p) => p.year === prevYear && p.category === c.category);
            return before && before.count > 0 ? { category: c.category, then: before.count, now: c.count } : null;
          })
          .filter((r): r is { category: string; then: number; now: number } => r !== null)
          .sort((a, b) => b.now - a.now)
          .slice(0, 6);
  const trendMax = Math.max(1, ...trendRows.flatMap((r) => [r.then, r.now]));
  const trendUp = trendRows.filter((r) => r.now > r.then).length;
  const rowChange = (then: number, now: number) =>
    now === then ? t("trendSame") : now > then ? t("trendUp", { pct: pct((now - then) / then) }) : t("trendDown", { pct: pct((then - now) / then) });

  // ── Traffic fines ───────────────────────────────────────────────────
  const latestTraffic = traffic.reduce<(typeof traffic)[number] | null>(
    (latest, tr) => (!latest || new Date(tr.date) > new Date(latest.date) ? tr : latest),
    null,
  );
  const latestMonth = latestTraffic ? f.date(latestTraffic.date, { month: "long", year: "numeric" }) : "";
  const trafficChart = [...traffic]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)
    .map((tr) => ({ label: f.date(tr.date, { month: "short", year: "2-digit" }), amount: Math.round(tr.amount / 1000) }));
  const topTrafficMonth = [...trafficChart].sort((a, b) => b.amount - a.amount)[0];
  const trafficSource = traffic.find((tr) => tr.source)?.source ?? null;
  const target = latestTraffic?.monthlyTarget ?? null;

  // ── The one-sentence answer ─────────────────────────────────────────
  const explainParts: React.ReactNode[] = [];
  if (stations.length > 0) {
    explainParts.push(t.rich("explainStations", { n: stations.length, district: districtName, b: bold }));
    if (withPhone > 0) explainParts.push(t("explainPhones", { phones: withPhone }));
  }
  if (latestYear !== null && totalNow !== null) {
    const vals = { count: num(totalNow), year: String(latestYear), prev: String(prevYear ?? ""), pct: pct(Math.abs(change)), b: bold };
    explainParts.push(
      !hasChange
        ? t.rich("explainCrimeOne", vals)
        : totalNow > (totalPrev ?? 0)
          ? t.rich("explainCrimeUp", vals)
          : totalNow < (totalPrev ?? 0)
            ? t.rich("explainCrimeDown", vals)
            : t.rich("explainCrimeSame", vals),
    );
  } else if (latestYear !== null && latestTypes.length > 0) {
    explainParts.push(t("explainCrimeTypes", { year: String(latestYear) }));
  }

  const howSteps = [
    { emoji: "", title: t("how1"), body: t("how1Body") },
    { emoji: "", title: t("how2"), body: t("how2Body") },
    { emoji: "", title: t("how3"), body: t("how3Body") },
    { emoji: "", title: t("how4"), body: t("how4Body") },
  ];
  // The steps carry their own title where no Section heading sits above them.
  const howToReport = (withTitle: boolean) => (
    <Card padding={18}>
      <HowItWorks title={withTitle ? t("howTitle") : undefined} steps={howSteps} />
      <div style={{ marginTop: 12 }}>
        <SourcePill label={t("howSource")} />
      </div>
    </Card>
  );

  const call112 = (
    <a
      href="tel:112"
      aria-label={t("call112Aria")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 999,
        background: "#fff",
        color: "var(--ftp-danger)",
        fontSize: 15,
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 8px 18px -10px rgba(0,0,0,0.45)",
      }}
    >
      <Phone size={16} aria-hidden />
      {t("call112")}
    </a>
  );

  const openTel = open ? telHref(open.phone) : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Shield}
        title={mt.label("police")}
        description={mt.description("police")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={ncrb.length > 0 ? NCRB : undefined}
      >
        {call112}
      </PageHeader>

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && !hasAnyData && (
        <>
          <EmptyState title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
          <div style={{ marginTop: 20 }}>{howToReport(true)}</div>
        </>
      )}

      {!isLoading && hasAnyData && (
        <>
          {explainParts.length > 0 && (
            <Explainer>
              {explainParts.map((part, i) => (
                <span key={i}>
                  {i > 0 ? " " : ""}
                  {part}
                </span>
              ))}
            </Explainer>
          )}

          {/* Only figures we actually have — never a fake zero. */}
          <StatStrip>
            {stations.length > 0 && (
              <StatTile icon={Siren} label={t("tileStations")} value={num(stations.length)} sub={t("tileStationsSub", { phones: num(withPhone) })} />
            )}
            {totalNow !== null && latestYear !== null && (
              <StatTile icon={FileText} label={t("tileCases")} value={num(totalNow)} sub={t("tileCasesSub", { year: String(latestYear) })} />
            )}
            {hasChange && latestYear !== null && prevYear !== null && (
              <StatTile
                icon={TrendingUp}
                label={t("tileChange")}
                value={f.number(change, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" })}
                sub={t("tileChangeSub", { prev: String(prevYear), year: String(latestYear) })}
                trend={change > 0 ? "up" : change < 0 ? "down" : "neutral"}
                countUp={false}
              />
            )}
            {latestTraffic && (
              <StatTile
                icon={Receipt}
                label={t("tileTraffic")}
                value={`₹${lakh(latestTraffic.amount)}`}
                unit={t("lakhUnit")}
                sub={t("tileTrafficSub", { month: latestMonth })}
                asOf={latestTraffic.date}
              />
            )}
          </StatStrip>

          {/* ONE picture: NCRB total, last year vs this year. Without two
              NCRB years, the "how to report a crime" steps stand in. */}
          <div style={{ marginTop: 16 }}>
            {hasChange && latestYear !== null && prevYear !== null && totalNow !== null && totalPrev !== null ? (
              <div className="ftp-picture-row">
                <Card padding={18}>
                  <h2 className="ftp-display" style={{ margin: "0 0 14px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
                    {t("pictureTitle", { prev: String(prevYear), year: String(latestYear) })}
                  </h2>
                  <ThenNowBars
                    thenLabel={String(prevYear)}
                    nowLabel={String(latestYear)}
                    thenValue={totalPrev}
                    nowValue={totalNow}
                    thenText={num(totalPrev)}
                    nowText={num(totalNow)}
                    changeText={changeText}
                    ariaLabel={t("pictureAria", { prevCount: num(totalPrev), prev: String(prevYear), count: num(totalNow), year: String(latestYear) })}
                  />
                </Card>
                <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                  <p className="ftp-label">{t("tileChangeSub", { prev: String(prevYear), year: String(latestYear) })}</p>
                  <div
                    className="ftp-bignum"
                    style={{
                      fontSize: 40,
                      lineHeight: 1.05,
                      color: change > 0 ? "var(--ftp-warn)" : "var(--hue-deep)",
                    }}
                  >
                    {f.number(change, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" })}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ftp-text-2)" }}>{t("pictureNote")}</p>
                  <div>
                    <SourcePill label={NCRB.label} href={NCRB.href} />
                  </div>
                </Card>
              </div>
            ) : (
              howToReport(true)
            )}
          </div>

          {/* The station list: tap a card, see everything. */}
          {stations.length > 0 && (
            <Section title={t("stationsTitle")}>
              <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)" }}>
                {t("stationsHint")}
              </p>
              {stations.length > SEARCH_FROM && (
                <SearchBox value={query} onChange={setQuery} label={t("searchLabel")} placeholder={t("searchPlaceholder")} />
              )}
              {matches.length === 0 ? (
                <EmptyState title={t("noMatch", { q: query.trim() })} />
              ) : (
                <CardList label={t("stationsTitle")}>
                  {shown.map((s) => {
                    const local = s.nameLocal && s.nameLocal !== s.name ? s.nameLocal : null;
                    return (
                      <ListCard
                        key={s.id}
                        title={s.name}
                        titleLang="en"
                        sub={local ? <span lang={scriptLang(local)}>{local}</span> : s.address ?? undefined}
                        hint={ta("seeDetails")}
                        onOpen={() => setOpen(s)}
                      >
                        {s.phone ? (
                          <CardChip>
                            <span className="ftp-num">{s.phone}</span>
                          </CardChip>
                        ) : (
                          <CardChip>{t("noPhone")}</CardChip>
                        )}
                        {s.sho && <CardChip>{t("chipSho", { name: s.sho })}</CardChip>}
                      </ListCard>
                    );
                  })}
                </CardList>
              )}
              {!q && matches.length > FIRST_CARDS && (
                <ShowAllButton expanded={showAll} total={matches.length} onToggle={() => setShowAll((x) => !x)} />
              )}

              {/* More national helplines, one tap each. */}
              <Card padding={14} style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="ftp-label">{t("helplinesTitle")}</span>
                  {HELPLINES.map((h) => (
                    <a
                      key={h.number}
                      href={`tel:${h.number}`}
                      aria-label={t("helpCallAria", { name: t(h.key), number: h.number })}
                      className="ftp-btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        minHeight: 44,
                        padding: "0 12px",
                        borderRadius: 999,
                        border: "1px solid var(--ftp-border)",
                        background: "var(--ftp-surface)",
                        color: "var(--ftp-text)",
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      <Hash size={14} aria-hidden style={{ color: "var(--hue-deep)" }} />
                      <strong className="ftp-num">{h.number}</strong>
                      <span style={{ color: "var(--ftp-text-2)" }}>{t(h.key)}</span>
                    </a>
                  ))}
                  <Link
                    href={`${base}/citizen-corner`}
                    style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                  >
                    {t("helpMore")} →
                  </Link>
                </div>
              </Card>
            </Section>
          )}

          {/* The steps live here when the picture slot showed the NCRB change. */}
          {hasChange && (
            <Section title={t("howTitle")}>
              {howToReport(false)}
            </Section>
          )}

          {/* Charts: NCRB rows only; traffic fines from the traffic police. */}
          {(typeChart.length > 1 || trendRows.length > 0 || trafficChart.length > 1) && (
            <ChartRow>
              {typeChart.length > 1 && latestYear !== null && (
                <ChartCard
                  title={t("crimeTitle", { year: String(latestYear) })}
                  units={totalNow !== null ? t("crimeUnitsTotal") : t("crimeUnits")}
                  simple={topType ? t.rich("crimeSimple", { name: topType.nameFull, n: topType.count, count: num(topType.count), b: bold }) : null}
                  source={NCRB}
                  asOfPeriod={String(latestYear)}
                  table={typeChart.map((r) => ({ label: r.nameFull, value: num(r.count) }))}
                >
                  <ResponsiveContainer width="100%" height={Math.max(180, typeChart.length * 40 + 40)}>
                    <BarChart data={typeChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                      <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} />
                      <YAxis type="category" dataKey="name" tick={CHART_AXIS} width={120} interval={0} />
                      <Tooltip
                        formatter={(v) => [num(Number(v)), t("tooltipCases")]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.nameFull ?? ""}
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "var(--hue-tint)" }}
                      />
                      <Bar dataKey="count" name={t("tooltipCases")} fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {prevYear !== null && latestYear !== null && trendRows.length > 0 && (
                <ChartCard
                  title={t("trendTitle", { prev: String(prevYear) })}
                  units={t("trendUnits", { prev: String(prevYear) })}
                  simple={t.rich("trendSimple", { up: trendUp, n: trendRows.length, prev: String(prevYear), latest: String(latestYear), b: bold })}
                  legend={[
                    { label: String(prevYear), swatch: "#D8D5CB" },
                    { label: String(latestYear), swatch: "var(--hue)" },
                  ]}
                  source={NCRB}
                  asOfPeriod={t("yearsPeriod", { prev: String(prevYear), latest: String(latestYear) })}
                  table={trendRows.map((r) => ({
                    label: r.category,
                    value: t("trendTableValue", { prev: String(prevYear), then: num(r.then), latest: String(latestYear), now: num(r.now) }),
                  }))}
                >
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {trendRows.map((r, i) => (
                      <ThenNowRow
                        key={r.category}
                        index={i}
                        label={r.category}
                        thenValue={r.then}
                        nowValue={r.now}
                        thenText={t("yearValue", { year: String(prevYear), value: num(r.then) })}
                        nowText={t("yearValue", { year: String(latestYear), value: num(r.now) })}
                        changeText={rowChange(r.then, r.now)}
                        direction={r.now > r.then ? "up" : r.now < r.then ? "down" : "same"}
                        max={trendMax}
                      />
                    ))}
                  </ul>
                </ChartCard>
              )}

              {trafficChart.length > 1 && latestTraffic && (
                <ChartCard
                  title={t("trafficTitle")}
                  units={t("trafficUnits")}
                  simple={
                    target && target > 0
                      ? t.rich("trafficSimpleTarget", { month: latestMonth, amount: lakh(latestTraffic.amount), target: lakh(target), b: bold })
                      : topTrafficMonth
                        ? t.rich("trafficSimple", { month: topTrafficMonth.label, amount: num(topTrafficMonth.amount), b: bold })
                        : null
                  }
                  legend={[{ label: t("legendCollected"), swatch: "var(--hue)" }]}
                  source={trafficSource ? { label: trafficSource } : undefined}
                  asOf={latestTraffic.date}
                  table={trafficChart.map((r) => ({ label: r.label, value: t("thousandRupees", { amount: num(r.amount) }) }))}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={trafficChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                      <XAxis dataKey="label" tick={CHART_AXIS} angle={-30} textAnchor="end" />
                      <YAxis tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} width={44} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(v) => [t("thousandRupees", { amount: num(Number(v)) }), t("legendCollected")]}
                        cursor={{ fill: "var(--hue-tint)" }}
                      />
                      <Bar dataKey="amount" name={t("legendCollected")} fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </ChartRow>
          )}

          <PoliceStaffing district={district} state={state} />

          {/* Every crime row we hold, grouped by year, each with its source. */}
          {crime.length > 0 && (
            <Section title={t("allFiguresTitle")}>
              <details>
                <summary
                  style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: "var(--hue-deep)" }}
                >
                  {t("allFiguresSummary", { n: crime.length })}
                </summary>
                <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px", marginTop: 12 } as React.CSSProperties}>
                  {[...new Set(crime.map((c) => c.year))]
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <Card key={year} padding={14}>
                        <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>
                          {year}
                        </h3>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                          {crime
                            .filter((c) => c.year === year)
                            .map((c) => (
                              <li key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14, lineHeight: "20px" }}>
                                <span style={{ minWidth: 0 }}>
                                  <span lang="en">{c.category}</span>
                                  <span style={{ display: "block", fontSize: 12, color: "var(--ftp-text-2)" }}>
                                    {t("sourceLabel", { source: c.source })}
                                  </span>
                                </span>
                                <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                                  {num(c.count)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </Card>
                    ))}
                </div>
              </details>
            </Section>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <AIInsightCard module="police" district={district} />
      </div>

      <MoneyToolbar shareTitle={mt.label("police")} compareHref={`/${locale}/compare?module=police&a=${district}`} />

      <ModuleNews district={district} state={state} locale={locale} module="police" />

      {/* Everything about one station, without leaving the page. */}
      <DetailSheet
        open={open !== null}
        onClose={closeSheet}
        title={open?.name ?? ""}
        titleLang="en"
        subtitle={
          open?.nameLocal && open.nameLocal !== open.name ? (
            <span lang={scriptLang(open.nameLocal)}>{open.nameLocal}</span>
          ) : (
            t("stationSub", { district: districtName })
          )
        }
        hueClassName={hue}
        footer={
          open ? (
            <>
              {openTel && (
                <SheetAction href={openTel} ariaLabel={t("callAria", { name: open.name, phone: open.phone ?? "" })}>
                  {t("call")}
                </SheetAction>
              )}
              <SheetAction
                href={mapsHref({ lat: open.lat, lng: open.lng, query: [open.name, open.address ?? districtName].join(", ") })}
                quiet={Boolean(openTel)}
                external
              >
                {t("directions")}
              </SheetAction>
              {open.email && (
                <SheetAction href={`mailto:${open.email}`} quiet>
                  {t("email")}
                </SheetAction>
              )}
            </>
          ) : null
        }
      >
        {open && (
          <>
            <DetailList
              rows={[
                { label: t("rowSho"), value: open.sho, lang: "en" },
                {
                  label: t("rowPhone"),
                  value: open.phone ? (
                    openTel ? (
                      <a href={openTel} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                        {open.phone}
                      </a>
                    ) : (
                      <span className="ftp-num">{open.phone}</span>
                    )
                  ) : (
                    t("noPhone")
                  ),
                },
                { label: t("rowEmail"), value: open.email ? <a href={`mailto:${open.email}`}>{open.email}</a> : null },
                { label: t("rowAddress"), value: open.address, lang: "en" },
              ]}
            />
            <SheetNote>{t("sheetNote")}</SheetNote>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function PolicePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("police")}>
      <PolicePageInner params={params} />
    </ModuleErrorBoundary>
  );
}

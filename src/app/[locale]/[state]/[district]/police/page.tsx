/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Police & Traffic module page — Design v4 "Rang" module recipe (see the
// finance page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles
//   (only figures we actually have) → picture (traffic fines vs the monthly
//   target, only when the target is on file) → staffing → station directory
//   (with a count row of what the directory holds) → crime + "up or down
//   since last year" + traffic ChartCards → crime table → honest EmptyState
//   when nothing is loaded → sources + Share/Compare → news.
// Data comes from usePolice() (stations, NCRB crime rows, traffic challans).
// Every word on the page comes from src/dictionaries/<locale>/page_police.json.

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Shield, Phone, MapPin } from "lucide-react";
import { usePolice } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  DataTable,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { CountChips, ThenNowRow } from "@/components/accountability/AccountabilityVisuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import StaffingWidget from "@/components/district/StaffingWidget";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** 1 lakh = 100,000 rupees. Traffic amounts are stored in rupees. */
const LAKH = 100_000;

/** Bold text inside translated sentences (t.rich "<b>…</b>"). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function PolicePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_police");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtInfo = getDistrict(state, district);
  // In sentences, use the district's local name when the page is in its language.
  const districtName =
    districtInfo?.nameLocal && scriptLang(districtInfo.nameLocal) === locale
      ? districtInfo.nameLocal
      : districtInfo?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = usePolice(district, state);

  /** "12.3" lakh, one decimal, Indian grouping. */
  const lakh = (amount: number) => f.number(amount / LAKH, { maximumFractionDigits: 1 });
  const num = (n: number) => f.number(n);

  const stations = data?.data?.stations ?? [];
  const crime = data?.data?.crime ?? [];
  const traffic = data?.data?.traffic ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const hasAnyData = stations.length > 0 || crime.length > 0 || traffic.length > 0;

  const totalCrimes = crime.reduce((s, c) => s + c.count, 0);
  const totalTraffic = traffic.reduce((s, tr) => s + tr.amount, 0);
  // How many stat tiles will show (2 minimum so a lone tile is not stretched).
  const tileCols = Math.max(2, [stations.length > 0, totalCrimes > 0, totalTraffic > 0].filter(Boolean).length) as 2 | 3;
  // Newest traffic month — the "as of" date for the revenue tile.
  const latestTrafficDate = traffic.reduce<string | null>(
    (latest, tr) => (!latest || new Date(tr.date) > new Date(latest) ? tr.date : latest),
    null,
  );

  // Crime by category (latest year)
  const years = [...new Set(crime.map((c) => c.year))].sort((a, b) => b - a);
  const latestYear = years[0] ?? 0;
  const prevYear = years[1] ?? null;
  const latestCrime = crime.filter((c) => c.year === latestYear);
  const crimeChart = latestCrime.map((c) => ({
    // Full name for the tooltip and table; a shorter one for the axis.
    nameFull: c.category,
    name: c.category.length > 22 ? c.category.slice(0, 21) + "…" : c.category,
    count: c.count,
  }));
  // NCRB rows often include a "… total" category that already contains the
  // others, so the chart says so instead of implying the bars add up.
  const hasTotalRow = latestCrime.some((c) => /total/i.test(c.category));
  const topCrime = [...crimeChart].sort((a, b) => b.count - a.count)[0];

  // Up or down since the previous year on file: only categories recorded
  // under the same name in both years, and only when the earlier figure is
  // above zero (a change from zero has no honest percentage).
  const trendRows =
    prevYear === null
      ? []
      : latestCrime
          .map((c) => {
            const before = crime.find((p) => p.year === prevYear && p.category === c.category);
            return before && before.count > 0 ? { category: c.category, then: before.count, now: c.count } : null;
          })
          .filter((r): r is { category: string; then: number; now: number } => r !== null)
          .sort((a, b) => b.now - a.now)
          .slice(0, 6);
  const trendMax = Math.max(1, ...trendRows.flatMap((r) => [r.then, r.now]));
  const trendUp = trendRows.filter((r) => r.now > r.then).length;
  const changeText = (then: number, now: number) => {
    if (now === then) return t("trendSame");
    const pct = f.number(Math.abs(now - then) / then, { style: "percent", maximumFractionDigits: 0 });
    return now > then ? t("trendUp", { pct }) : t("trendDown", { pct });
  };

  // Traffic monthly
  const trafficChart = traffic
    .slice(0, 12)
    .map((tr) => ({
      label: f.date(tr.date, { month: "short", year: "2-digit" }),
      amount: Math.round(tr.amount / 1000),
      challans: tr.challans ?? 0,
    }))
    .reverse();
  const topTrafficMonth = [...trafficChart].sort((a, b) => b.amount - a.amount)[0];
  const trafficSource = traffic.find((tr) => tr.source)?.source ?? null;

  // The picture: the newest month's fines against its monthly target —
  // only when the target is on file, never an assumed one.
  const latestTraffic = latestTrafficDate ? traffic.find((tr) => tr.date === latestTrafficDate) : undefined;
  const target = latestTraffic?.monthlyTarget ?? 0;
  const targetPct = latestTraffic && target > 0 ? (latestTraffic.amount / target) * 100 : null;
  const latestMonthLabel = latestTraffic ? f.date(latestTraffic.date, { month: "long", year: "numeric" }) : "";

  // What the station directory holds — a count row, only for fields we have.
  const withPhone = stations.filter((s) => s.phone).length;
  const withSho = stations.filter((s) => s.sho).length;
  const withAddress = stations.filter((s) => s.address).length;
  const directoryChips = [
    { key: "stations", emoji: "🚓", value: num(stations.length), label: t("chipStations", { n: stations.length }) },
    withPhone > 0 && { key: "phone", emoji: "📞", value: t("nOfTotal", { n: num(withPhone), total: num(stations.length) }), label: t("chipPhone") },
    withSho > 0 && { key: "sho", emoji: "👮", value: t("nOfTotal", { n: num(withSho), total: num(stations.length) }), label: t("chipSho") },
    withAddress > 0 && { key: "address", emoji: "📍", value: t("nOfTotal", { n: num(withAddress), total: num(stations.length) }), label: t("chipAddress") },
  ].filter((c): c is { key: string; emoji: string; value: string; label: string } => Boolean(c));

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Shield}
        title={mt.label("police")}
        description={mt.description("police")}
        backHref={base}
        accent={getModuleAccent("police")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={{ label: "NCRB", href: "https://ncrb.gov.in" }}
      />

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        {t("summary", { district: districtName })}
      </p>

      <AIInsightCard module="police" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && !hasAnyData && (
        <EmptyState emoji="👮" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
      )}

      {/* Only figures we actually have — never a fake zero. */}
      {!isLoading && hasAnyData && (
        <StatStrip cols={tileCols}>
          {stations.length > 0 && <StatTile emoji="🚓" label={t("tileStations")} value={num(stations.length)} sub={t("tileStationsSub")} />}
          {totalCrimes > 0 && (
            <StatTile emoji="📁" label={t("tileCrimes")} value={num(totalCrimes)} sub={t("tileCrimesSub", { year: String(latestYear) })} />
          )}
          {totalTraffic > 0 && (
            <StatTile
              emoji="🧾"
              label={t("tileTraffic")}
              value={`₹${lakh(totalTraffic)}`}
              unit={t("lakhUnit")}
              sub={t("tileTrafficSub")}
              asOf={latestTrafficDate}
            />
          )}
        </StatStrip>
      )}

      {/* The picture: fines collected in the newest month against that
          month's target. Same numbers as the traffic chart below. */}
      {!isLoading && latestTraffic && targetPct !== null && (
        <div className={targetPct <= 100 ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="🚦">
              {targetPct >= 100
                ? t.rich("explainMet", { month: latestMonthLabel, amount: lakh(latestTraffic.amount), target: lakh(target), b: bold })
                : t.rich("explainPart", {
                    month: latestMonthLabel,
                    amount: lakh(latestTraffic.amount),
                    target: lakh(target),
                    pct: num(Math.round(targetPct)),
                    b: bold,
                  })}
            </Explainer>
            <Pictogram
              filled={Math.min(10, targetPct / 10)}
              emoji="🪙"
              label={
                targetPct >= 100
                  ? t("pictoMet", { month: latestMonthLabel })
                  : t("pictoPart", { n: num(Math.round(targetPct / 10)), month: latestMonthLabel })
              }
            />
          </Card>
          {/* The dial stops at 100, so it only shows when the target was not passed. */}
          {targetPct <= 100 && (
            <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gauge value={targetPct} label={t("gaugeLabel")} caption={t("gaugeCaption", { month: latestMonthLabel })} />
            </Card>
          )}
        </div>
      )}

      {/* Sanctioned vs. filled staffing widget (renders nothing without data). */}
      {!isLoading && (
        <StaffingWidget module="police" roleLabel={t("staffRole")} district={district} state={state} accentColor="var(--hue)" />
      )}

      {!isLoading && hasAnyData && (
        <>
          {/* Station directory */}
          {stations.length > 0 && (
            <Section title={t("stationsTitle")} emoji="🚓">
              <div style={{ marginBottom: 12 }}>
                <CountChips items={directoryChips} ariaLabel={t("chipsAria")} />
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
                  gap: 12,
                }}
              >
                {stations.map((s) => (
                  <Card as="li" key={s.id} padding={14}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 16, borderRadius: 10 }}>
                        🚓
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{s.name}</h3>
                        {s.nameLocal && s.nameLocal !== s.name && (
                          <p lang={scriptLang(s.nameLocal)} style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                            {s.nameLocal}
                          </p>
                        )}
                      </div>
                    </div>
                    {s.sho && <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("sho", { name: s.sho })}</div>}
                    {s.address && (
                      <div className="ftp-body" style={{ display: "flex", gap: 4, color: "var(--ftp-text-2)", marginTop: 4 }}>
                        <MapPin size={12} aria-hidden style={{ flexShrink: 0, marginTop: 4 }} />
                        {s.address}
                      </div>
                    )}
                    {s.phone && (
                      <a
                        href={`tel:${s.phone}`}
                        className="ftp-num"
                        aria-label={t("callStation", { name: s.name, phone: s.phone })}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--hue-deep)", textDecoration: "none" }}
                      >
                        <Phone size={12} aria-hidden /> {s.phone}
                      </a>
                    )}
                  </Card>
                ))}
              </ul>
            </Section>
          )}

          {/* Crime chart — needs at least two categories to compare. */}
          {crimeChart.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("crimeTitle", { year: String(latestYear) })}
                emoji="🚨"
                units={hasTotalRow ? t("crimeUnitsTotal") : t("crimeUnits")}
                simple={
                  topCrime
                    ? t.rich("crimeSimple", { name: topCrime.nameFull, n: topCrime.count, count: num(topCrime.count), b: bold })
                    : null
                }
                legend={[{ label: t("legendCases"), swatch: "var(--hue)" }]}
                source={{ label: "NCRB", href: "https://ncrb.gov.in" }}
                asOf={lastUpdated}
                asOfPeriod={String(latestYear)}
                table={crimeChart.map((r) => ({ label: r.nameFull, value: num(r.count) }))}
              >
                {/* 40 px per category so every label is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(180, crimeChart.length * 40 + 40)}>
                  <BarChart data={crimeChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} />
                    <YAxis type="category" dataKey="name" tick={CHART_AXIS} width={150} interval={0} />
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
            </div>
          )}

          {/* Up or down since the previous year: the same categories in both
              years, a grey bar for then and a coloured bar for now. */}
          {prevYear !== null && trendRows.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("trendTitle", { prev: String(prevYear), latest: String(latestYear) })}
                emoji="📈"
                units={t("trendUnits", { prev: String(prevYear) })}
                simple={t.rich("trendSimple", {
                  up: trendUp,
                  n: trendRows.length,
                  prev: String(prevYear),
                  latest: String(latestYear),
                  b: bold,
                })}
                legend={[
                  { label: String(prevYear), swatch: "#D8D5CB" },
                  { label: String(latestYear), swatch: "var(--hue)" },
                ]}
                source={{ label: "NCRB", href: "https://ncrb.gov.in" }}
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
                      changeText={changeText(r.then, r.now)}
                      direction={r.now > r.then ? "up" : r.now < r.then ? "down" : "same"}
                      max={trendMax}
                    />
                  ))}
                </ul>
              </ChartCard>
            </div>
          )}

          {/* Traffic revenue chart — needs at least two months. */}
          {trafficChart.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("trafficTitle")}
                emoji="🧾"
                units={t("trafficUnits")}
                simple={
                  topTrafficMonth
                    ? t.rich("trafficSimple", { month: topTrafficMonth.label, amount: num(topTrafficMonth.amount), b: bold })
                    : null
                }
                legend={[{ label: t("legendCollected"), swatch: "var(--hue)" }]}
                source={trafficSource ? { label: trafficSource } : undefined}
                asOf={latestTrafficDate}
                table={trafficChart.map((r) => ({ label: r.label, value: t("thousandRupees", { amount: num(r.amount) }) }))}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trafficChart} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-30} textAnchor="end" />
                    <YAxis tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v) => [t("thousandRupees", { amount: num(Number(v)) }), t("legendCollected")]}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="amount" name={t("legendCollected")} fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Crime stats table */}
          {crime.length > 0 && (
            <Section title={t("tableTitle")} emoji="📋">
              <DataTable
                caption={t("tableCaption")}
                columns={[
                  { key: "year", label: t("colYear"), mono: true, align: "left" },
                  { key: "cat", label: t("colCategory") },
                  { key: "count", label: t("colCount"), numeric: true },
                ]}
                rows={crime.map((c) => ({ year: c.year, cat: c.category, count: num(c.count) }))}
              />
            </Section>
          )}
        </>
      )}

      <ModulePageFooter
        moduleSlug="police"
        locale={locale}
        state={state}
        district={district}
        sourceUrls={{ "NCRB (National Crime Records Bureau)": "https://ncrb.gov.in", "data.gov.in": "https://data.gov.in" }}
      >
        <ModuleNews district={district} state={state} locale={locale} module="police" />
      </ModulePageFooter>
    </div>
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

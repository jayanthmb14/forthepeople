/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Weather & rain — "What is the weather now, and are we getting enough
//  rain this year?"  (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The answer: "Right now it is 27°C with some clouds. Rain this year so
//  far: 84% of normal (Jan–Aug 2026)."
//
//  Order: PageHeader → Explainer → TODAY's weather picture first (big
//  weather emoji, temperature, sky, plus four tiles: feels like, humidity,
//  wind, rain) → rain this year vs normal (a drop per month — tap one for
//  that month — and a ring) → charts (monthly rain vs normal, difference
//  from normal, temperature) → recent readings (tap one for every detail)
//  → AI insight → news → sources (CSV of the rain history).
//
//  Honesty rules on this page:
//   • "Right now" only when the newest reading is under 6 hours old;
//     otherwise "Last recorded" with its date. The header pill is fed by
//     that reading's time and says "Live" only under 30 minutes.
//   • Live readings come from OpenWeatherMap with metric units: wind is
//     metres per second there, so it is shown ×3.6 as km/h, and rain is
//     the last hour's rain, so it is labelled that way. Readings from
//     other sources are shown as stored.
//   • Rain this year adds up only the months the source has published for
//     the latest year, and names them. Charts need at least two months;
//     the temperature line needs three different readings. A missing
//     figure shows "—", never a zero.
//
//  Every word is in page_weather (en / kn / hi). Month and day names come
//  from Intl in the reader's language. Condition words from the feed are
//  shown as published in English; other languages get the matching plain
//  word (cond.*) when one is known. The CSV keeps English column names.
"use client";

import { use, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Cloud } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { useWeather, useRainfall } from "@/hooks/useRealtimeData";
import type { RainfallHistory, WeatherReading } from "@/hooks/useRealtimeData";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { AsOfText, Card, LoadingShell, ModulePage, PageHeader, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, weatherEmoji, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { ProgressRing } from "@/components/district/daily-services/HueCharts";
import { PageEnd, SheetNote, SheetSmall, useNow } from "@/components/services-2/kit";
import { downloadCSV, todayISO } from "@/lib/csv";

/** A reading counts as "now" only when it is at most this old. */
const FRESH_HOURS = 6;
/** Rows in the readings list older than this are greyed. */
const STALE_ROW_MINUTES = 24 * 60;
/** How many distinct readings the temperature line draws (newest). */
const TREND_POINTS = 24;
/** How many readings the list shows. */
const LIST_POINTS = 12;

// English month names for the CSV file only (spreadsheets read it).
const MONTHS_LONG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const SOURCE_LINKS: Record<string, string> = {
  openweathermap: "https://openweathermap.org",
  imd: "https://mausam.imd.gov.in",
};
const IMD = { label: "IMD", href: SOURCE_LINKS.imd };

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** A source name → { label, href } when we know its website. */
function sourceOf(name: string | null | undefined): { label: string; href?: string } | undefined {
  if (!name) return undefined;
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  const href = SOURCE_LINKS[key] ?? (key.startsWith("imd") ? SOURCE_LINKS.imd : undefined);
  return { label: name, href };
}

/** OpenWeatherMap readings (metric units): wind in m/s, rain = last hour. */
const isOWM = (source: string | null | undefined) => /openweather/i.test(source ?? "");

/** Wind in km/h: OpenWeatherMap sends m/s; other sources are stored as km/h. */
function windKmh(r: WeatherReading): number | null {
  if (r.windSpeed === null || r.windSpeed === undefined) return null;
  return isOWM(r.source) ? r.windSpeed * 3.6 : r.windSpeed;
}

/** Condition text from the feed → one of the cond.* message keys, or null. */
function conditionKey(conditions?: string | null): string | null {
  const c = (conditions ?? "").toLowerCase();
  if (!c) return null;
  if (/thunder|storm/.test(c)) return "storm";
  if (/drizzle/.test(c)) return "drizzle";
  if (/rain|shower/.test(c)) return "rain";
  if (/snow/.test(c)) return "snow";
  if (/mist|fog/.test(c)) return "fog";
  if (/haze|smoke|dust/.test(c)) return "haze";
  if (/overcast|broken/.test(c)) return "overcast";
  if (/scattered|few|partly/.test(c)) return "partlyCloudy";
  if (/cloud/.test(c)) return "cloudy";
  if (/clear|sun/.test(c)) return "clear";
  return null;
}

/** The hour of the day in India time for a timestamp (for a night-time sky). */
function hourIST(iso: string): number {
  const d = new Date(new Date(iso).getTime() + 330 * 60_000);
  return d.getUTCHours();
}

/**
 * The feed is polled every few minutes but the observation changes less
 * often, so consecutive rows often repeat. Keep only the newest row of
 * each run of identical readings (input is newest first).
 */
function distinctReadings<T extends { temperature?: number | null; humidity?: number | null; conditions?: string | null; rainfall?: number | null }>(rows: T[]): T[] {
  const out: T[] = [];
  let prevKey: string | null = null;
  for (const r of rows) {
    const key = `${r.temperature}|${r.humidity}|${r.conditions}|${r.rainfall}`;
    if (key !== prevKey) out.push(r);
    prevKey = key;
  }
  return out;
}

type Opened = { kind: "reading"; id: string } | { kind: "month"; year: number; month: number } | null;

function WeatherPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_weather");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const now = useNow();
  const { data: weatherData, isLoading: wLoading } = useWeather(district, state);
  const { data: rainfallData, isLoading: rLoading } = useRainfall(district, state);
  const [opened, setOpened] = useState<Opened>(null);

  // ── Formatters (all in the reader's language) ──
  const num = (v: number, digits = 1) => f.number(v, { maximumFractionDigits: digits });
  const orDash = (v: number | null | undefined, digits = 1) => (v === null || v === undefined ? "—" : num(v, digits));
  const deg = (v: number) => `${num(v)}°C`;
  const mm = (v: number) => t("mm", { v: f.number(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
  const signedMm = (v: number) => t("mm", { v: f.number(v, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }) });
  const pct = (share: number) => f.number(share, { style: "percent", maximumFractionDigits: 0 });
  /** "12 Sep, 02:30 pm" in IST. */
  const when = (iso: string) => f.date(iso, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  /** A month of a year, e.g. { month: "short", year: "2-digit" } → "Jan 25". */
  const monthOf = (year: number, month: number, opts: Intl.DateTimeFormatOptions) => f.date(Date.UTC(year, month - 1, 15), opts);
  /** The feed's condition words, or the plain word in the reader's language. */
  const condText = (c?: string | null): string | null => {
    if (!c) return null;
    if (f.locale === "en") return c;
    const key = conditionKey(c);
    return key ? t(`cond.${key}`) : c;
  };

  const readings = useMemo(() => weatherData?.data ?? [], [weatherData]);
  const latest = readings[0];
  const ageMin = latest && now > 0 ? (now - new Date(latest.recordedAt).getTime()) / 60_000 : null;
  const isRecent = ageMin !== null && ageMin <= FRESH_HOURS * 60;

  // Rainfall rows, newest month first (the API sorts months ascending inside each year).
  const rainfallRows = useMemo(() => [...(rainfallData?.data ?? [])].sort((a, b) => b.year - a.year || b.month - a.month), [rainfallData]);
  const latestRain = rainfallRows[0];

  // Monthly rainfall chart data: the last 24 months, oldest → newest.
  const chartData = rainfallRows
    .slice(0, 24)
    .map((r) => ({
      label: monthOf(r.year, r.month, { month: "short", year: "2-digit" }),
      longLabel: monthOf(r.year, r.month, { month: "long", year: "numeric" }),
      actual: r.rainfall,
      normal: r.normal,
      departure: r.departure,
    }))
    .reverse();
  const belowNormal = chartData.filter((d) => d.actual < d.normal).length;
  const wettest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure > a.departure ? b : a)) : null;
  const driest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure < a.departure ? b : a)) : null;
  const latestMonthLabel = latestRain ? monthOf(latestRain.year, latestRain.month, { month: "long", year: "numeric" }) : undefined;

  // Rain this year so far: the months published for the latest year.
  const yearRows = latestRain ? rainfallRows.filter((r) => r.year === latestRain.year).sort((a, b) => a.month - b.month) : [];
  const yearActual = yearRows.reduce((s, r) => s + r.rainfall, 0);
  const yearNormal = yearRows.reduce((s, r) => s + r.normal, 0);
  const showYear = yearRows.length > 0 && yearNormal > 0;
  const yearShare = showYear ? yearActual / yearNormal : 0;
  const yearPeriod =
    !latestRain || yearRows.length === 0
      ? ""
      : yearRows.length === 1
        ? monthOf(latestRain.year, yearRows[0].month, { month: "long", year: "numeric" })
        : t("rain.periodRange", {
            from: monthOf(latestRain.year, yearRows[0].month, { month: "short" }),
            to: monthOf(latestRain.year, yearRows[yearRows.length - 1].month, { month: "short" }),
            year: String(latestRain.year),
          });
  const monthsAtNormal = yearRows.filter((r) => r.rainfall >= r.normal).length;

  // The temperature line: newest distinct readings that carry a temperature.
  const trend = useMemo(() => distinctReadings(readings).filter((r) => r.temperature !== null && r.temperature !== undefined).slice(0, TREND_POINTS).reverse(), [readings]);
  const trendData = trend.map((r) => ({ label: f.time(r.recordedAt, { hour: "numeric", minute: "2-digit" }), full: when(r.recordedAt), temp: r.temperature as number }));
  const coolest = trendData.length > 0 ? trendData.reduce((a, b) => (b.temp < a.temp ? b : a)) : null;
  const warmest = trendData.length > 0 ? trendData.reduce((a, b) => (b.temp > a.temp ? b : a)) : null;
  const listRows = distinctReadings(readings).slice(0, LIST_POINTS);

  function handleDownload() {
    downloadCSV(
      rainfallRows.slice(0, 60).map((r) => ({
        Month: MONTHS_LONG_EN[r.month - 1],
        Year: r.year,
        "Actual Rainfall (mm)": r.rainfall,
        "Normal Rainfall (mm)": r.normal,
        "Departure (mm)": r.departure,
        Source: r.source,
      })),
      `forthepeople_${district}_rainfall_${todayISO()}.csv`,
    );
  }

  const hasTemp = latest?.temperature !== null && latest?.temperature !== undefined;
  const hasHumidity = latest?.humidity !== null && latest?.humidity !== undefined;
  const hasFeels = latest?.feelsLike !== null && latest?.feelsLike !== undefined;
  const latestCond = condText(latest?.conditions);
  const latestWind = latest ? windKmh(latest) : null;
  const rainLabel = (r: WeatherReading) => (isOWM(r.source) ? t("tiles.rainHour") : t("tiles.rain"));

  // "In simple words": the newest reading, then rain this year.
  const explainKey = latest ? `${isRecent ? "now" : "then"}${hasTemp && latestCond ? "TempCond" : hasTemp ? "Temp" : "Cond"}` : null;

  const shareText =
    latest && hasTemp
      ? latestCond && hasHumidity
        ? t("share", { district: districtName, temp: deg(latest.temperature as number), cond: latestCond, humidity: `${num(latest.humidity as number, 0)}%` })
        : t("shareTemp", { district: districtName, temp: deg(latest.temperature as number) })
      : t("shareEmpty", { district: districtName });

  // What the sheet shows.
  const openReading = opened?.kind === "reading" ? readings.find((r) => r.id === opened.id) ?? null : null;
  const openMonth: RainfallHistory | null = opened?.kind === "month" ? rainfallRows.find((r) => r.year === opened.year && r.month === opened.month) ?? null : null;
  const monthLong = (r: RainfallHistory) => monthOf(r.year, r.month, { month: "long", year: "numeric" });

  return (
    <ModulePage>
      <PageHeader
        icon={Cloud}
        title={mt.label("weather")}
        description={t("description")}
        backHref={base}
        source={sourceOf(latest?.source) ?? IMD}
        freshness={latest ? { asOf: latest.recordedAt, thresholdHours: FRESH_HOURS } : undefined}
      />

      {(wLoading || rLoading) && !latest && rainfallRows.length === 0 && <LoadingShell rows={4} />}
      {!wLoading && !rLoading && !latest && rainfallRows.length === 0 && <NoDataCard module="weather" district={district} state={state} />}

      {/* 2. The answer in one sentence. */}
      {(latest || showYear) && (
        <Explainer emoji="🌤️">
          <span suppressHydrationWarning>
            {latest && explainKey && (
              <>
                {t.rich(`explain.${explainKey}`, { temp: hasTemp ? deg(latest.temperature as number) : "", cond: latestCond ?? "", when: when(latest.recordedAt), b: bold })}
                {hasFeels ? <> {t.rich(isRecent ? "explain.feelsNow" : "explain.feelsThen", { feels: deg(latest.feelsLike as number), b: bold })}</> : null}{" "}
              </>
            )}
            {showYear && t.rich("rainShort", { pct: pct(yearShare), period: yearPeriod, b: bold })}
          </span>
        </Explainer>
      )}

      {/* 3 + 4. Today's weather picture first, with its four tiles. */}
      {latest && (
        <Card tinted padding={20}>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", minWidth: 0 }}>
              <span className="ftp-emoji ftp-pop" role="img" aria-label={latestCond ?? t("glyphAria")} style={{ fontSize: 88, lineHeight: 1 }}>
                {weatherEmoji(latest.conditions, hourIST(latest.recordedAt))}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="ftp-label" style={{ margin: 0, color: "var(--hue-deep)" }} suppressHydrationWarning>
                  {isRecent ? t("hero.now") : t("hero.last")}
                </p>
                <div className="ftp-bignum" style={{ fontSize: 56, lineHeight: 1.05, color: "var(--hue-deep)" }}>
                  {hasTemp ? deg(latest.temperature as number) : "—"}
                </div>
                {latestCond && (
                  <div style={{ fontSize: 17, lineHeight: "24px", color: "var(--ftp-text)", marginTop: 2, textTransform: f.locale === "en" ? "capitalize" : undefined }}>
                    {latestCond}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <AsOfText asOf={latest.recordedAt} prefix="Recorded" />
                </div>
              </div>
            </div>
            <StatStrip cols={2}>
              <StatTile emoji="🌡️" label={t("tiles.feels")} value={orDash(latest.feelsLike)} unit="°C" />
              <StatTile emoji="💧" label={t("tiles.humidity")} value={orDash(latest.humidity, 0)} unit="%" />
              <StatTile emoji="🌬️" label={t("tiles.wind")} value={orDash(latestWind, 0)} unit={t("kmh")} sub={latest.windDir ?? undefined} />
              <StatTile emoji="🌧️" label={rainLabel(latest)} value={orDash(latest.rainfall)} unit={t("mmUnit")} />
            </StatStrip>
          </div>
        </Card>
      )}

      {/* Rain this year vs normal: a drop per month (tap one) and a ring. */}
      {!rLoading && showYear && latestRain && (
        <Section title={t("rain.title")} emoji="☔">
          <div className="ftp-picture-row">
            <Card tinted padding={18}>
              <p className="ftp-body" style={{ margin: "0 0 12px", fontSize: 15, lineHeight: "23px" }}>
                {t.rich("rain.yearExplain", { period: yearPeriod, actual: mm(yearActual), normal: mm(yearNormal), pct: pct(yearShare), district: districtName, b: bold })}
              </p>
              <figure style={{ margin: 0 }}>
                <ul
                  aria-label={t("rain.monthsAria", { n: monthsAtNormal, total: yearRows.length })}
                  style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 6, maxWidth: 640 }}
                >
                  {yearRows.map((r, i) => {
                    const wet = r.rainfall >= r.normal;
                    return (
                      <li key={r.month}>
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          onClick={() => setOpened({ kind: "month", year: r.year, month: r.month })}
                          aria-label={t("rain.monthAria", { month: monthLong(r), actual: mm(r.rainfall), pct: r.normal > 0 ? pct(r.rainfall / r.normal) : "—" })}
                          className="ftp-pop"
                          style={{
                            width: "100%",
                            minHeight: 64,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            padding: "6px 0",
                            borderRadius: 12,
                            border: "1px solid transparent",
                            background: wet ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                            cursor: "pointer",
                            font: "inherit",
                            ["--i" as string]: i,
                          }}
                        >
                          <span className="ftp-emoji" aria-hidden style={{ fontSize: 18, filter: wet ? "none" : "grayscale(1)", opacity: wet ? 1 : 0.4 }}>
                            💧
                          </span>
                          <span aria-hidden style={{ fontSize: 12, lineHeight: "14px", fontWeight: 600, color: wet ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
                            {monthOf(r.year, r.month, { month: "short" })}
                          </span>
                          <span aria-hidden className="ftp-num" style={{ fontSize: 11, lineHeight: "14px", color: "var(--ftp-text-2)" }}>
                            {r.normal > 0 ? pct(r.rainfall / r.normal) : "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("rain.months")}</figcaption>
              </figure>
            </Card>
            <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ProgressRing pct={yearShare * 100} size={150} label={t("rain.ringAria", { pct: pct(yearShare), period: yearPeriod })}>
                <span className="ftp-bignum" style={{ fontSize: 30, color: "var(--hue-deep)" }}>
                  {pct(yearShare)}
                </span>
              </ProgressRing>
              <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", textAlign: "center" }}>{t("rain.ringCaption", { period: yearPeriod })}</span>
            </Card>
          </div>
        </Section>
      )}

      {/* Charts, each with a one-line takeaway. */}
      {(chartData.length > 1 || (trendData.length >= 3 && coolest && warmest)) && (
        <Section title={t("charts.title")} emoji="📊">
          <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
            {chartData.length > 1 && (
              <ChartCard
                title={t("monthly.title")}
                emoji="🌧️"
                units={t("monthly.units")}
                simple={
                  <>
                    {t.rich("monthly.simple", { below: f.number(belowNormal), total: f.number(chartData.length), b: bold })}
                    {latestRain && latestMonthLabel ? (
                      <> {t.rich("monthly.simpleLatest", { month: latestMonthLabel, actual: mm(latestRain.rainfall), normal: mm(latestRain.normal), b: bold })}</>
                    ) : null}
                  </>
                }
                legend={[
                  { label: t("monthly.actual"), swatch: "var(--hue)" },
                  { label: t("monthly.normal"), swatch: "var(--ftp-border-strong)" },
                ]}
                source={sourceOf(latestRain?.source) ?? IMD}
                asOfPeriod={latestMonthLabel}
                table={chartData.map((d) => ({ label: d.longLabel, value: t("monthly.tableRow", { actual: mm(d.actual), normal: mm(d.normal) }) }))}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-45} textAnchor="end" interval={1} height={44} />
                    <YAxis tick={CHART_AXIS} width={40} tickFormatter={(v) => num(Number(v), 0)} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v, name) => [mm(Number(v)), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.longLabel ?? ""}
                    />
                    <Bar dataKey="actual" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("monthly.actual")} />
                    <Bar dataKey="normal" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} name={t("monthly.normal")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {chartData.length > 1 && (
              <ChartCard
                title={t("departure.title")}
                emoji="⚖️"
                units={t("departure.units")}
                simple={
                  wettest && driest
                    ? t.rich("departure.simple", { wet: wettest.longLabel, wetBy: signedMm(wettest.departure), dry: driest.longLabel, dryBy: signedMm(driest.departure), b: bold })
                    : undefined
                }
                legend={[
                  { label: t("departure.more"), swatch: "var(--hue)" },
                  { label: t("departure.less"), swatch: "var(--hue-pop)" },
                ]}
                source={sourceOf(latestRain?.source) ?? IMD}
                asOfPeriod={latestMonthLabel}
                table={chartData.map((d) => ({ label: d.longLabel, value: signedMm(d.departure) }))}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-45} textAnchor="end" interval={1} height={44} />
                    <YAxis tick={CHART_AXIS} width={40} tickFormatter={(v) => num(Number(v), 0)} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v) => [signedMm(Number(v)), t("departure.series")]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.longLabel ?? ""}
                    />
                    <ReferenceLine y={0} stroke="var(--ftp-text-2)" />
                    <Bar dataKey="departure" radius={6} name={t("departure.series")}>
                      {chartData.map((d) => (
                        <Cell key={d.label} fill={d.departure >= 0 ? "var(--hue)" : "var(--hue-pop)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {latest && trendData.length >= 3 && coolest && warmest && (
              <ChartCard
                title={t("trend.title")}
                emoji="🌡️"
                units={t("trend.units")}
                simple={t.rich("trend.simple", { min: deg(coolest.temp), minAt: coolest.full, max: deg(warmest.temp), maxAt: warmest.full, b: bold })}
                asOf={latest.recordedAt}
                source={sourceOf(latest.source)}
                table={trendData.map((d) => ({ label: d.full, value: deg(d.temp) }))}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={CHART_AXIS} width={40} domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]} tickFormatter={(v) => num(Number(v), 0)} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ stroke: "var(--hue-pop)" }}
                      formatter={(v) => [deg(Number(v)), t("trend.series")]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                    />
                    <Area type="monotone" dataKey="temp" name={t("trend.series")} stroke="var(--hue)" strokeWidth={2.5} fill="url(#ftpHueArea)" dot={{ r: 2.5, fill: "var(--hue)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </Section>
      )}

      {/* Recent readings: tap one for every detail. Rows older than a day are greyed. */}
      {!wLoading && listRows.length > 1 && (
        <Section title={t("readings.title")} emoji="🕒">
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "-6px 0 12px" }}>
            {t("readings.hint")}
          </p>
          <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8, ["--ftp-grid-min" as string]: "300px" }}>
            {listRows.map((r) => {
              const stale = now > 0 && now - new Date(r.recordedAt).getTime() > STALE_ROW_MINUTES * 60_000;
              const temp = r.temperature !== null && r.temperature !== undefined ? deg(r.temperature) : "—";
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setOpened({ kind: "reading", id: r.id })}
                    className="ftp-card-link"
                    style={{
                      width: "100%",
                      minHeight: 48,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      padding: "8px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--ftp-border)",
                      background: "var(--ftp-surface)",
                      color: stale ? "var(--ftp-text-2)" : "var(--ftp-text)",
                      cursor: "pointer",
                      font: "inherit",
                      textAlign: "start",
                    }}
                  >
                    <span suppressHydrationWarning style={{ fontSize: 13, minWidth: 104, flex: "1 1 104px" }}>
                      {when(r.recordedAt)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      <span className="ftp-emoji" aria-hidden>
                        {weatherEmoji(r.conditions, hourIST(r.recordedAt))}
                      </span>
                      <span className="ftp-num">{temp}</span>
                    </span>
                    <span className="ftp-num" style={{ fontSize: 13 }}>
                      <span aria-hidden>💧 </span>
                      {r.humidity !== null && r.humidity !== undefined ? `${num(r.humidity, 0)}%` : "—"}
                    </span>
                    <span className="ftp-num" style={{ fontSize: 13 }}>
                      <span aria-hidden>🌧️ </span>
                      {r.rainfall !== null && r.rainfall !== undefined ? mm(r.rainfall) : "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {latest && (
        <div style={{ marginTop: 20 }}>
          <AIInsightCard module="weather" district={district} />
        </div>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="weather" />
      <PageEnd
        ns="page_weather"
        sourceModule="weather"
        moduleSlug="weather"
        state={state}
        district={district}
        locale={locale}
        districtName={districtName}
        about={t("summary", { district: districtName })}
        shareText={shareText}
        onCsv={rainfallRows.length > 0 ? handleDownload : undefined}
      />

      {/* One reading, or one month of rain. */}
      <DetailSheet
        open={!!openReading || !!openMonth}
        onClose={() => setOpened(null)}
        title={openReading ? t("sheet.readingTitle", { when: when(openReading.recordedAt) }) : openMonth ? monthLong(openMonth) : ""}
        subtitle={openMonth ? t("sheet.monthSub", { district: districtName }) : openReading ? condText(openReading.conditions) ?? undefined : undefined}
        emoji={openReading ? weatherEmoji(openReading.conditions, hourIST(openReading.recordedAt)) : "💧"}
      >
        {openReading && (
          <>
            <DetailList
              rows={[
                { emoji: "🌡️", label: t("sheet.temp"), value: openReading.temperature !== null && openReading.temperature !== undefined ? deg(openReading.temperature) : null },
                { emoji: "🤒", label: t("tiles.feels"), value: openReading.feelsLike !== null && openReading.feelsLike !== undefined ? deg(openReading.feelsLike) : null },
                { emoji: "☁️", label: t("sheet.sky"), value: condText(openReading.conditions) },
                { emoji: "💧", label: t("tiles.humidity"), value: openReading.humidity !== null && openReading.humidity !== undefined ? `${num(openReading.humidity, 0)}%` : null },
                {
                  emoji: "🌬️",
                  label: t("tiles.wind"),
                  value: windKmh(openReading) !== null ? `${num(windKmh(openReading) as number, 0)} ${t("kmh")}${openReading.windDir ? ` · ${openReading.windDir}` : ""}` : null,
                },
                { emoji: "🌧️", label: rainLabel(openReading), value: openReading.rainfall !== null && openReading.rainfall !== undefined ? mm(openReading.rainfall) : null },
                { emoji: "🧭", label: t("sheet.pressure"), value: openReading.pressure !== null && openReading.pressure !== undefined ? t("hpa", { v: num(openReading.pressure, 0) }) : null },
                { emoji: "👀", label: t("sheet.visibility"), value: openReading.visibility !== null && openReading.visibility !== undefined ? t("km", { v: num(openReading.visibility) }) : null },
                { emoji: "📡", label: t("sheet.source"), value: openReading.source },
              ]}
            />
            <SheetSmall>{t("sheet.ist")}</SheetSmall>
          </>
        )}
        {openMonth && (
          <>
            <SheetNote emoji={openMonth.rainfall >= openMonth.normal ? "☔" : "🌤️"}>
              {openMonth.normal > 0
                ? t.rich("sheet.monthNote", { month: monthLong(openMonth), actual: mm(openMonth.rainfall), normal: mm(openMonth.normal), pct: pct(openMonth.rainfall / openMonth.normal), b: bold })
                : t.rich("sheet.monthNoteDry", { month: monthLong(openMonth), actual: mm(openMonth.rainfall), b: bold })}
            </SheetNote>
            {/* Two bars on one scale: what fell, and the normal. */}
            {(() => {
              const max = Math.max(openMonth.rainfall, openMonth.normal, 0.1);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { key: "actual", label: t("monthly.actual"), v: openMonth.rainfall, bg: "linear-gradient(90deg, var(--hue-pop), var(--hue))" },
                    { key: "normal", label: t("monthly.normal"), v: openMonth.normal, bg: "var(--ftp-border-strong)" },
                  ].map((b, i) => (
                    <div key={b.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{b.label}</span>
                        <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                          {mm(b.v)}
                        </span>
                      </div>
                      <div aria-hidden style={{ height: 12, borderRadius: 999, background: "var(--ftp-surface-2)", overflow: "hidden" }}>
                        <div className="ftp-grow-x" style={{ width: `${Math.max(2, (b.v / max) * 100)}%`, height: "100%", borderRadius: 999, background: b.bg, ["--i" as string]: i }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <DetailList
              rows={[
                { emoji: "🌧️", label: t("sheet.actual"), value: mm(openMonth.rainfall) },
                { emoji: "📏", label: t("sheet.normal"), value: mm(openMonth.normal) },
                { emoji: "⚖️", label: t("sheet.diff"), value: signedMm(openMonth.departure) },
                { emoji: "📡", label: t("sheet.source"), value: openMonth.source },
              ]}
            />
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function WeatherPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("weather")}>
      <WeatherPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Weather & Rainfall — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useWeather() → up to 48 readings, newest first (recordedAt).
//        useRainfall() → monthly actual vs normal rainfall.
//
//  Honesty rules on this page:
//   • The header pill is fed by the newest reading's recordedAt. It is
//     green only when that reading is at most 6 hours old, and it says
//     "Live" only under 30 minutes (FreshnessPill handles both). Nothing
//     on this page hard-codes "Live".
//   • In the "Recent readings" table, rows older than 24 hours are greyed
//     and their time column reads "As of <date>".
//   • The picture (weather emoji + "In simple words" + humidity dial) uses
//     the same newest reading as the tiles, and says "last recorded" with
//     the date when that reading is older than 6 hours.
//   • The temperature line needs at least three different readings; the
//     rainfall charts need at least two months. A missing figure shows
//     "—", never a zero.
//   • "Rain this year so far" adds up only the months the source has
//     published for the latest year, and names those months.
//
//  Text: every word comes from the "page_weather" messages. Month and day
//  names come from Intl in the reader's language. Condition words from
//  the feed ("scattered clouds") are shown as published in English; other
//  languages get the matching plain word (cond.*) when one is known. The
//  CSV download keeps English column names so spreadsheets read it.
"use client";

import { use, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Cloud } from "lucide-react";
import { useWeather, useRainfall } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  DataTable,
  LoadingShell,
  FreshnessPill,
  AsOfText,
} from "@/components/district/ui";
import {
  ChartCard,
  ChartGradients,
  Explainer,
  Gauge,
  weatherEmoji,
  CHART_AXIS,
  chartTooltipStyle,
} from "@/components/district/visuals";
import { isWithinMinutes } from "@/lib/utils/timeAgo";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar, mutedIf } from "@/components/district/daily-services/ModuleShell";
import { ProgressRing } from "@/components/district/daily-services/HueCharts";
import { useDistrictName } from "@/components/district/daily-services/useDistrictName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { downloadCSV, todayISO } from "@/lib/csv";

// A reading counts as "current" only when it was recorded in the last 6
// hours (audit 2026-09, finding 3.7). Older readings are labelled
// "Last recorded conditions" with an honest date.
const FRESH_HOURS = 6;
// Rows in the readings table older than this are greyed with "As of".
const STALE_ROW_MINUTES = 24 * 60;
// How many distinct readings the temperature line draws (newest).
const TREND_POINTS = 24;

// English month names for the CSV file only (spreadsheets read it).
const MONTHS_LONG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const IMD = { label: "IMD", href: "https://mausam.imd.gov.in" };

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

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

function WeatherPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_weather");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data: weatherData, isLoading: wLoading } = useWeather(district, state);
  const { data: rainfallData, isLoading: rLoading } = useRainfall(district, state);

  // ── Formatters (all in the reader's language) ──
  const num = (v: number, digits = 1) => f.number(v, { maximumFractionDigits: digits });
  const orDash = (v: number | null | undefined) => (v === null || v === undefined ? "—" : num(v));
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
  const isRecent = isWithinMinutes(latest?.recordedAt ?? null, FRESH_HOURS * 60);

  // Rainfall rows sorted newest month first (the API sorts months
  // ascending inside each year, so we re-sort here for display).
  const rainfallRows = useMemo(
    () => [...(rainfallData?.data ?? [])].sort((a, b) => b.year - a.year || b.month - a.month),
    [rainfallData],
  );
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

  // One-line summaries for the two rainfall charts, from the same rows.
  const belowNormal = chartData.filter((d) => d.actual < d.normal).length;
  const wettest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure > a.departure ? b : a)) : null;
  const driest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure < a.departure ? b : a)) : null;
  const latestMonthLabel = latestRain ? monthOf(latestRain.year, latestRain.month, { month: "long", year: "numeric" }) : undefined;

  // "Rain this year so far": the months published for the latest year.
  const yearRows = latestRain ? rainfallRows.filter((r) => r.year === latestRain.year).sort((a, b) => a.month - b.month) : [];
  const yearActual = yearRows.reduce((s, r) => s + r.rainfall, 0);
  const yearNormal = yearRows.reduce((s, r) => s + r.normal, 0);
  const showYear = yearRows.length > 0 && yearNormal > 0;
  const yearShare = showYear ? yearActual / yearNormal : 0;
  const yearPeriod = !latestRain || yearRows.length === 0
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
  const trend = useMemo(
    () =>
      distinctReadings(readings)
        .filter((r) => r.temperature !== null && r.temperature !== undefined)
        .slice(0, TREND_POINTS)
        .reverse(),
    [readings],
  );
  const trendData = trend.map((r) => ({
    label: f.time(r.recordedAt, { hour: "numeric", minute: "2-digit" }),
    full: when(r.recordedAt),
    temp: r.temperature as number,
  }));
  const coolest = trendData.length > 0 ? trendData.reduce((a, b) => (b.temp < a.temp ? b : a)) : null;
  const warmest = trendData.length > 0 ? trendData.reduce((a, b) => (b.temp > a.temp ? b : a)) : null;

  function handleDownload() {
    const rows = rainfallRows.slice(0, 60).map((r) => ({
      Month: MONTHS_LONG_EN[r.month - 1],
      Year: r.year,
      "Actual Rainfall (mm)": r.rainfall,
      "Normal Rainfall (mm)": r.normal,
      "Departure (mm)": r.departure,
    }));
    downloadCSV(rows, `forthepeople_${district}_rainfall_${todayISO()}.csv`);
  }

  const hasTemp = latest?.temperature !== null && latest?.temperature !== undefined;
  const hasHumidity = latest?.humidity !== null && latest?.humidity !== undefined;
  const hasFeels = latest?.feelsLike !== null && latest?.feelsLike !== undefined;
  const latestCond = condText(latest?.conditions);

  const shareText = latest && hasTemp
    ? latestCond && hasHumidity
      ? t("share", { district: districtName, temp: deg(latest.temperature as number), cond: latestCond, humidity: `${num(latest.humidity as number, 0)}%` })
      : t("shareTemp", { district: districtName, temp: deg(latest.temperature as number) })
    : t("shareEmpty", { district: districtName });

  // Temperature tile's second line: condition and/or "feels like".
  const tempSub = latest
    ? latestCond && hasFeels
      ? t("tiles.condFeels", { cond: latestCond, feels: deg(latest.feelsLike as number) })
      : hasFeels
        ? t("tiles.feelsLike", { feels: deg(latest.feelsLike as number) })
        : latestCond ?? undefined
    : undefined;

  // "In simple words" sentence for the newest reading.
  const explainKey = latest
    ? `${isRecent ? "now" : "then"}${hasTemp && latestCond ? "TempCond" : hasTemp ? "Temp" : "Cond"}`
    : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Cloud}
        title={mt.label("weather")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("weather")}
        source={IMD}
        actions={<FreshnessPill asOf={latest?.recordedAt} thresholdHours={FRESH_HOURS} />}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>{t("summary", { district: districtName })}</ModuleSummary>

      <AIInsightCard module="weather" district={district} />

      {/* ── Current (or last recorded) conditions ── */}
      {wLoading && <LoadingShell rows={3} />}
      {!wLoading && !latest && <NoDataCard module="weather" district={district} state={state} />}
      {!wLoading && latest && (
        <Section
          title={isRecent ? t("current") : t("lastRecorded")}
          emoji={weatherEmoji(latest.conditions)}
          action={<AsOfText asOf={latest.recordedAt} prefix="Recorded" />}
        >
          <StatStrip cols={4}>
            <StatTile emoji="🌡️" label={t("tiles.temperature")} value={orDash(latest.temperature)} unit="°C" sub={tempSub} asOf={latest.recordedAt} />
            <StatTile emoji="💧" label={t("tiles.humidity")} value={orDash(latest.humidity)} unit="%" asOf={latest.recordedAt} />
            <StatTile emoji="🌬️" label={t("tiles.wind")} value={orDash(latest.windSpeed)} unit={t("kmh")} sub={latest.windDir ?? undefined} asOf={latest.recordedAt} />
            <StatTile emoji="🌧️" label={t("tiles.rain")} value={orDash(latest.rainfall)} unit={t("mmUnit")} asOf={latest.recordedAt} />
          </StatStrip>

          {/* The picture: a big weather emoji for the newest reading, one
              plain sentence with its numbers, and a humidity dial. The
              emoji sits still (no floating loop). */}
          {(hasTemp || latest.conditions) && explainKey && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                  <span
                    className="ftp-emoji ftp-pop"
                    role="img"
                    aria-label={latestCond ?? t("glyphAria")}
                    style={{ fontSize: 64, lineHeight: 1 }}
                  >
                    {weatherEmoji(latest.conditions)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    {hasTemp && (
                      <div className="ftp-bignum" style={{ fontSize: 44, lineHeight: 1, color: "var(--hue-deep)" }}>
                        {deg(latest.temperature as number)}
                      </div>
                    )}
                    {latestCond && (
                      <div style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)", marginTop: 4, textTransform: f.locale === "en" ? "capitalize" : undefined }}>
                        {latestCond}
                      </div>
                    )}
                  </div>
                </div>
                <Explainer emoji="🌤️">
                  <span suppressHydrationWarning>
                    {t.rich(`explain.${explainKey}`, {
                      temp: hasTemp ? deg(latest.temperature as number) : "",
                      cond: latestCond ?? "",
                      when: when(latest.recordedAt),
                      b: bold,
                    })}
                    {hasFeels ? (
                      <> {t.rich(isRecent ? "explain.feelsNow" : "explain.feelsThen", { feels: deg(latest.feelsLike as number), b: bold })}</>
                    ) : null}
                  </span>
                </Explainer>
              </Card>
              {hasHumidity && (
                <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Gauge value={latest.humidity as number} label={t("humidityLabel")} caption={t("humidityCaption")} />
                </Card>
              )}
            </div>
          )}

          {/* How the temperature moved across the recent readings. */}
          {trendData.length >= 3 && coolest && warmest && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("trend.title")}
                emoji="🌡️"
                units={t("trend.units")}
                simple={t.rich("trend.simple", { min: deg(coolest.temp), minAt: coolest.full, max: deg(warmest.temp), maxAt: warmest.full, b: bold })}
                asOf={latest.recordedAt}
                source={latest.source ? { label: latest.source } : undefined}
                table={trendData.map((d) => ({ label: d.full, value: deg(d.temp) }))}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis
                      tick={CHART_AXIS}
                      width={40}
                      domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
                      tickFormatter={(v) => num(Number(v), 0)}
                    />
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
            </div>
          )}
        </Section>
      )}

      {/* ── Recent readings: rows older than 24 h are greyed with "As of" ── */}
      {!wLoading && readings.length > 1 && (
        <Section title={t("readings.title")} emoji="🕒">
          <DataTable
            dense
            caption={t("readings.caption", { district: districtName })}
            columns={[
              { key: "time", label: t("readings.recorded") },
              { key: "temp", label: t("readings.temp"), numeric: true },
              { key: "conditions", label: t("readings.conditions") },
              { key: "humidity", label: t("readings.humidity"), numeric: true },
              { key: "rain", label: t("readings.rain"), numeric: true },
            ]}
            rows={distinctReadings(readings).slice(0, 12).map((r) => {
              const stale = !isWithinMinutes(r.recordedAt, STALE_ROW_MINUTES);
              const muted = mutedIf(stale);
              return {
                // Date AND time on every row: readings arrive every few
                // minutes, so a date alone made rows look like duplicates.
                time: (
                  <span suppressHydrationWarning style={stale ? { ...muted, fontSize: 13 } : undefined}>
                    {when(r.recordedAt)}
                  </span>
                ),
                temp: <span style={muted}>{orDash(r.temperature)}</span>,
                conditions: (
                  <span style={{ ...muted, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {r.conditions && (
                      <span className="ftp-emoji" aria-hidden>
                        {weatherEmoji(r.conditions)}
                      </span>
                    )}
                    {condText(r.conditions) ?? "—"}
                  </span>
                ),
                humidity: <span style={muted}>{orDash(r.humidity)}</span>,
                rain: <span style={muted}>{orDash(r.rainfall)}</span>,
              };
            })}
          />
        </Section>
      )}

      {/* ── Rainfall: this year so far, then the monthly history ── */}
      {rLoading && <LoadingShell rows={3} />}
      {!rLoading && chartData.length > 0 && (
        <>
          <Section title={t("rain.title")} emoji="🌧️">
            {/* The picture: rain this year against normal, as a sentence,
                a drop per month (lit when it got its normal rain) and a ring. */}
            {showYear && latestRain && (
              <div className="ftp-picture-row" style={{ marginBottom: 16 }}>
                <Card tinted padding={18}>
                  <Explainer emoji="☔">
                    {t.rich("rain.yearExplain", {
                      period: yearPeriod,
                      actual: mm(yearActual),
                      normal: mm(yearNormal),
                      pct: pct(yearShare),
                      district: districtName,
                      b: bold,
                    })}
                  </Explainer>
                  <figure style={{ margin: 0 }}>
                    <div
                      role="img"
                      aria-label={t("rain.monthsAria", { n: monthsAtNormal, total: yearRows.length })}
                      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 6, maxWidth: 560 }}
                    >
                      {yearRows.map((r, i) => {
                        const wet = r.rainfall >= r.normal;
                        return (
                          <span
                            key={r.month}
                            aria-hidden
                            className="ftp-pop"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                              padding: "6px 0",
                              borderRadius: 12,
                              background: wet ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                              ["--i" as string]: i,
                            }}
                          >
                            <span className="ftp-emoji" style={{ fontSize: 18, filter: wet ? "none" : "grayscale(1)", opacity: wet ? 1 : 0.4 }}>
                              💧
                            </span>
                            <span style={{ fontSize: 11, lineHeight: "14px", fontWeight: 600, color: wet ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
                              {monthOf(r.year, r.month, { month: "short" })}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                    <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("rain.months")}</figcaption>
                  </figure>
                </Card>
                <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ProgressRing pct={yearShare * 100} size={150} label={t("rain.ringAria", { pct: pct(yearShare), period: yearPeriod })}>
                    <span className="ftp-bignum" style={{ fontSize: 30, color: "var(--hue-deep)" }}>
                      {pct(yearShare)}
                    </span>
                  </ProgressRing>
                  <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", textAlign: "center" }}>
                    {t("rain.ringCaption", { period: yearPeriod })}
                  </span>
                </Card>
              </div>
            )}

            {/* Charts need at least two months; one month is just a number. */}
            {chartData.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ChartCard
                  title={t("monthly.title")}
                  emoji="🌧️"
                  units={t("monthly.units")}
                  simple={
                    <>
                      {t.rich("monthly.simple", { below: f.number(belowNormal), total: f.number(chartData.length), b: bold })}
                      {latestRain && latestMonthLabel ? (
                        <>
                          {" "}
                          {t.rich("monthly.simpleLatest", {
                            month: latestMonthLabel,
                            actual: mm(latestRain.rainfall),
                            normal: mm(latestRain.normal),
                            b: bold,
                          })}
                        </>
                      ) : null}
                    </>
                  }
                  legend={[
                    { label: t("monthly.actual"), swatch: "var(--hue)" },
                    { label: t("monthly.normal"), swatch: "#D8D5CB" },
                  ]}
                  source={IMD}
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

                <ChartCard
                  title={t("departure.title")}
                  emoji="⚖️"
                  units={t("departure.units")}
                  simple={
                    wettest && driest
                      ? t.rich("departure.simple", {
                          wet: wettest.longLabel,
                          wetBy: signedMm(wettest.departure),
                          dry: driest.longLabel,
                          dryBy: signedMm(driest.departure),
                          b: bold,
                        })
                      : undefined
                  }
                  legend={[
                    { label: t("departure.more"), swatch: "var(--hue)" },
                    { label: t("departure.less"), swatch: "var(--hue-pop)" },
                  ]}
                  source={IMD}
                  asOfPeriod={latestMonthLabel}
                  table={chartData.map((d) => ({ label: d.longLabel, value: signedMm(d.departure) }))}
                >
                  <ResponsiveContainer width="100%" height={180}>
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
              </div>
            )}
          </Section>

          <Section title={t("history.title")} emoji="📅">
            <DataTable
              caption={t("history.caption", { district: districtName })}
              columns={[
                { key: "month", label: t("history.month") },
                { key: "year", label: t("history.year"), mono: true },
                { key: "actual", label: t("history.actual"), numeric: true },
                { key: "normal", label: t("history.normal"), numeric: true },
                { key: "dep", label: t("history.departure"), numeric: true },
              ]}
              rows={rainfallRows.slice(0, 30).map((r) => ({
                month: monthOf(r.year, r.month, { month: "short" }),
                year: r.year,
                actual: f.number(r.rainfall, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                normal: f.number(r.normal, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                // Semantic colour as text only: surplus green, deficit red.
                dep: (
                  <span style={{ color: r.departure > 0 ? "var(--ftp-live-text)" : r.departure < 0 ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                    {f.number(r.departure, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" })}
                  </span>
                ),
              }))}
            />
          </Section>
        </>
      )}

      <ModuleSources module="weather" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="weather" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="weather"
        moduleLabel={mt.label("weather")}
        shareText={shareText}
        onCsv={rainfallRows.length > 0 ? handleDownload : undefined}
        csvLabel={t("csv.label")}
      />
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

/**
 * The feed is polled every few minutes but the upstream observation changes
 * less often, so consecutive rows often repeat the same numbers. Keep only
 * the newest row of each run of identical readings (input is newest first).
 */
function distinctReadings<T extends { temperature?: number | null; humidity?: number | null; conditions?: string | null; rainfall?: number | null }>(
  rows: T[],
): T[] {
  const out: T[] = [];
  let prevKey: string | null = null;
  for (const r of rows) {
    const key = `${r.temperature}|${r.humidity}|${r.conditions}|${r.rainfall}`;
    if (key !== prevKey) out.push(r);
    prevKey = key;
  }
  return out;
}

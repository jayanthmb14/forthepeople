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
//   • The picture (WeatherGlyph + "In simple words" + humidity dial) uses
//     the same newest reading as the tiles, and says "last recorded" with
//     the date when that reading is older than 6 hours.
//   • Rainfall charts sit in ChartCards (source, month, table view) and are
//     drawn only when there are at least two months to compare.
"use client";

import { use, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Cloud } from "lucide-react";
import { useWeather, useRainfall } from "@/hooks/useRealtimeData";
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
  WeatherGlyph,
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
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { downloadCSV, todayISO } from "@/lib/csv";

// A reading counts as "current" only when it was recorded in the last 6
// hours (audit 2026-09, finding 3.7). Older readings are labelled
// "Last recorded conditions" with an honest date.
const FRESH_HOURS = 6;
// Rows in the readings table older than this are greyed with "As of".
const STALE_ROW_MINUTES = 24 * 60;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const IMD = { label: "IMD", href: "https://mausam.imd.gov.in" };

/** Show a number or an em dash when the source left it empty. */
function orDash(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : String(v);
}

/** "12 Sep, 02:30 pm" in IST, for the "last recorded" sentence. */
function recordedLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

/** Signed millimetres: "+12.5 mm" / "-8.0 mm". */
function signedMm(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)} mm`;
}

function WeatherPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: weatherData, isLoading: wLoading } = useWeather(district, state);
  const { data: rainfallData, isLoading: rLoading } = useRainfall(district, state);

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
      label: `${MONTHS_SHORT[r.month - 1]} '${String(r.year).slice(2)}`,
      longLabel: `${MONTHS_LONG[r.month - 1]} ${r.year}`,
      actual: r.rainfall,
      normal: r.normal,
      departure: r.departure,
    }))
    .reverse();

  // One-line summaries for the two rainfall charts, from the same rows.
  const belowNormal = chartData.filter((d) => d.actual < d.normal).length;
  const wettest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure > a.departure ? b : a)) : null;
  const driest = chartData.length > 0 ? chartData.reduce((a, b) => (b.departure < a.departure ? b : a)) : null;
  const latestMonthLabel = latestRain ? `${MONTHS_LONG[latestRain.month - 1]} ${latestRain.year}` : undefined;

  function handleDownload() {
    const rows = rainfallRows.slice(0, 60).map((r) => ({
      Month: MONTHS_LONG[r.month - 1],
      Year: r.year,
      "Actual Rainfall (mm)": r.rainfall,
      "Normal Rainfall (mm)": r.normal,
      "Departure (mm)": r.departure,
    }));
    downloadCSV(rows, `forthepeople_${district}_rainfall_${todayISO()}.csv`);
  }

  const shareText = latest
    ? `${district} weather: ${latest.temperature}°C, ${latest.conditions}, humidity ${latest.humidity}%`
    : `Weather data for ${district}`;

  const hasTemp = latest?.temperature !== null && latest?.temperature !== undefined;
  const hasHumidity = latest?.humidity !== null && latest?.humidity !== undefined;

  return (
    <ModulePage>
      <PageHeader
        icon={Cloud}
        title="Weather & Rainfall"
        description="Weather readings and historical monsoon data"
        backHref={base}
        accent={getModuleAccent("weather")}
        source={IMD}
        actions={<FreshnessPill asOf={latest?.recordedAt} thresholdHours={FRESH_HOURS} />}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>
        This page shows weather readings and monthly rainfall history for this district, sourced from India
        Meteorological Department (IMD) and OpenWeatherMap. Temperature is in Celsius, rainfall in millimetres.
        Readings are updated when the source publishes; each one shows the time it was recorded.
      </ModuleSummary>

      <AIInsightCard module="weather" district={district} />

      {/* ── Current (or last recorded) conditions ── */}
      {wLoading && <LoadingShell rows={3} />}
      {!wLoading && !latest && <NoDataCard module="weather" district={district} state={state} />}
      {!wLoading && latest && (
        <Section
          title={isRecent ? "Current conditions" : "Last recorded conditions"}
          emoji={weatherEmoji(latest.conditions)}
          action={<AsOfText asOf={latest.recordedAt} prefix="Recorded" />}
        >
          <StatStrip cols={4}>
            <StatTile
              emoji="🌡️"
              label="Temperature"
              value={orDash(latest.temperature)}
              unit="°C"
              sub={[
                latest.conditions ?? undefined,
                latest.feelsLike !== null && latest.feelsLike !== undefined ? `feels like ${latest.feelsLike}°C` : undefined,
              ].filter(Boolean).join(", ") || undefined}
              asOf={latest.recordedAt}
            />
            <StatTile emoji="💧" label="Humidity" value={orDash(latest.humidity)} unit="%" asOf={latest.recordedAt} />
            <StatTile
              emoji="🌬️"
              label="Wind"
              value={orDash(latest.windSpeed)}
              unit="km/h"
              sub={latest.windDir ?? undefined}
              asOf={latest.recordedAt}
            />
            <StatTile emoji="🌧️" label="Rainfall (day)" value={latest.rainfall ?? 0} unit="mm" asOf={latest.recordedAt} />
          </StatStrip>

          {/* The picture: a big weather glyph for the newest reading, one
              plain sentence with its numbers, and a humidity dial. */}
          {(hasTemp || latest.conditions) && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                  <WeatherGlyph conditions={latest.conditions} size={64} />
                  <div style={{ minWidth: 0 }}>
                    {hasTemp && (
                      <div className="ftp-bignum" style={{ fontSize: 44, lineHeight: 1, color: "var(--hue-deep)" }}>
                        {latest.temperature}°C
                      </div>
                    )}
                    {latest.conditions && (
                      <div style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)", marginTop: 4, textTransform: "capitalize" }}>
                        {latest.conditions}
                      </div>
                    )}
                  </div>
                </div>
                <Explainer title="In simple words" emoji="🌤️">
                  <span suppressHydrationWarning>
                    {isRecent ? "Right now" : `When last recorded, on ${recordedLabel(latest.recordedAt)} IST,`}
                    {hasTemp ? (
                      <>
                        {" "}it {isRecent ? "is" : "was"} <strong>{latest.temperature}°C</strong>
                        {latest.conditions ? ` with ${latest.conditions.toLowerCase()}` : ""}.
                      </>
                    ) : (
                      <> the weather {isRecent ? "shows" : "showed"} {latest.conditions?.toLowerCase()}.</>
                    )}
                    {latest.feelsLike !== null && latest.feelsLike !== undefined ? (
                      <>
                        {" "}It {isRecent ? "feels" : "felt"} like <strong>{latest.feelsLike}°C</strong>.
                      </>
                    ) : null}
                  </span>
                </Explainer>
              </Card>
              {hasHumidity && (
                <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Gauge value={latest.humidity as number} label="Humidity" caption="How damp the air is (humidity)" />
                </Card>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ── Recent readings: rows older than 24 h are greyed with "As of" ── */}
      {!wLoading && readings.length > 1 && (
        <Section title="Recent readings" emoji="🕒">
          <DataTable
            dense
            caption={`Recent weather readings for ${district}`}
            columns={[
              { key: "time", label: "Recorded" },
              { key: "temp", label: "Temp °C", numeric: true },
              { key: "conditions", label: "Conditions" },
              { key: "humidity", label: "Humidity %", numeric: true },
              { key: "rain", label: "Rain mm", numeric: true },
            ]}
            rows={distinctReadings(readings).slice(0, 12).map((r) => {
              const stale = !isWithinMinutes(r.recordedAt, STALE_ROW_MINUTES);
              const muted = mutedIf(stale);
              return {
                // Date AND time on every row: readings arrive every few
                // minutes, so a date alone made rows look like duplicates.
                time: (
                  <span suppressHydrationWarning style={stale ? { ...muted, fontSize: 13 } : undefined}>
                    {new Date(r.recordedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
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
                    {r.conditions ?? "—"}
                  </span>
                ),
                humidity: <span style={muted}>{orDash(r.humidity)}</span>,
                rain: <span style={muted}>{orDash(r.rainfall)}</span>,
              };
            })}
          />
        </Section>
      )}

      {/* ── Rainfall history ── */}
      {rLoading && <LoadingShell rows={3} />}
      {!rLoading && chartData.length > 0 && (
        <>
          {/* Charts need at least two months; one month is just a number. */}
          {chartData.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 28 }}>
              <ChartCard
                title="Monthly rainfall, actual vs normal"
                emoji="🌧️"
                units="Millimetres of rain each month. Grey is the normal for that month, colour is what fell."
                simple={
                  <>
                    Rain was below normal in <strong>{belowNormal}</strong> of the last {chartData.length} months.
                    {latestRain ? (
                      <>
                        {" "}In {latestMonthLabel}, <strong>{latestRain.rainfall.toFixed(1)} mm</strong> fell against a normal of{" "}
                        {latestRain.normal.toFixed(1)} mm.
                      </>
                    ) : null}
                  </>
                }
                legend={[
                  { label: "Actual", swatch: "var(--hue)" },
                  { label: "Normal", swatch: "#D8D5CB" },
                ]}
                source={IMD}
                asOfPeriod={latestMonthLabel}
                table={chartData.map((d) => ({ label: d.longLabel, value: `${d.actual} mm (normal ${d.normal} mm)` }))}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-45} textAnchor="end" interval={1} height={44} />
                    <YAxis tick={CHART_AXIS} width={40} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v, name) => [`${Number(v)} mm`, name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.longLabel ?? ""}
                    />
                    <Bar dataKey="actual" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name="Actual" />
                    <Bar dataKey="normal" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} name="Normal" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Departure from normal"
                emoji="⚖️"
                units="Millimetres above or below the normal for each month"
                simple={
                  wettest && driest ? (
                    <>
                      The wettest month compared with normal was <strong>{wettest.longLabel}</strong> ({signedMm(wettest.departure)}); the
                      driest was <strong>{driest.longLabel}</strong> ({signedMm(driest.departure)}).
                    </>
                  ) : undefined
                }
                legend={[
                  { label: "More rain than normal", swatch: "var(--hue)" },
                  { label: "Less rain than normal", swatch: "var(--hue-pop)" },
                ]}
                source={IMD}
                asOfPeriod={latestMonthLabel}
                table={chartData.map((d) => ({ label: d.longLabel, value: signedMm(d.departure) }))}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="label" tick={CHART_AXIS} angle={-45} textAnchor="end" interval={1} height={44} />
                    <YAxis tick={CHART_AXIS} width={40} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v) => [`${Number(v)} mm`, "Departure"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.longLabel ?? ""}
                    />
                    <ReferenceLine y={0} stroke="var(--ftp-text-2)" />
                    <Bar dataKey="departure" radius={6} name="Departure">
                      {chartData.map((d) => (
                        <Cell key={d.label} fill={d.departure >= 0 ? "var(--hue)" : "var(--hue-pop)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          <Section title="Rainfall history table" emoji="📅">
            <DataTable
              caption={`Monthly rainfall for ${district}`}
              columns={[
                { key: "month", label: "Month" },
                { key: "year", label: "Year", mono: true },
                { key: "actual", label: "Actual (mm)", numeric: true },
                { key: "normal", label: "Normal (mm)", numeric: true },
                { key: "dep", label: "Departure", numeric: true },
              ]}
              rows={rainfallRows.slice(0, 30).map((r) => ({
                month: MONTHS_SHORT[r.month - 1],
                year: r.year,
                actual: r.rainfall.toFixed(1),
                normal: r.normal.toFixed(1),
                // Semantic colour as text only: surplus green, deficit red.
                dep: (
                  <span style={{ color: r.departure > 0 ? "var(--ftp-live-text)" : r.departure < 0 ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                    {r.departure > 0 ? "+" : ""}
                    {r.departure.toFixed(1)}
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
        moduleLabel="Weather"
        shareText={shareText}
        onCsv={rainfallRows.length > 0 ? handleDownload : undefined}
        csvLabel="Download rainfall data as CSV"
      />
    </ModulePage>
  );
}

export default function WeatherPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Weather & Rainfall">
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

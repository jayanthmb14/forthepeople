/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  TodayWeatherTile — the overview's weather card (v5.1)
// ═══════════════════════════════════════════════════════════════════════
//
//  One tappable card that links to the Weather page:
//
//    [picture]  25°  Mostly clear night            Tomorrow [pic] 31° / 21°
//               Now · 10:30 pm IST                 94% chance of rain
//    Open-Meteo.com · fetched 10:05 pm IST                 Full forecast →
//
//  "Now" follows the weather page's rule (chooseCurrent): our stored
//  reading when it is at most 3 hours old, else the forecast service's
//  current value, else nothing current — then the card says how old our
//  last reading is instead of showing it as today's weather. Renders
//  nothing while loading or when there is no weather data at all, so the
//  overview can keep its own fallback line.
//
//  Mount (district-ui owns OverviewClient.tsx):
//    <TodayWeatherTile locale={locale} state={stateSlug} district={districtSlug} />
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useWeather } from "@/hooks/useRealtimeData";
import type { WeatherReading } from "@/hooks/useRealtimeData";
import { useDistrictName } from "@/i18n/client";
import { kindFromText } from "@/lib/weather/codes";
import { FORECAST_SOURCES, chooseCurrent, tomorrowOf, type ForecastDay, type ForecastSourceKey } from "@/lib/weather/forecast";
import { useForecast } from "@/lib/weather/use-forecast";
import { ageInDays, useClientNow } from "@/components/district/page-kit";
import { WeatherArt } from "@/components/weather/WeatherArt";
import { useWeatherText } from "@/components/weather/useWeatherText";
import type { WeatherKind } from "@/lib/weather/codes";

/** What the tile shows as "now" (or null when nothing is current). */
export interface TileNow {
  temp: number;
  kind: WeatherKind;
  night: boolean;
  time: string;
  sourceLabel: string;
}

/** The data the tile draws — also used by previews and tests. */
export interface TodayWeatherTileViewProps {
  href: string;
  district: string;
  now: TileNow | null;
  tomorrow: ForecastDay | null;
  forecastSource: ForecastSourceKey | null;
  fetchedAt: string | null;
  /** Our newest stored reading, when it is too old to be "now". */
  oldReadingAt: string | null;
  nowMs: number;
}

const hourIST = (iso: string) => new Date(new Date(iso).getTime() + 330 * 60_000).getUTCHours();

export function TodayWeatherTileView({ href, district, now, tomorrow, forecastSource, fetchedAt, oldReadingAt, nowMs }: TodayWeatherTileViewProps) {
  const w = useWeatherText();
  const { t } = w;
  if (!now && !tomorrow && !oldReadingAt) return null;
  const sky = now ? w.kindLabel(now.kind, now.night) : null;

  return (
    <div className="ftp-hue-sky" style={{ minWidth: 0 }}>
      <Link
        href={href}
        className="ftp-card-link"
        aria-label={t("tile.aria", { district })}
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          borderRadius: "var(--ftp-radius-card)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          background: "linear-gradient(160deg, var(--ftp-surface) 35%, var(--hue-tint))",
          boxShadow: "var(--ftp-shadow-1)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
          {/* Now */}
          {now ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <WeatherArt kind={now.kind} night={now.night} size={60} title={sky ?? undefined} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span className="ftp-num" style={{ fontSize: 32, lineHeight: "36px", fontWeight: 700, color: "var(--hue-deep)" }}>
                    {w.deg(now.temp)}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: 600 }}>{sky}</span>
                </div>
                <p suppressHydrationWarning style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
                  {t("tile.nowAt", { time: w.time(now.time) })}
                </p>
              </div>
            </div>
          ) : oldReadingAt ? (
            <p suppressHydrationWarning style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: "var(--ftp-text-2)", maxWidth: 360 }}>
              {t("tile.old", { date: w.f.date(oldReadingAt, { day: "numeric", month: "short", year: "numeric" }), n: ageInDays(oldReadingAt, nowMs) })}
            </p>
          ) : null}

          {/* Tomorrow */}
          {tomorrow && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 6px",
                borderRadius: 12,
                background: "color-mix(in srgb, var(--ftp-surface) 75%, transparent)",
                border: "1px solid color-mix(in srgb, var(--hue) 16%, var(--ftp-border))",
              }}
            >
              <WeatherArt kind={tomorrow.kind} size={36} />
              <div>
                <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>{t("forecast.tomorrow")}</div>
                <div className="ftp-num" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, color: "var(--ftp-text)" }}>
                  {w.deg(tomorrow.tMax)} / {w.deg(tomorrow.tMin)}
                </div>
                {tomorrow.rainChance !== null && (
                  <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("forecast.chance", { pct: w.pct(tomorrow.rainChance) })}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <span suppressHydrationWarning style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
            {forecastSource && fetchedAt ? t("tile.source", { source: FORECAST_SOURCES[forecastSource].label, time: w.time(fetchedAt) }) : now ? now.sourceLabel : null}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, fontWeight: 650, color: "var(--hue-deep)" }}>
            {t("tile.link")}
            <ChevronRight size={15} aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
}

/** Pick the tile's "now" from our newest stored reading and the forecast's current value. */
function tileNow(latest: WeatherReading | undefined, live: { time: string; temperature: number; kind: WeatherKind; isDay: boolean | null } | null, liveLabel: string | null, nowMs: number): TileNow | null {
  const choice = chooseCurrent(latest?.recordedAt, live, nowMs);
  if (choice === "live" && live) return { temp: live.temperature, kind: live.kind, night: live.isDay === false, time: live.time, sourceLabel: liveLabel ?? "" };
  if (choice === "stored" && latest && latest.temperature !== null && latest.temperature !== undefined) {
    const h = hourIST(latest.recordedAt);
    return { temp: latest.temperature, kind: kindFromText(latest.conditions), night: h < 6 || h >= 19, time: latest.recordedAt, sourceLabel: latest.source };
  }
  return null;
}

export default function TodayWeatherTile({ locale, state, district }: { locale: string; state: string; district: string }) {
  const nowMs = useClientNow();
  const districtName = useDistrictName(state, district);
  const { data: weather } = useWeather(district, state);
  const { data: forecast } = useForecast(state, district);
  if (!nowMs) return null;

  const latest = weather?.data?.[0];
  const primary = forecast?.primary ?? null;
  const now = tileNow(latest, primary?.current ?? null, primary ? FORECAST_SOURCES[primary.source].label : null, nowMs);
  const tomorrow = primary ? tomorrowOf(primary.days, nowMs) : null;
  const oldReadingAt = !now && latest ? latest.recordedAt : null;

  return (
    <TodayWeatherTileView
      href={`/${locale}/${state}/${district}/weather`}
      district={districtName}
      now={now}
      tomorrow={tomorrow}
      forecastSource={primary?.source ?? null}
      fetchedAt={forecast?.fetchedAt ?? null}
      oldReadingAt={oldReadingAt}
      nowMs={nowMs}
    />
  );
}

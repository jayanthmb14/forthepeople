/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Words and numbers for the forecast pieces, in the reader's language
// (page_weather → forecast.* / now.*). Numbers keep Latin digits and
// Indian grouping (useFormat); day names come from Intl.
"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import type { WeatherKind } from "@/lib/weather/codes";
import { dayOffset, istNoon, rainBand, type ForecastSourceKey, FORECAST_SOURCES } from "@/lib/weather/forecast";

export function useWeatherText() {
  const t = useTranslations("page_weather");
  const f = useFormat();
  const dash = t("forecast.dash");

  /** Whole degrees, "31°". */
  const deg = (v: number | null | undefined) => (v === null || v === undefined ? dash : t("forecast.deg", { v: f.number(Math.round(v)) }));
  /** One decimal, "24.6°C" (a measured value). */
  const degExact = (v: number | null | undefined) => (v === null || v === undefined ? dash : `${f.number(v, { maximumFractionDigits: 1 })}°C`);
  /** 0–100 → "94%". */
  const pct = (v: number | null | undefined) => (v === null || v === undefined ? dash : f.number(v / 100, { style: "percent", maximumFractionDigits: 0 }));
  const mm = (v: number | null | undefined) => (v === null || v === undefined ? dash : t("mm", { v: f.number(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }));
  const kmh = (v: number | null | undefined) => (v === null || v === undefined ? dash : `${f.number(Math.round(v))} ${t("kmh")}`);

  const kindLabel = (kind: WeatherKind, night = false) =>
    night && (kind === "clear" || kind === "mostlyClear" || kind === "partly") ? t(`forecast.kindNight.${kind}`) : t(`forecast.kind.${kind}`);

  /** "Today", "Tomorrow", or the short weekday ("Wed"). */
  const dayName = (date: string, nowMs: number, style: "short" | "long" = "short") => {
    const off = nowMs > 0 ? dayOffset(date, nowMs) : null;
    if (off === 0) return t("forecast.today");
    if (off === 1) return t("forecast.tomorrow");
    return f.date(istNoon(date), { weekday: style });
  };
  /** "28 Sep". */
  const dateShort = (date: string) => f.date(istNoon(date), { day: "numeric", month: "short" });
  /** "Monday, 28 September". */
  const dateLong = (date: string) => f.date(istNoon(date), { weekday: "long", day: "numeric", month: "long" });
  /** "10:30 pm" (IST). */
  const time = (iso: string | null | undefined) => (iso ? f.time(iso, { hour: "numeric", minute: "2-digit" }) : dash);
  /** "27 Sep, 10:30 pm" (IST). */
  const when = (iso: string) => f.date(iso, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  const band = (chance: number | null | undefined) => {
    const b = rainBand(chance);
    return b ? t(`forecast.band.${b}`) : null;
  };

  const uv = (v: number | null | undefined) => {
    if (v === null || v === undefined) return null;
    const level = v < 3 ? "low" : v < 6 ? "moderate" : v < 8 ? "high" : v < 11 ? "veryHigh" : "extreme";
    return t("forecast.uvValue", { v: f.number(Math.round(v)), level: t(`forecast.uvLevel.${level}`) });
  };

  const sourceOf = (key: ForecastSourceKey) => FORECAST_SOURCES[key];

  return { t, f, dash, deg, degExact, pct, mm, kmh, kindLabel, dayName, dateShort, dateLong, time, when, band, uv, sourceOf };
}

export type WeatherText = ReturnType<typeof useWeatherText>;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ForecastStrip — the next 7 days as tappable tiles
// ═══════════════════════════════════════════════════════════════════════
//
//  Each tile: day name ("Today", "Tomorrow", "Wed"), date, the weather
//  picture, high / low, a min–max bar on the week's scale (cool sky → warm
//  amber), and the chance of rain. Tapping a tile opens every detail in
//  the page's DetailSheet. Tiles wrap (3 per row at 320 px, 7 in a row on
//  laptops); nothing scrolls sideways.
"use client";

import { Droplet } from "lucide-react";
import { dayOffset, weekRange, type ForecastDay } from "@/lib/weather/forecast";
import { WeatherArt } from "./WeatherArt";
import { useWeatherText } from "./useWeatherText";
import s from "./weather.module.css";

/** Sets --wx-warm (amber pop) and --wx-cool (sky pop) for the range bars. */
export function WeatherPalette({ children }: { children: React.ReactNode }) {
  return (
    <div className="ftp-hue-amber" style={{ ["--wx-warm" as string]: "var(--hue-pop)" }}>
      <div className="ftp-hue-sky" style={{ ["--wx-cool" as string]: "var(--hue-pop)" }}>
        {children}
      </div>
    </div>
  );
}

export function ForecastStrip({ days, now, onOpen }: { days: ForecastDay[]; now: number; onOpen: (date: string) => void }) {
  const w = useWeatherText();
  const range = weekRange(days);
  return (
    <WeatherPalette>
      <div className={s.stripWrap}>
        <ul className={s.strip} aria-label={w.t("forecast.stripAria", { n: days.length })}>
        {days.map((d, i) => {
          const name = w.dayName(d.date, now);
          const sky = w.kindLabel(d.kind);
          const wet = (d.rainChance ?? 0) >= 50;
          const width = range && d.tMin !== null && d.tMax !== null ? Math.max(6, ((d.tMax - d.tMin) / (range.hi - range.lo)) * 100) : null;
          const left = range && width !== null && d.tMin !== null ? Math.min(100 - width, ((d.tMin - range.lo) / (range.hi - range.lo)) * 100) : null;
          const when = now > 0 && dayOffset(d.date, now) === 1 ? "tomorrow" : undefined;
          return (
            <li key={d.date} className="ftp-rise" style={{ ["--i" as string]: i }}>
              <button
                type="button"
                className={s.day}
                data-when={when}
                aria-haspopup="dialog"
                onClick={() => onOpen(d.date)}
                aria-label={
                  d.rainChance !== null
                    ? w.t("forecast.dayAria", { day: `${name} ${w.dateShort(d.date)}`, sky, max: w.deg(d.tMax), min: w.deg(d.tMin), chance: w.t("forecast.chance", { pct: w.pct(d.rainChance) }) })
                    : w.t("forecast.dayAriaNoChance", { day: `${name} ${w.dateShort(d.date)}`, sky, max: w.deg(d.tMax), min: w.deg(d.tMin) })
                }
              >
                <span className={s.dayHead}>
                  <span className={s.dayName} suppressHydrationWarning>
                    {name}
                  </span>
                  <span className={s.dayDate} suppressHydrationWarning>
                    {w.dateShort(d.date)}
                  </span>
                </span>
                <span className={s.dayArt}>
                  <WeatherArt kind={d.kind} size={46} />
                </span>
                <span className={s.temps}>
                  <span className={s.tMax}>{w.deg(d.tMax)}</span>
                  <span className={s.tMin}>{w.deg(d.tMin)}</span>
                </span>
                {/* Always drawn, so the phone rows keep their columns. */}
                <span className={s.rangeTrack} aria-hidden>
                  {left !== null && width !== null && <span className={s.rangeFill} style={{ left: `${left}%`, width: `${width}%` }} />}
                </span>
                <span className={s.rain} data-wet={String(wet)}>
                  {d.rainChance !== null && (
                    <>
                      <Droplet size={12} aria-hidden fill={wet ? "currentColor" : "none"} />
                      {w.pct(d.rainChance)}
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </WeatherPalette>
  );
}

/** While the forecast loads: two soft cards with a drifting cloud. */
export function ForecastLoading() {
  const w = useWeatherText();
  return (
    <div className={s.loading} role="status" aria-live="polite">
      {[0, 1].map((i) => (
        <div key={i} className={s.loadingCard}>
          <span className={s.loadingCloud}>
            <WeatherArt kind={i === 0 ? "partly" : "cloudy"} size={64} />
          </span>
          {i === 0 && <span>{w.t("forecast.loading")}</span>}
        </div>
      ))}
    </div>
  );
}

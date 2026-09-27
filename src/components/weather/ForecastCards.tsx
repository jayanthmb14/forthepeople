/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  The two big weather cards: "Right now" and "Tomorrow in <district>"
// ═══════════════════════════════════════════════════════════════════════
//
//  NowCard shows ONE "now": our stored reading when it is fresh, otherwise
//  the live forecast service's current value (labelled with its source and
//  time), otherwise the old stored reading in grey with its age. Which one
//  is decided by chooseCurrent() (src/lib/weather/forecast.ts).
//
//  TomorrowCard answers the owner's question in one line: "Tomorrow in
//  Mandya: 31° / 21°, 94% chance of rain", with a rain meter, one plain tip,
//  the second-source check and the source + fetched time.
"use client";

import { ChevronRight, CloudLightning, CloudRain, CloudRainWind, Droplets, Info, Scale, ShieldCheck, SunMedium, Sunrise, Sunset, Thermometer, ThermometerSnowflake, ThermometerSun, Umbrella, Wind, type LucideIcon } from "lucide-react";
import { CountUp } from "@/components/district/ui";
import { ReadingAge, ageInDays } from "@/components/district/page-kit";
import type { WeatherKind } from "@/lib/weather/codes";
import { dayTip, type DayCheck, type DayTip, type ForecastDay, type ForecastSourceKey } from "@/lib/weather/forecast";
import { WeatherArt } from "./WeatherArt";
import { useWeatherText } from "./useWeatherText";
import s from "./weather.module.css";

const TIP_ICON: Record<DayTip, LucideIcon> = {
  storm: CloudLightning,
  heavyRain: CloudRainWind,
  umbrella: Umbrella,
  heat: ThermometerSun,
  wind: Wind,
  cold: ThermometerSnowflake,
};

const ext = (href: string) => ({ href, target: "_blank", rel: "noopener noreferrer" });

/** "Forecast from Open-Meteo.com (CC BY 4.0), fetched 10:05 pm IST." */
export function SourceLine({ source, fetchedAt }: { source: ForecastSourceKey; fetchedAt: string }) {
  const w = useWeatherText();
  const src = w.sourceOf(source);
  const a = (c: React.ReactNode) => <a {...ext(src.url)}>{c}</a>;
  return (
    <p className={s.meta} suppressHydrationWarning>
      {src.license
        ? w.t.rich("forecast.source", { source: src.label, license: src.license, time: w.when(fetchedAt), a })
        : w.t.rich("forecast.sourcePlain", { source: src.label, time: w.when(fetchedAt), a })}
    </p>
  );
}

/** "Checked with a second source, OpenWeather: 32° / 23°. The two agree within 3°." */
export function CheckLine({ check, checkDay, checkSource }: { check?: DayCheck | null; checkDay?: ForecastDay | null; checkSource?: ForecastSourceKey | null }) {
  const w = useWeatherText();
  if (!check || !checkDay || !checkSource) {
    return (
      <p className={s.check}>
        <Info size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{w.t("forecast.checkOne")}</span>
      </p>
    );
  }
  const Icon = check.agree ? ShieldCheck : Scale;
  return (
    <p className={s.check} data-agree={String(check.agree)}>
      <Icon size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{w.t(check.agree ? "forecast.checkAgree" : "forecast.checkDiffer", { source: w.sourceOf(checkSource).label, max: w.deg(checkDay.tMax), min: w.deg(checkDay.tMin) })}</span>
    </p>
  );
}

export function TipLine({ tip }: { tip: DayTip | null }) {
  const w = useWeatherText();
  if (!tip) return null;
  const Icon = TIP_ICON[tip];
  return (
    <p className={s.tip}>
      <Icon size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: "var(--hue-deep)" }} />
      <span>{w.t(`forecast.tip.${tip}`)}</span>
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  NowCard
// ─────────────────────────────────────────────────────────────────────

export interface NowView {
  /** stored = our fresh reading · live = forecast service · storedOld = our old reading. */
  origin: "stored" | "live" | "storedOld";
  /** ISO time the value applies to (the source's own time). */
  time: string;
  temp: number | null;
  feels: number | null;
  humidity: number | null;
  windKmh: number | null;
  windDir: string | null;
  kind: WeatherKind;
  night: boolean;
  source: { label: string; href?: string };
  /** Stored OpenWeather readings: rain in the last hour, mm. */
  rainHourMm?: number | null;
}

export function NowCard({
  view,
  today,
  oldStoredAt,
  now,
  maxAgeHours,
}: {
  view: NowView;
  /** Today's forecast row: adds today's high/low, rain and sunrise/sunset. */
  today?: ForecastDay | null;
  /** When the live value is shown because our stored reading is old: that reading's time. */
  oldStoredAt?: string | null;
  now: number;
  maxAgeHours: number;
}) {
  const w = useWeatherText();
  const { t } = w;
  const old = view.origin === "storedOld";
  const sky = w.kindLabel(view.kind, view.night);
  const dateLine = old ? w.f.date(view.time, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : now > 0 ? w.f.date(now, { weekday: "long", day: "numeric", month: "long" }) : null;
  const a = (c: React.ReactNode) => (view.source.href ? <a {...ext(view.source.href)}>{c}</a> : <>{c}</>);

  return (
    <section className={`${s.hero} ${old ? s.heroOld : s.heroNow}`} aria-label={old ? t("hero.old") : t("now.title")}>
      <div className={s.heroTop}>
        <h2 className={s.heroLabel} style={old ? { color: "var(--ftp-text-2)" } : undefined}>
          {old ? t("hero.old") : t("now.title")}
        </h2>
        {dateLine && (
          <p className={s.heroDate} suppressHydrationWarning>
            {dateLine}
          </p>
        )}
      </div>

      <div className={s.heroBody}>
        <span style={old ? { filter: "grayscale(0.85)", opacity: 0.75 } : undefined}>
          <WeatherArt kind={view.kind} night={view.night} size={88} animated={!old} title={sky} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className={s.heroTemp} style={old ? { color: "var(--ftp-text-2)" } : undefined}>
            {view.temp === null ? w.dash : <CountUp value={w.degExact(view.temp)} />}
          </div>
          <div className={s.heroSky}>{sky}</div>
        </div>
      </div>

      <ul className={s.facts}>
        {view.feels !== null && (
          <li>
            <Thermometer size={14} aria-hidden />
            {t("tiles.feels")} <strong>{w.degExact(view.feels)}</strong>
          </li>
        )}
        {view.humidity !== null && (
          <li>
            <Droplets size={14} aria-hidden />
            {t("tiles.humidity")} <strong>{w.pct(view.humidity)}</strong>
          </li>
        )}
        {view.windKmh !== null && (
          <li>
            <Wind size={14} aria-hidden />
            {t("tiles.wind")}{" "}
            <strong>
              {w.kmh(view.windKmh)}
              {view.windDir ? ` ${view.windDir}` : ""}
            </strong>
          </li>
        )}
        {view.rainHourMm !== null && view.rainHourMm !== undefined && (
          <li>
            <CloudRain size={14} aria-hidden />
            {t("tiles.rainHour")} <strong>{w.mm(view.rainHourMm)}</strong>
          </li>
        )}
        {!old && today && (today.tMax !== null || today.tMin !== null) && (
          <li>
            <ThermometerSun size={14} aria-hidden />
            {t("now.todayRange")}{" "}
            <strong>
              {w.deg(today.tMax)} / {w.deg(today.tMin)}
            </strong>
          </li>
        )}
        {!old && today && today.rainMm !== null && (
          <li>
            <Umbrella size={14} aria-hidden />
            {t("now.rainToday")} <strong>{today.rainChance !== null ? t("now.rainTodayValue", { mm: w.mm(today.rainMm), pct: w.pct(today.rainChance) }) : w.mm(today.rainMm)}</strong>
          </li>
        )}
        {!old && today?.sunrise && (
          <li suppressHydrationWarning>
            <Sunrise size={14} aria-hidden />
            {t("forecast.sunrise")} <strong>{w.time(today.sunrise)}</strong>
          </li>
        )}
        {!old && today?.sunset && (
          <li suppressHydrationWarning>
            <Sunset size={14} aria-hidden />
            {t("forecast.sunset")} <strong>{w.time(today.sunset)}</strong>
          </li>
        )}
      </ul>

      {old ? (
        <div style={{ marginTop: 12 }}>
          <ReadingAge at={view.time} maxAgeHours={maxAgeHours} withTime now={now} />
        </div>
      ) : (
        <p className={s.meta} suppressHydrationWarning>
          {view.origin === "live" ? t.rich("now.live", { source: view.source.label, time: w.when(view.time), a }) : t("now.stored", { source: view.source.label, time: w.when(view.time) })}
        </p>
      )}
      {view.origin === "live" && oldStoredAt && now > 0 && (
        <p className={s.meta} suppressHydrationWarning>
          {t("now.oldStored", { date: w.f.date(oldStoredAt, { day: "numeric", month: "short", year: "numeric" }), n: ageInDays(oldStoredAt, now) })}
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  TomorrowCard
// ─────────────────────────────────────────────────────────────────────

export function TomorrowCard({
  day,
  district,
  source,
  fetchedAt,
  check,
  checkDay,
  checkSource,
  onOpen,
}: {
  day: ForecastDay;
  district: string;
  source: ForecastSourceKey;
  fetchedAt: string;
  check?: DayCheck | null;
  checkDay?: ForecastDay | null;
  checkSource?: ForecastSourceKey | null;
  onOpen: () => void;
}) {
  const w = useWeatherText();
  const { t } = w;
  const sky = w.kindLabel(day.kind);
  const band = w.band(day.rainChance);
  const uv = w.uv(day.uvMax);

  return (
    <section className={`${s.hero} ${s.heroTomorrow}`} aria-label={t("forecast.tomorrowIn", { district })}>
      <div className={s.heroTop}>
        <h2 className={s.heroLabel}>{t("forecast.tomorrowIn", { district })}</h2>
        <p className={s.heroDate} suppressHydrationWarning>
          {w.dateLong(day.date)}
        </p>
      </div>

      <div className={s.heroBody}>
        <WeatherArt kind={day.kind} size={88} animated title={sky} />
        <div style={{ minWidth: 0 }}>
          <div className={s.heroTemp}>
            <span className="sr-only">{t("forecast.high")} </span>
            {w.deg(day.tMax)}
            <span className={s.heroTempMin}>
              {" / "}
              <span className="sr-only">{t("forecast.low")} </span>
              {w.deg(day.tMin)}
            </span>
          </div>
          <div className={s.heroSky}>{sky}</div>
        </div>
      </div>

      {day.rainChance !== null && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
            <strong style={{ color: "var(--hue-deep)" }}>{t("forecast.chance", { pct: w.pct(day.rainChance) })}</strong>
            {band ? <span style={{ color: "var(--ftp-text-2)" }}> · {band}</span> : null}
          </p>
          <div className={s.meter} aria-hidden>
            <div className={s.meterFill} style={{ width: `${Math.max(2, Math.min(100, day.rainChance))}%` }} />
          </div>
        </div>
      )}

      <ul className={s.facts}>
        {day.rainMm !== null && day.rainMm > 0 && (
          <li>
            <CloudRain size={14} aria-hidden />
            {t("forecast.amount", { mm: w.mm(day.rainMm) })}
          </li>
        )}
        {day.windMaxKmh !== null && (
          <li>
            <Wind size={14} aria-hidden />
            {t("forecast.windUpTo", { v: w.f.number(Math.round(day.windMaxKmh)) })}
          </li>
        )}
        {uv && (
          <li>
            <SunMedium size={14} aria-hidden />
            {t("forecast.uv")} <strong>{uv}</strong>
          </li>
        )}
        {day.sunrise && (
          <li suppressHydrationWarning>
            <Sunrise size={14} aria-hidden />
            {t("forecast.sunrise")} <strong>{w.time(day.sunrise)}</strong>
          </li>
        )}
        {day.sunset && (
          <li suppressHydrationWarning>
            <Sunset size={14} aria-hidden />
            {t("forecast.sunset")} <strong>{w.time(day.sunset)}</strong>
          </li>
        )}
      </ul>

      <TipLine tip={dayTip(day)} />
      <CheckLine check={check} checkDay={checkDay} checkSource={checkSource} />
      <SourceLine source={source} fetchedAt={fetchedAt} />

      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        style={{
          marginTop: 10,
          minHeight: 44,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "0 2px",
          border: "none",
          background: "none",
          color: "var(--hue-deep)",
          font: "inherit",
          fontSize: 14,
          fontWeight: 650,
          cursor: "pointer",
        }}
      >
        {t("forecast.details")}
        <ChevronRight size={16} aria-hidden />
      </button>
    </section>
  );
}

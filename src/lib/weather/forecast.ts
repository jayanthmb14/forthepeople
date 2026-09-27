/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Weather forecast: request URLs, parsers, checks (pure — no fetch, no
// DB, no React, so tests/weather-forecast.test.ts covers all of it)
//
// Sources
//  1. Open-Meteo (open-meteo.com, no key, CC BY 4.0): the main source.
//     One call gives "current" (15-minute model value) and 8 daily rows
//     in India time: max/min °C, chance of rain (%), rain (mm), wind
//     (km/h — requested with wind_speed_unit=kmh), sunrise/sunset, UV.
//  2. OpenWeather 5-day / 3-hour forecast (only when OPENWEATHER_API_KEY
//     is set): the second opinion. Its 3-hour slots are grouped into India
//     days here: max/min of the slots, the highest chance of rain
//     (`pop` 0–1 → %), rain + snow added up, wind m/s → km/h.
//
// Units shown on the site: °C, %, mm, km/h. Every value passes a range
// check; a value outside it becomes null ("—" on the page), never a guess.
//
// "Checked with a second source": for each day both sources cover in
// full, the maximum and minimum temperatures are compared. Within 3 °C
// counts as agreeing (forecast models differ by 1–2 °C on a normal day).
// ═══════════════════════════════════════════════════════════

import { kindFromOwm, kindFromWmo, worstKind, type WeatherKind } from "./codes";

// ── Sources ────────────────────────────────────────────────

export type ForecastSourceKey = "open-meteo" | "openweather";

export const FORECAST_SOURCES: Record<ForecastSourceKey, { label: string; url: string; license?: string }> = {
  "open-meteo": { label: "Open-Meteo.com", url: "https://open-meteo.com/", license: "CC BY 4.0" },
  openweather: { label: "OpenWeather", url: "https://openweathermap.org/forecast5" },
};

/** How long one district's forecast is kept in Redis / the CDN (seconds). */
export const FORECAST_CACHE_SECONDS = 60 * 60;
/** A failed fetch is remembered this long, so a dead source is not hammered. */
export const FORECAST_FAIL_CACHE_SECONDS = 5 * 60;
/** Two sources "agree" on a day when max and min differ by at most this (°C). */
export const AGREE_TOLERANCE_C = 3;
/** A stored reading newer than this counts as "now"; older → prefer the live value. */
export const STORED_FRESH_HOURS = 3;
/** OpenWeather slots per day (every 3 h); fewer = a part day (today, or the last day). */
export const FULL_DAY_SLOTS = 6;

// ── Shapes ─────────────────────────────────────────────────

export interface ForecastDay {
  /** YYYY-MM-DD in India time. */
  date: string;
  kind: WeatherKind;
  /** The source's own weather code (WMO for Open-Meteo, condition id for OpenWeather). */
  code: number | null;
  /** °C */
  tMax: number | null;
  tMin: number | null;
  /** Highest chance of rain during the day, 0–100 %. */
  rainChance: number | null;
  /** Expected rain (and snow) for the whole day, mm. */
  rainMm: number | null;
  /** Strongest wind of the day, km/h. */
  windMaxKmh: number | null;
  /** "N", "NNE" … */
  windDir: string | null;
  /** ISO times. */
  sunrise: string | null;
  sunset: string | null;
  uvMax: number | null;
  /** OpenWeather only: how many 3-hour slots made this day. */
  slots?: number;
}

export interface ForecastCurrent {
  /** ISO time the value applies to (the source's own time). */
  time: string;
  temperature: number;
  feelsLike: number | null;
  humidity: number | null;
  windKmh: number | null;
  windDir: string | null;
  kind: WeatherKind;
  code: number | null;
  isDay: boolean | null;
}

export interface SourceForecast {
  source: ForecastSourceKey;
  current: ForecastCurrent | null;
  days: ForecastDay[];
}

export interface DayCheck {
  date: string;
  /** Second source minus main source, °C. */
  tMaxDiff: number;
  tMinDiff: number;
  agree: boolean;
}

export interface ForecastPayload {
  state: string;
  district: string;
  /** The point asked for (district headquarters town). */
  lat: number;
  lng: number;
  /** When we fetched it (ISO). */
  fetchedAt: string;
  /** The source the page shows. Null when no source answered. */
  primary: SourceForecast | null;
  /** The second opinion, when there is one. */
  check: SourceForecast | null;
  /** Day-by-day comparison of `primary` and `check`. */
  checks: DayCheck[];
  /** Short reasons a source was not used (never a key or a full URL). */
  problems: string[];
}

// ── Small helpers ──────────────────────────────────────────

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

const finite = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const inRange = (v: unknown, lo: number, hi: number): number | null => {
  const n = finite(v);
  return n !== null && n >= lo && n <= hi ? n : null;
};
/** °C that can happen on Earth; anything else is a broken value. */
const tempC = (v: unknown) => inRange(v, -60, 60);
export const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Metres per second → km/h, one decimal. */
export function msToKmh(ms: number | null | undefined): number | null {
  const n = finite(ms);
  return n === null || n < 0 ? null : round1(n * 3.6);
}

/** OpenWeather `pop` (0–1) → whole percent, or null. */
export function popToPercent(pop: number | null | undefined): number | null {
  const n = inRange(pop, 0, 1);
  return n === null ? null : Math.round(n * 100);
}

/** 0–360° → "N", "NNE", … "NNW". */
export function compass(deg: number | null | undefined): string | null {
  const n = finite(deg);
  if (n === null) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((((n % 360) + 360) % 360) / 22.5) % 16];
}

/** A moment → its calendar date in India, "YYYY-MM-DD". */
export function istDate(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" plus n days. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Noon IST of a "YYYY-MM-DD" date, for weekday / date formatting. */
export function istNoon(date: string): Date {
  return new Date(`${date}T12:00:00+05:30`);
}

// ── Open-Meteo ─────────────────────────────────────────────

/** The Open-Meteo forecast request for one point (8 days incl. today, India time). */
export function openMeteoForecastUrl(lat: number, lng: number): string {
  const current = ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "weather_code", "wind_speed_10m", "wind_direction_10m", "is_day"].join(",");
  const daily = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "precipitation_sum",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",
    "sunrise",
    "sunset",
    "uv_index_max",
  ].join(",");
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&current=${current}&daily=${daily}` +
    `&timezone=Asia%2FKolkata&forecast_days=8&wind_speed_unit=kmh&timeformat=unixtime`
  );
}

/** Open-Meteo reply (requested with openMeteoForecastUrl) → forecast, or null. */
export function parseOpenMeteoForecast(json: unknown): SourceForecast | null {
  const j = json as {
    utc_offset_seconds?: unknown;
    current?: Record<string, unknown>;
    daily?: Record<string, unknown[] | undefined>;
  } | null;
  if (!j || typeof j !== "object") return null;

  // Daily rows. `time` is local midnight as unix seconds; add the reply's
  // own UTC offset (19800 for Asia/Kolkata) to read the calendar date.
  const offset = finite(j.utc_offset_seconds) ?? IST_OFFSET_MS / 1000;
  const d = j.daily ?? {};
  const at = (key: string, i: number): unknown => (Array.isArray(d[key]) ? (d[key] as unknown[])[i] : undefined);
  const times = Array.isArray(d.time) ? d.time : [];
  const days: ForecastDay[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < times.length; i++) {
    const t = finite(times[i]);
    if (t === null) continue;
    const date = new Date((t + offset) * 1000).toISOString().slice(0, 10);
    if (seen.has(date)) continue;
    seen.add(date);
    const code = finite(at("weather_code", i));
    let tMax = tempC(at("temperature_2m_max", i));
    let tMin = tempC(at("temperature_2m_min", i));
    if (tMax !== null && tMin !== null && tMin > tMax) {
      tMax = null;
      tMin = null;
    }
    const rain = inRange(at("precipitation_sum", i), 0, 1500);
    const rainChance = inRange(at("precipitation_probability_max", i), 0, 100);
    const sunrise = finite(at("sunrise", i));
    const sunset = finite(at("sunset", i));
    const wind = inRange(at("wind_speed_10m_max", i), 0, 400);
    const uv = inRange(at("uv_index_max", i), 0, 20);
    days.push({
      date,
      kind: dayKind(kindFromWmo(code), rainChance),
      code,
      tMax: tMax === null ? null : round1(tMax),
      tMin: tMin === null ? null : round1(tMin),
      rainChance,
      rainMm: rain === null ? null : round2(rain),
      windMaxKmh: wind === null ? null : round1(wind),
      windDir: compass(finite(at("wind_direction_10m_dominant", i))),
      sunrise: sunrise === null ? null : new Date(sunrise * 1000).toISOString(),
      sunset: sunset === null ? null : new Date(sunset * 1000).toISOString(),
      uvMax: uv === null ? null : round1(uv),
    });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Current value.
  let current: ForecastCurrent | null = null;
  const c = j.current;
  const temperature = tempC(c?.temperature_2m);
  const time = finite(c?.time);
  if (c && temperature !== null && time !== null) {
    const code = finite(c.weather_code);
    const isDay = finite(c.is_day);
    const wind = inRange(c.wind_speed_10m, 0, 400);
    const feels = inRange(c.apparent_temperature, -70, 75);
    current = {
      time: new Date(time * 1000).toISOString(),
      temperature: round1(temperature),
      feelsLike: feels === null ? null : round1(feels),
      humidity: inRange(c.relative_humidity_2m, 0, 100),
      windKmh: wind === null ? null : round1(wind),
      windDir: compass(finite(c.wind_direction_10m)),
      kind: kindFromWmo(code),
      code,
      isDay: isDay === null ? null : isDay === 1,
    };
  }

  if (days.length === 0 && !current) return null;
  return { source: "open-meteo", current, days };
}

// ── OpenWeather (second opinion) ───────────────────────────

/** OpenWeather 5-day / 3-hour forecast for one point. Contains the key: never log it. */
export function openWeatherForecastUrl(lat: number, lng: number, key: string): string {
  return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat.toFixed(3)}&lon=${lng.toFixed(3)}&units=metric&appid=${encodeURIComponent(key)}`;
}

interface OwmSlot {
  dt?: unknown;
  main?: { temp?: unknown; temp_min?: unknown; temp_max?: unknown };
  weather?: Array<{ id?: unknown }>;
  wind?: { speed?: unknown; deg?: unknown };
  pop?: unknown;
  rain?: { "3h"?: unknown };
  snow?: { "3h"?: unknown };
}

/** OpenWeather 5-day / 3-hour reply → India days (see the file header). */
export function parseOpenWeatherForecast(json: unknown): SourceForecast | null {
  const list = (json as { list?: unknown } | null)?.list;
  if (!Array.isArray(list)) return null;

  const byDate = new Map<string, OwmSlot[]>();
  for (const raw of list as OwmSlot[]) {
    const dt = finite(raw?.dt);
    if (dt === null) continue;
    const date = istDate(dt * 1000);
    const arr = byDate.get(date) ?? [];
    arr.push(raw);
    byDate.set(date, arr);
  }

  const days: ForecastDay[] = [];
  for (const [date, slots] of byDate) {
    const highs = slots.map((s) => tempC(s.main?.temp_max) ?? tempC(s.main?.temp)).filter((v): v is number => v !== null);
    const lows = slots.map((s) => tempC(s.main?.temp_min) ?? tempC(s.main?.temp)).filter((v): v is number => v !== null);
    const pops = slots.map((s) => popToPercent(finite(s.pop))).filter((v): v is number => v !== null);
    let rain = 0;
    let rainSeen = false;
    for (const s of slots) {
      for (const part of [s.rain?.["3h"], s.snow?.["3h"]]) {
        const mm = inRange(part, 0, 500);
        if (mm !== null) {
          rain += mm;
          rainSeen = true;
        }
      }
    }
    // Strongest wind slot → its speed and direction.
    let windMs: number | null = null;
    let windDeg: number | null = null;
    for (const s of slots) {
      const sp = inRange(s.wind?.speed, 0, 120);
      if (sp !== null && (windMs === null || sp > windMs)) {
        windMs = sp;
        windDeg = finite(s.wind?.deg);
      }
    }
    // One picture for the day: the slot that matters most.
    let code: number | null = null;
    let kind: WeatherKind = "unknown";
    for (const s of slots) {
      const id = finite(s.weather?.[0]?.id);
      const k = kindFromOwm(id);
      if (worstKind([kind, k]) !== kind) {
        kind = k;
        code = id;
      }
    }
    const rainChance = pops.length ? Math.max(...pops) : null;
    days.push({
      date,
      kind: dayKind(kind, rainChance),
      code,
      tMax: highs.length ? round1(Math.max(...highs)) : null,
      tMin: lows.length ? round1(Math.min(...lows)) : null,
      rainChance,
      // No rain field in any slot means "no rain expected" for OpenWeather.
      rainMm: rainSeen ? round2(rain) : pops.length ? 0 : null,
      windMaxKmh: msToKmh(windMs),
      windDir: compass(windDeg),
      sunrise: null,
      sunset: null,
      uvMax: null,
      slots: slots.length,
    });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length === 0) return null;
  return { source: "openweather", current: null, days };
}

// ── Checks and choices ─────────────────────────────────────

/**
 * Compare the main forecast with the second opinion, day by day. Only days
 * both sources cover in full (OpenWeather: at least FULL_DAY_SLOTS slots)
 * and where both give a max and a min.
 */
export function compareForecasts(primary: SourceForecast | null, check: SourceForecast | null, tolerance = AGREE_TOLERANCE_C): DayCheck[] {
  if (!primary || !check) return [];
  const other = new Map(check.days.map((d) => [d.date, d]));
  const out: DayCheck[] = [];
  for (const p of primary.days) {
    const o = other.get(p.date);
    if (!o || p.tMax === null || p.tMin === null || o.tMax === null || o.tMin === null) continue;
    if (o.slots !== undefined && o.slots < FULL_DAY_SLOTS) continue;
    const tMaxDiff = round1(o.tMax - p.tMax);
    const tMinDiff = round1(o.tMin - p.tMin);
    out.push({ date: p.date, tMaxDiff, tMinDiff, agree: Math.abs(tMaxDiff) <= tolerance && Math.abs(tMinDiff) <= tolerance });
  }
  return out;
}

/**
 * Days that describe a whole day. OpenWeather days built from fewer than
 * FULL_DAY_SLOTS 3-hour slots (the rest of today, the last day) would show
 * the "high" of a few evening hours, so they are dropped; Open-Meteo days
 * are always whole.
 */
export function wholeDays(days: readonly ForecastDay[]): ForecastDay[] {
  return days.filter((d) => d.slots === undefined || d.slots >= FULL_DAY_SLOTS);
}

/** Days from today (India time) onwards, at most `n`. */
export function upcomingDays(days: readonly ForecastDay[], nowMs: number, n = 7): ForecastDay[] {
  const today = istDate(nowMs);
  return days.filter((d) => d.date >= today).slice(0, n);
}

/** Today's row (India time), if the forecast has it. */
export function todayOf(days: readonly ForecastDay[], nowMs: number): ForecastDay | null {
  const today = istDate(nowMs);
  return days.find((d) => d.date === today) ?? null;
}

/** Tomorrow's row (India time), if the forecast has it. */
export function tomorrowOf(days: readonly ForecastDay[], nowMs: number): ForecastDay | null {
  const tomorrow = addDays(istDate(nowMs), 1);
  return days.find((d) => d.date === tomorrow) ?? null;
}

/** 0 = today, 1 = tomorrow, … (India time). */
export function dayOffset(date: string, nowMs: number): number {
  const [y, m, d] = date.split("-").map(Number);
  const [ty, tm, td] = istDate(nowMs).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / DAY_MS);
}

export type RainBand = "unlikely" | "possible" | "likely" | "veryLikely";

/** Wet kinds that a low chance of rain overrules (thunder and heavy rain keep their warning). */
const LIGHT_WET_KINDS: ReadonlySet<WeatherKind> = new Set<WeatherKind>(["drizzle", "rain", "showers"]);

/**
 * A day's picture word that agrees with its chance of rain. The daily
 * weather code is the worst hour of the day (one hour of light drizzle
 * makes a "drizzle" day), while the chance of rain can still say rain is
 * unlikely. Sept 2026 audit: Hyderabad showed "Light drizzle · 8% chance
 * of rain · Rain unlikely". When rain is unlikely (rainBand), drizzle,
 * rain and showers read as "cloudy"; thunderstorms and heavy rain stay.
 */
export function dayKind(kind: WeatherKind, rainChance: number | null | undefined): WeatherKind {
  return LIGHT_WET_KINDS.has(kind) && rainBand(rainChance) === "unlikely" ? "cloudy" : kind;
}

/** Chance of rain in words a child understands. */
export function rainBand(chance: number | null | undefined): RainBand | null {
  const n = finite(chance);
  if (n === null) return null;
  if (n < 20) return "unlikely";
  if (n < 50) return "possible";
  if (n < 80) return "likely";
  return "veryLikely";
}

export type DayTip = "storm" | "heavyRain" | "umbrella" | "heat" | "wind" | "cold";

/**
 * One plain tip for a day, or null. Thresholds:
 *  - storm: a thunderstorm code for the day;
 *  - heavyRain: heavy-rain code, or ≥ 64.5 mm (IMD's "heavy rain" band);
 *  - umbrella: chance of rain ≥ 50 %;
 *  - heat: max ≥ 38 °C; wind: ≥ 40 km/h; cold: min ≤ 10 °C.
 */
export function dayTip(day: ForecastDay | null | undefined): DayTip | null {
  if (!day) return null;
  if (day.kind === "thunder") return "storm";
  if (day.kind === "heavyRain" || (day.rainMm ?? 0) >= 64.5) return "heavyRain";
  if ((day.rainChance ?? 0) >= 50) return "umbrella";
  if ((day.tMax ?? -99) >= 38) return "heat";
  if ((day.windMaxKmh ?? 0) >= 40) return "wind";
  if (day.tMin !== null && day.tMin <= 10) return "cold";
  return null;
}

export type CurrentChoice = "stored" | "live" | "storedOld" | "none";

/**
 * Which "right now" to show:
 *  - our stored reading when it is at most STORED_FRESH_HOURS old;
 *  - otherwise the live forecast service's current value, when it is newer;
 *  - otherwise the old stored reading (shown grey, with its age);
 *  - otherwise nothing.
 */
export function chooseCurrent(
  storedAt: string | null | undefined,
  live: Pick<ForecastCurrent, "time"> | null | undefined,
  nowMs: number,
  freshHours = STORED_FRESH_HOURS,
): CurrentChoice {
  const s = storedAt ? new Date(storedAt).getTime() : NaN;
  const l = live ? new Date(live.time).getTime() : NaN;
  const hasStored = Number.isFinite(s);
  const hasLive = Number.isFinite(l);
  if (hasStored && nowMs - s <= freshHours * 3_600_000) return "stored";
  if (hasLive && (!hasStored || l > s)) return "live";
  if (hasStored) return "storedOld";
  return "none";
}

/** The warmest max and coolest min across days (for the range bars). */
export function weekRange(days: readonly ForecastDay[]): { lo: number; hi: number } | null {
  const lows = days.map((d) => d.tMin).filter((v): v is number => v !== null);
  const highs = days.map((d) => d.tMax).filter((v): v is number => v !== null);
  if (!lows.length || !highs.length) return null;
  const lo = Math.min(...lows);
  const hi = Math.max(...highs);
  return hi > lo ? { lo, hi } : { lo: lo - 1, hi: hi + 1 };
}

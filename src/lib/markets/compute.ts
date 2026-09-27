/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Market prices — pure helpers (no network, no cache, no React)
// ═══════════════════════════════════════════════════════════════════════
//
//  Parsers for the two upstreams and the arithmetic the /prices page and the
//  home ticker need: the latest value, the change since the previous trading
//  day, "before → now" for 1 week / 1 month / 3 months, and the age of the
//  newest value. Everything here is covered by tests/markets.test.ts.
//
//  Dates are plain "YYYY-MM-DD" strings (the trading day in the market's own
//  time zone), so comparisons are string comparisons and never shift with the
//  server's time zone.

/** One daily value. `d` = trading day "YYYY-MM-DD", `v` = the closing value. */
export interface PricePoint {
  d: string;
  v: number;
}

// ── Dates ──────────────────────────────────────────────────────────────

const IST_OFFSET_SECONDS = 5.5 * 3600;

/** "YYYY-MM-DD" of a Unix time (seconds) in a zone `offsetSeconds` east of UTC. */
export function dayOf(unixSeconds: number, offsetSeconds = IST_OFFSET_SECONDS): string {
  return new Date((unixSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10);
}

/** Today's date in India, "YYYY-MM-DD". */
export function todayIST(nowMs: number = Date.now()): string {
  return dayOf(Math.floor(nowMs / 1000));
}

/** "dd/mm/yyyy" (IBJA) → "yyyy-mm-dd", or null when it does not look like a date. */
export function ddmmyyyyToIso(s: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** "YYYY-MM-DD" shifted back by `days` days. */
export function minusDays(day: string, days: number): string {
  const t = Date.parse(`${day}T00:00:00Z`) - days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * "YYYY-MM-DD" shifted back by `months` calendar months. The day is clamped
 * to the end of a shorter month (31 May − 3 months = 28/29 Feb).
 */
export function minusMonths(day: string, months: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const total = y * 12 + (m - 1) - months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12; // 0-based
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

// ── Series helpers ─────────────────────────────────────────────────────

/**
 * Clean a raw series: drop null / non-finite / non-positive values, sort by
 * day, and keep only the LAST value of a day that appears twice (Yahoo can
 * send today's live value next to today's daily bar).
 */
export function cleanSeries(points: Array<{ d: string; v: number | null | undefined }>): PricePoint[] {
  const byDay = new Map<string, number>();
  for (const p of points) {
    if (typeof p.v !== "number" || !Number.isFinite(p.v) || p.v <= 0) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.d)) continue;
    byDay.set(p.d, p.v);
  }
  return [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([d, v]) => ({ d, v }));
}

/** The last point on or before `day`, or null when the series starts later. */
export function pointOnOrBefore(points: PricePoint[], day: string): PricePoint | null {
  let hit: PricePoint | null = null;
  for (const p of points) {
    if (p.d <= day) hit = p;
    else break;
  }
  return hit;
}

export interface Change {
  /** Absolute change, now − before. */
  abs: number;
  /** Percentage change, 100 × (now − before) / before. */
  pct: number;
  direction: "up" | "down" | "flat";
}

/** Change from `before` to `now`. Moves under 0.05 % count as "flat". */
export function change(before: number, now: number): Change {
  const abs = now - before;
  const pct = before === 0 ? 0 : (abs / before) * 100;
  const direction = Math.abs(pct) < 0.05 ? "flat" : abs > 0 ? "up" : "down";
  return { abs, pct, direction };
}

/** The newest point and the change since the trading day before it. */
export function latestWithChange(points: PricePoint[]): { latest: PricePoint; previous: PricePoint | null; change: Change | null } | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  const previous = points.length >= 2 ? points[points.length - 2] : null;
  return { latest, previous, change: previous ? change(previous.v, latest.v) : null };
}

export type SpanKey = "week" | "month" | "quarter";

export interface BeforeNow {
  span: SpanKey;
  /** The value `span` before the latest day (the last trading day on or before it). */
  before: PricePoint;
  change: Change;
}

/**
 * "Before → now" for 1 week, 1 month and 3 months, measured back from the
 * newest point. A span is left out when the series does not reach back
 * that far — never filled in.
 */
export function beforeNow(points: PricePoint[]): BeforeNow[] {
  const lw = latestWithChange(points);
  if (!lw) return [];
  const last = lw.latest;
  const targets: Array<[SpanKey, string]> = [
    ["week", minusDays(last.d, 7)],
    ["month", minusMonths(last.d, 1)],
    ["quarter", minusMonths(last.d, 3)],
  ];
  const out: BeforeNow[] = [];
  for (const [span, target] of targets) {
    const before = pointOnOrBefore(points, target);
    if (!before || before.d === last.d) continue;
    out.push({ span, before, change: change(before.v, last.v) });
  }
  return out;
}

/**
 * The points to draw: the last 3 months, starting at the 3-month "before"
 * point so the chart and the "3 months" row agree.
 */
export function chartWindow(points: PricePoint[], months = 3): PricePoint[] {
  if (points.length === 0) return [];
  const last = points[points.length - 1];
  const start = pointOnOrBefore(points, minusMonths(last.d, months));
  return start ? points.filter((p) => p.d >= start.d) : points.slice();
}

// ── Freshness ──────────────────────────────────────────────────────────

/**
 * Markets close at weekends and on holidays, so a value up to 4 days old is
 * normal (Friday's close on a Monday holiday). Older than that, the page says
 * plainly how old it is and that nothing newer was found.
 */
export const STALE_AFTER_DAYS = 4;

export function ageInDays(latestDay: string, nowMs: number = Date.now()): number {
  return Math.max(0, daysBetween(latestDay, todayIST(nowMs)));
}

export function isStale(latestDay: string, nowMs: number = Date.now()): boolean {
  return ageInDays(latestDay, nowMs) > STALE_AFTER_DAYS;
}

// ── Upstream parsers ───────────────────────────────────────────────────

/** Decode the few HTML entities IBJA uses inside its hidden JSON fields. */
function decodeEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Read `<input … id="<id>" … value="…">` and JSON-parse its value. */
function hiddenJson(html: string, id: string): Record<string, unknown> | null {
  const tag = new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, "i").exec(html)?.[0];
  if (!tag) return null;
  const value = /\bvalue="([^"]*)"/i.exec(tag)?.[1];
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeEntities(value)) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Zip IBJA's `labels` ("dd/mm/yyyy") with one of its value arrays. */
function zipIbja(data: Record<string, unknown> | null, valueKey: string): PricePoint[] {
  if (!data) return [];
  const labels = Array.isArray(data.labels) ? (data.labels as unknown[]) : [];
  const values = Array.isArray(data[valueKey]) ? (data[valueKey] as unknown[]) : [];
  const n = Math.min(labels.length, values.length);
  const raw: Array<{ d: string; v: number | null }> = [];
  for (let i = 0; i < n; i++) {
    const d = typeof labels[i] === "string" ? ddmmyyyyToIso(labels[i] as string) : null;
    const v = typeof values[i] === "number" ? (values[i] as number) : Number(values[i]);
    if (d) raw.push({ d, v: Number.isFinite(v) ? v : null });
  }
  return cleanSeries(raw);
}

export interface IbjaSeries {
  /** 24 carat (999 purity), rupees per 10 grams, IBJA evening (PM) rate. */
  gold999Per10g: PricePoint[];
  /** 22 carat (916 purity), rupees per 10 grams, IBJA evening (PM) rate. */
  gold916Per10g: PricePoint[];
  /** Silver 999, rupees per kilogram, IBJA evening (PM) rate. */
  silverPerKg: PricePoint[];
}

/**
 * IBJA's home page carries about 4 months of daily evening rates in two
 * hidden fields:
 *   HdnGold   = {"labels":[dd/mm/yyyy…], "purity999":[…], "purity916":[…]}  (₹ per 10 g)
 *   HdnSilver = {"labels":[dd/mm/yyyy…], "silverRate":[…]}                   (₹ per kg)
 * (The silver key is `silverRate` — reading `purity999` there, as the old
 * ticker did, always came back empty.)
 */
export function parseIbjaHtml(html: string): IbjaSeries {
  const gold = hiddenJson(html, "HdnGold");
  const silver = hiddenJson(html, "HdnSilver");
  return {
    gold999Per10g: zipIbja(gold, "purity999"),
    gold916Per10g: zipIbja(gold, "purity916"),
    silverPerKg: zipIbja(silver, "silverRate"),
  };
}

/** What we keep from one Yahoo chart response. */
export interface YahooSeries {
  points: PricePoint[];
  /** When the newest value was recorded (ISO), from `meta.regularMarketTime`. */
  asOf: string | null;
  currency: string | null;
}

/**
 * Yahoo `v8/finance/chart` → daily closes. The trading day is taken in the
 * exchange's own time zone (`meta.gmtoffset`), so an FX bar stamped 23:00 UTC
 * lands on the next London day, as Yahoo means it.
 */
export function parseYahooChart(json: unknown): YahooSeries | null {
  const result = (json as { chart?: { result?: unknown[] } } | null)?.chart?.result?.[0] as
    | {
        meta?: { regularMarketTime?: number; regularMarketPrice?: number; gmtoffset?: number; currency?: string };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      }
    | undefined;
  if (!result) return null;
  const meta = result.meta ?? {};
  const offset = typeof meta.gmtoffset === "number" ? meta.gmtoffset : IST_OFFSET_SECONDS;
  const ts = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const raw: Array<{ d: string; v: number | null }> = [];
  for (let i = 0; i < ts.length; i++) raw.push({ d: dayOf(ts[i], offset), v: closes[i] ?? null });

  // The live price, when newer than the last daily bar (during market hours).
  if (typeof meta.regularMarketTime === "number" && typeof meta.regularMarketPrice === "number") {
    raw.push({ d: dayOf(meta.regularMarketTime, offset), v: meta.regularMarketPrice });
  }
  const points = cleanSeries(raw);
  if (points.length === 0) return null;
  return {
    points,
    asOf: typeof meta.regularMarketTime === "number" ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    currency: typeof meta.currency === "string" ? meta.currency : null,
  };
}

/** Divide every value (IBJA gold is per 10 g; the page shows per gram). */
export function scaleSeries(points: PricePoint[], divisor: number): PricePoint[] {
  return points.map((p) => ({ d: p.d, v: p.v / divisor }));
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  District UI kit — Design v5 "Calm" (docs/DESIGN-SYSTEM.md)
//  v5 in one breath: a soft blue-white page, white cards with a thin cool
//  border and a soft shadow, the module hue as pastel IDENTITY only (tint
//  backgrounds, deep tone for small icons and numbers), Plus Jakarta for
//  everything (Bricolage only for the page H1), subtle motion.
//
//  EMOJI RULE (v5): emoji appear ONLY as module identity — the sidebar
//  item, the PageHeader chip and the overview tile. Kit components that
//  used to draw an emoji (StatTile, Section, Explainer, ChartCard,
//  EmptyState, Pictogram, HowItWorks, DetailSheet, DetailList,
//  CountdownBar) still ACCEPT an `emoji` prop so no page breaks, but they
//  draw a small monochrome Lucide icon for it instead (src/lib/design/
//  emoji-icons.ts), or nothing when there is no calm equivalent. Headings
//  (Section, ChartCard) draw nothing. Pass `icon={SomeLucideIcon}` to pick
//  the icon yourself.
//
//  HONESTY (v5): every dataset shows its own date. When data is older than
//  it should be, show <StaleNotice> ("This data is 160 days old … we could
//  not find newer data"); when the source publishes no date, show
//  <StaleNotice unknown>. PageHeader does both when given
//  `freshness.maxAgeDays`.
// ═══════════════════════════════════════════════════════════════════════
//
//  HOW TO READ THIS FILE
//  ---------------------
//  Every export is a small React component. Each one has a comment block
//  above it that says (a) what it is for, (b) which props it takes and
//  (c) which design rule it enforces. The rules in one breath:
//
//    • Colours come from CSS variables (`var(--ftp-…)`) declared in
//      src/app/globals.css. There is NO hex colour anywhere in this file.
//    • Soft shadows only (--ftp-shadow-1/2); no saturated gradients; emoji
//      only as module identity (see above). Icons are Lucide, 14–20 px.
//    • Three radii: 14 px (card), 12 px (tile, chip, button), 999 px (pill).
//    • Text is Plus Jakarta Sans; numbers use tabular figures.
//    • Every number that can go stale carries a date ("as of …") or a
//      FreshnessPill. Nothing says "Live" unless the data is < 30 min old.
//
//  OLD NAMES STILL WORK
//  --------------------
//  Pages written before v3 import ModuleHeader, StatCard, SectionLabel,
//  EmptyBlock, LiveBadge, … Those are kept at the bottom of this file as
//  thin wrappers over the new pieces, so nothing breaks while pages are
//  migrated one by one. New code should use the v3 names.
//
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getModuleMeta, moduleFromPath } from "@/lib/design/hues";
import { KitIcon, emojiIcon } from "@/lib/design/emoji-icons";
import { scriptLang } from "@/lib/utils/script-lang";
import { useTranslations } from "next-intl";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CircleHelp,
  Clock,
  ExternalLink,
  Inbox,
  Minus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
//  Shared types + tiny helpers (not exported unless noted)
// ─────────────────────────────────────────────────────────────────────

/** Semantic tones. Each maps to a `--ftp-<tone>` / `--ftp-<tone>-tint` pair. */
export type Tone = "brand" | "live" | "warn" | "danger" | "features" | "support" | "neutral";

/**
 * Module accent — one per module group, used ONLY to tint an icon square.
 * Values are the super-category ramps already on :root (`--accent-<name>-700`).
 * civic → purple · money → amber · services → teal · accountability → slate ·
 * community → pink · data → blue. "brand" falls back to the brand blue.
 */
export type ModuleAccent =
  | "brand" | "blue" | "teal" | "wheat" | "amber" | "purple"
  | "coral" | "pink" | "forest-green" | "slate" | "indigo";

/** Freshness status as returned by /api/data/freshness. */
export type FreshnessStatus = "green" | "amber" | "red" | "unknown";

const TONE_TEXT: Record<Tone, string> = {
  brand: "var(--ftp-brand-deep)",
  live: "var(--ftp-live-text)",
  warn: "var(--ftp-warn)",
  danger: "var(--ftp-danger)",
  features: "var(--ftp-features)",
  support: "var(--ftp-support)",
  neutral: "var(--ftp-text-2)",
};

const TONE_BG: Record<Tone, string> = {
  brand: "var(--ftp-brand-tint)",
  live: "var(--ftp-live-tint)",
  warn: "var(--ftp-warn-tint)",
  danger: "var(--ftp-danger-tint)",
  features: "var(--ftp-features-tint)",
  support: "var(--ftp-support-tint)",
  neutral: "var(--ftp-surface-2)",
};

/** Solid colour for a tone (used for the 6 px dot and progress fills). */
const TONE_SOLID: Record<Tone, string> = {
  brand: "var(--ftp-brand)",
  live: "var(--ftp-live)",
  warn: "var(--ftp-warn)",
  danger: "var(--ftp-danger)",
  features: "var(--ftp-features)",
  support: "var(--ftp-support)",
  neutral: "var(--ftp-border-strong)",
};

/** Solid accent colour for an icon. */
function accentColor(accent: ModuleAccent = "brand"): string {
  return accent === "brand" ? "var(--ftp-brand)" : `var(--accent-${accent}-700)`;
}

// v4: numbers use the text face with tabular figures (aligned digits),
// not a monospace — friendlier, and columns still line up.
const MONO: React.CSSProperties = {
  fontFamily: "var(--ftp-font-sans)",
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
};

// v4: labels in sentence case (no tracked-out capitals).
const LABEL: React.CSSProperties = {
  fontSize: 12,
  lineHeight: "16px",
  fontWeight: 600,
  color: "var(--ftp-text-2)",
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Sep" or "12 Sep 2025" when the year differs from today. `intl` picks the language. */
function shortDate(d: Date, intl = "en-IN"): string {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(intl, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Asia/Kolkata",
  });
}

/** Exact IST timestamp for tooltips: "12 Sep 2026, 14:05 IST". */
export function formatIST(value: string | Date | null | undefined, intl = "en-IN"): string | null {
  const d = toDate(value);
  if (!d) return null;
  return (
    d.toLocaleString(intl, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }) + " IST"
  );
}

/**
 * Describe how old a timestamp is. Returned by `describeFreshness()` and
 * used by FreshnessPill, StatTile and the sidebar dots.
 */
export interface FreshnessInfo {
  /** Minutes since `asOf`. */
  ageMinutes: number;
  /** True only when under 30 minutes old. The only case that may say "Live". */
  isLive: boolean;
  /** Visual tone: live (fresh), warn (this week), neutral (older), danger (API says red). */
  tone: Tone;
  /** Human label, e.g. "Updated 2h ago" or "As of 12 Sep". */
  label: string;
  /** Exact IST time for the tooltip. */
  exact: string;
}

/**
 * Turn a timestamp into a label + tone. Pure function — safe to unit test.
 *
 * @param asOf           ISO string or Date.
 * @param status         Optional override from /api/data/freshness.
 * @param thresholdHours Hours within which data counts as "fresh" (green). Default 24.
 */
export function describeFreshness(
  asOf: string | Date | null | undefined,
  status?: FreshnessStatus,
  thresholdHours = 24,
  now: Date = new Date(),
): FreshnessInfo | null {
  const d = toDate(asOf);
  if (!d) return null;
  const ageMinutes = Math.max(0, (now.getTime() - d.getTime()) / 60_000);
  const isLive = ageMinutes < 30;

  let label: string;
  if (isLive) label = ageMinutes < 1 ? "Updated just now" : `Updated ${Math.round(ageMinutes)} min ago`;
  else if (ageMinutes < 24 * 60) label = `Updated ${Math.round(ageMinutes / 60)}h ago`;
  else label = `As of ${shortDate(d)}`;

  let tone: Tone;
  if (status === "green") tone = "live";
  else if (status === "amber") tone = "warn";
  else if (status === "red") tone = "danger";
  else if (status === "unknown") tone = "neutral";
  else if (ageMinutes < thresholdHours * 60) tone = "live";
  else if (ageMinutes < 7 * 24 * 60) tone = "warn";
  else tone = "neutral";

  return { ageMinutes, isLive, tone, label, exact: formatIST(d) ?? "" };
}

// ─────────────────────────────────────────────────────────────────────
//  i18n bridge for the kit
// ─────────────────────────────────────────────────────────────────────

/** English prefixes older pages pass in → message keys, so they translate. */
const PREFIX_KEY: Record<string, string> = {
  "As of": "asOf",
  Updated: "updated",
  Published: "published",
  Issued: "issued",
  Computed: "computed",
  Recorded: "recorded",
};

/** Translate a prefix if it is one of the known English ones; else pass through. */
function usePrefix(prefix: string | undefined, fallbackKey = "asOf"): string {
  const t = useTranslations("kit");
  if (prefix === undefined) return t(fallbackKey);
  if (prefix === "") return "";
  const key = PREFIX_KEY[prefix];
  return key ? t(key) : prefix;
}

/** Localised freshness label ("Updated 12 min ago" / "As of 12 Sep"). */
function useFreshnessLabel(info: FreshnessInfo | null, asOf: string | Date | null | undefined): { label: string; exact: string } | null {
  const t = useTranslations("kit");
  const f = useFormat();
  if (!info) return null;
  const d = toDate(asOf);
  const m = info.ageMinutes;
  let label: string;
  if (info.isLive) label = t("updatedAgo", { ago: m < 1 ? t("justNow") : t("minAgo", { n: Math.round(m) }) });
  else if (m < 24 * 60) label = t("updatedAgo", { ago: t("hoursAgo", { n: Math.round(m / 60) }) });
  else label = `${t("asOf")} ${d ? shortDate(d, f.intl) : ""}`.trim();
  return { label, exact: t("exact", { time: formatIST(d, f.intl) ?? "" }) };
}

// ─────────────────────────────────────────────────────────────────────
//  Pill · FreshnessPill · SourcePill
// ─────────────────────────────────────────────────────────────────────

/**
 * Pill — a 24 px rounded label with a tinted background and dark text.
 * Use it for statuses ("NEW", "Coming soon"), counts and small tags.
 *
 * @prop tone     brand | live | warn | danger | features | support | neutral (default)
 * @prop icon     Optional Lucide icon, rendered at 12 px.
 * @prop dot      Show a 6 px dot in the tone colour (for status pills).
 * @prop pulse    Animate the dot (only allowed for data under 30 min old).
 */
export function Pill({
  tone = "neutral",
  icon: Icon,
  dot,
  pulse,
  title,
  children,
  style,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  dot?: boolean;
  pulse?: boolean;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 8px",
        borderRadius: "var(--ftp-radius-pill)",
        background: TONE_BG[tone],
        color: TONE_TEXT[tone],
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          aria-hidden
          className={pulse ? "ftp-live-dot" : undefined}
          style={{ width: 6, height: 6, borderRadius: "50%", background: TONE_SOLID[tone], flexShrink: 0 }}
        />
      )}
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

/**
 * FreshnessPill — the honest date next to a number.
 *
 *   < 30 min  → green pill with a pulsing 6 px dot: "Updated 12 min ago"
 *   < 24 h    → green "Updated 2h ago"
 *   < 7 d     → amber "As of 12 Sep"
 *   older     → grey  "As of 20 Apr"
 *
 * Hover shows the exact IST time. Renders NOTHING when `asOf` is missing —
 * an absent date must never be dressed up as "Live".
 *
 * @prop asOf            ISO timestamp (or Date) of the data.
 * @prop status          Optional traffic light from /api/data/freshness; overrides the colour.
 * @prop thresholdHours  Hours that count as fresh (default 24).
 */
export function FreshnessPill({
  asOf,
  status,
  thresholdHours = 24,
}: {
  asOf?: string | Date | null;
  status?: FreshnessStatus;
  thresholdHours?: number;
}) {
  const info = describeFreshness(asOf, status, thresholdHours);
  const text = useFreshnessLabel(info, asOf);
  if (!info || !text) return null;
  return (
    <Pill tone={info.tone} dot={info.isLive} pulse={info.isLive} title={text.exact}>
      <span suppressHydrationWarning>{text.label}</span>
    </Pill>
  );
}

/**
 * SourcePill — mono 11 px bordered link to the data source. Sits beside a
 * headline number so a reader can always check where a figure came from.
 *
 * Long names never overflow: the pill is capped at the width of whatever
 * holds it and the label is cut with "…". The full name is always in the
 * hover tooltip (`title`), so nothing is lost on a 375 px phone.
 *
 * @prop label  Short source name, e.g. "AGMARKNET".
 * @prop href   Link to the source. Omit to render a non-link pill.
 */
export function SourcePill({ label, href }: { label: string; href?: string }) {
  const tKit = useTranslations("kit");
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 24,
    // Never wider than the parent; the label inside shrinks and truncates.
    maxWidth: "100%",
    minWidth: 0,
    padding: "0 8px",
    borderRadius: "var(--ftp-radius-pill)",
    border: "1px solid var(--ftp-border)",
    background: "var(--ftp-surface)",
    color: "var(--ftp-text-2)",
    fontSize: 11,
    lineHeight: "16px",
    textDecoration: "none",
    whiteSpace: "nowrap",
    // Source names are words ("Census of India", "Deccan Herald"), not
    // figures, so they use the text face. Mono spaced them too widely.
    fontWeight: 500,
  };
  // The text itself: one line, cut with an ellipsis when there is no room.
  const text = (
    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
  );
  if (!href) {
    return (
      <span style={base} title={label}>
        {text}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={base} title={tKit("sourceTitle", { label })}>
      {text}
      <ExternalLink size={11} aria-hidden style={{ flexShrink: 0 }} />
    </a>
  );
}

/**
 * AsOfText — small "As of 12 Sep" line (11 px, text-2) with the exact IST
 * time in the hover tooltip.
 *
 * Some figures are not tied to a day but to a period — a census, a
 * financial year, a survey round. For those pass `period` instead:
 *
 *   <AsOfText period="Census 2011" />               → "As of Census 2011"
 *   <AsOfText period="FY 2024-25" prefix="Data:" /> → "Data: FY 2024-25"
 *
 * When both `period` and `asOf` are given, the period is shown and the
 * date moves into the tooltip ("Fetched: 12 Sep 2026, 14:05 IST").
 * Renders nothing when neither is available.
 *
 * @prop asOf    ISO timestamp (or Date) the value was true.
 * @prop period  Free-text period label, e.g. "Census 2011" or "FY 2024-25".
 * @prop prefix  Word(s) before the date/period (default "As of").
 */
export function AsOfText({
  asOf,
  period,
  prefix,
}: {
  asOf?: string | Date | null;
  period?: string | null;
  /** Defaults to the translated "As of". Known English prefixes are translated. */
  prefix?: string;
}) {
  const t = useTranslations("kit");
  const f = useFormat();
  const pre = usePrefix(prefix);
  const d = toDate(asOf);
  const style: React.CSSProperties = { fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" };
  const label = period?.trim();
  if (label) {
    return (
      <span title={d ? t("fetched", { time: formatIST(d, f.intl) ?? "" }) : undefined} style={style}>
        {pre ? `${pre} ` : ""}
        {label}
      </span>
    );
  }
  if (!d) return null;
  return (
    <span title={t("exact", { time: formatIST(d, f.intl) ?? "" })} style={style}>
      <span suppressHydrationWarning>
        {pre} {shortDate(d, f.intl)}
      </span>
    </span>
  );
}

/**
 * AsOfPeriod — shorthand for `<AsOfText period=… />` when a figure belongs
 * to a period rather than a date. Example: `<AsOfPeriod period="Census 2011" />`.
 *
 * @prop period  Free-text period label (required).
 * @prop prefix  Default "As of". Pass "" to show the period on its own.
 */
export function AsOfPeriod({ period, prefix = "As of" }: { period: string; prefix?: string }) {
  return <AsOfText period={period} prefix={prefix} />;
}

// ─────────────────────────────────────────────────────────────────────
//  CountUp — a number that counts up once when 30 % of it is visible
// ─────────────────────────────────────────────────────────────────────

const NUM_RE = /^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/;

/** Split "₹1,830 Cr" into prefix / number / suffix, or null when not numeric. */
function parseCountable(text: string): { pre: string; n: number; post: string; decimals: number; grouped: boolean } | null {
  const m = NUM_RE.exec(text.trim());
  if (!m) return null;
  const raw = m[2];
  const n = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { pre: m[1], n, post: m[3], decimals, grouped: raw.includes(",") };
}

/**
 * CountUp — renders `value` exactly as given; after mount, when it scrolls
 * into view, it counts from 0 to the value in 800 ms (easeOutQuint-ish,
 * vault note 47). Non-numeric strings and reduced-motion render as-is.
 */
export function CountUp({ value }: { value: string | number }) {
  const text = String(value);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = React.useState<string | null>(null);
  React.useEffect(() => {
    const parsed = parseCountable(text);
    const el = ref.current;
    if (!parsed || !el || parsed.n === 0) return;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let started = false;
    const fmt = (v: number) => {
      const body = parsed.grouped
        ? v.toLocaleString("en-IN", { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })
        : v.toFixed(parsed.decimals);
      return `${parsed.pre}${body}${parsed.post}`;
    };
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 800);
        const eased = 1 - Math.pow(1 - k, 4);
        if (k < 1) {
          setFrame(fmt(parsed.n * eased));
          raf = requestAnimationFrame(tick);
        } else {
          setFrame(null);
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) {
          started = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text]);
  // Screen readers get the final value only; the counting digits are hidden.
  return (
    <span ref={ref}>
      <span aria-hidden={frame !== null ? true : undefined}>{frame ?? text}</span>
      {frame !== null && <span className="sr-only">{text}</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ModulePage · StaleNotice · PageHeader
// ─────────────────────────────────────────────────────────────────────

/**
 * The frame every module page sits in. Width and padding per device:
 *   phone (< 640)      full width, 16 px sides
 *   tablet (640–1023)  full width, 20 px sides
 *   laptop (1024–1439) up to 1320 px, 28 px sides
 *   PC (≥ 1440)        up to 1320 px, centred in the space next to the sidebar
 * Put grids inside with className="ftp-grid" (auto-fill columns, min 280 px;
 * set --ftp-grid-min for other sizes). See docs/LAYOUT.md.
 */
export function ModulePage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`module-page ftp-module-page${className ? ` ${className}` : ""}`}>{children}</div>;
}

/** Whole days between a date and now (never negative). */
function daysSince(d: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000));
}

/**
 * StaleNotice — the calm amber line that says, in plain words, that the data
 * on this page is old and that we looked for newer data and found none.
 *
 *   <StaleNotice asOf="2026-04-20" source={{ label: "IMD", href }} />
 *     → "This data is 160 days old. The newest data we have is from
 *        20 Apr 2026. We could not find newer data. Check the source ↗"
 *   <StaleNotice unknown />
 *     → "Date not published by the source."  (neutral grey-blue, not amber)
 *
 * Never red, never a banner across the page: it sits under the page title
 * (PageHeader renders it for you with `freshness.maxAgeDays`) or above a
 * card whose dataset is late. Renders nothing when `asOf` is missing and
 * `unknown` is not set.
 *
 * @prop asOf     Date of the newest data we have.
 * @prop unknown  The source publishes no date at all.
 * @prop source   Optional { label, href } — adds "Check the source" link.
 */
export function StaleNotice({
  asOf,
  unknown,
  source,
  className,
}: {
  asOf?: string | Date | null;
  unknown?: boolean;
  source?: { label: string; href?: string };
  className?: string;
}) {
  const tp = useTranslations("page_kit");
  const f = useFormat();
  const cls = ["ftp-stale", className].filter(Boolean).join(" ");
  if (unknown) {
    return (
      <p role="note" className={cls} data-kind="unknown" style={{ margin: 0 }}>
        <CircleHelp size={16} aria-hidden />
        <span>{tp("unknownDate")}</span>
      </p>
    );
  }
  const d = toDate(asOf);
  if (!d) return null;
  const date = d.toLocaleDateString(f.intl, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <p role="note" className={cls} data-kind="stale" style={{ margin: 0 }}>
      <Clock size={16} aria-hidden />
      <span suppressHydrationWarning>
        <strong>{tp("staleTitle", { days: daysSince(d) })}</strong> {tp("staleBody", { date })}
        {source?.href && (
          <>
            {" "}
            <a href={source.href} target="_blank" rel="noopener noreferrer" title={source.label}>
              {tp("staleSource")}
            </a>
          </>
        )}
      </span>
    </p>
  );
}

/**
 * PageHeader — the top of every module page (v5 "Calm").
 *
 * A calm pastel band: white washing into the module tint, a small chip with
 * the module emoji (the one place, with the sidebar and the overview tile,
 * where an emoji is allowed), the H1 in the deep module hue, one line of
 * description, then the freshness pill, source pill and actions. About
 * 120–150 px tall on a phone. No gradient slab, no watermark, no group chip.
 * The back link is drawn only on nested pages (a tender inside Tenders, a
 * taluk, admin): on a module's own page the sidebar and the phone module
 * bar already lead back to the overview.
 *
 * @prop icon        Lucide icon for the module (used when there is no emoji).
 * @prop title       Page title (the ONE h1 on the page).
 * @prop titleLocal  Local-script name from the dictionary (never machine-translated).
 * @prop description One short line of context.
 * @prop freshness   { asOf, status?, thresholdHours?, maxAgeDays? } — feeds a
 *                   FreshnessPill. thresholdHours = hours that still count as
 *                   "fresh" (green); default 24. `maxAgeDays` turns on the
 *                   StaleNotice: when the data is older than that many days
 *                   the calm amber notice appears under the band; when
 *                   `asOf` is explicitly `null` (loaded, but the source
 *                   gives no date) it says "Date not published by the source".
 *                   `undefined` (still loading) shows nothing.
 * @prop source      { label, href? } — feeds a SourcePill (and the notice link).
 * @prop actions     Buttons on the right (CSV, Share, Compare) — see Toolbar.
 * @prop emoji       Emoji for the chip. Defaults to the module's registry emoji.
 * @prop backHref    Where the back link goes (nested pages only, see above).
 * @prop backLabel   Text of the back link (default "Back to overview").
 * @prop accent      Kept for old call sites; colours come from the page hue.
 */
export function PageHeader({
  icon: Icon,
  title,
  titleLocal,
  description,
  backHref,
  backLabel,
  freshness,
  source,
  actions,
  accent: _accent = "brand",
  emoji,
  children,
}: {
  icon: LucideIcon;
  title: string;
  titleLocal?: string;
  description?: string;
  /** Back link target; drawn only on nested pages (not on a module's own page). */
  backHref?: string;
  backLabel?: string;
  freshness?: { asOf?: string | Date | null; status?: FreshnessStatus; thresholdHours?: number; maxAgeDays?: number };
  source?: { label: string; href?: string };
  actions?: React.ReactNode;
  /** v3 prop, kept for old call sites. Colours come from the page hue. */
  accent?: ModuleAccent;
  /** Emoji for the header chip. Defaults to the module's registry emoji. */
  emoji?: string;
  children?: React.ReactNode;
}) {
  void _accent;
  const t = useTranslations("kit");
  const mt = useModuleText();
  const pathname = usePathname();
  const slug = moduleFromPath(pathname);
  const meta = getModuleMeta(slug);
  // /<locale>/<state>/<district>/<module> is a module's own page: the sidebar
  // and the phone module bar already lead back, so no back link there.
  const depth = (pathname ?? "").split("/").filter(Boolean).length;
  const showBack = Boolean(backHref) && !(depth === 4 && slug !== "overview");
  const back = !backLabel || backLabel === "Back to overview" || backLabel === "Back to Overview" ? t("backToOverview") : backLabel;
  const chipEmoji = emoji ?? meta?.emoji;
  // Pages that pass the registry's English title/description get the
  // translated one automatically; anything else is shown as passed.
  const shownTitle = meta && title === meta.label ? mt.label(slug) : title;
  const shownDesc = meta && description === meta.description ? mt.description(slug) : description;
  // The regional-language name is hidden when it already IS the title
  // (e.g. the Kannada UI on a Karnataka page).
  const shownLocal = titleLocal && titleLocal !== shownTitle ? titleLocal : undefined;
  const hasMeta = Boolean(freshness?.asOf || source || actions || children);

  // Stale / unknown-date notice (only when the page opts in with maxAgeDays).
  let notice: React.ReactNode = null;
  if (freshness?.maxAgeDays !== undefined) {
    if (freshness.asOf === null) {
      notice = <StaleNotice unknown className="ftp-page-stale" />;
    } else {
      const d = toDate(freshness.asOf);
      if (d && daysSince(d) > freshness.maxAgeDays) {
        notice = <StaleNotice asOf={d} source={source} className="ftp-page-stale" />;
      }
    }
  }

  return (
    <header className="ftp-page-header">
      {showBack && backHref && (
        <Link href={backHref} className="ftp-page-back">
          <ArrowLeft size={14} aria-hidden />
          {back}
        </Link>
      )}
      {/* Grid: chip + title on the first row; description and pills under
          the title (full width on phones, so they wrap less). */}
      <div className="ftp-page-band ftp-rise">
        <span aria-hidden className="ftp-page-chip">
          {chipEmoji ? <span className="ftp-emoji">{chipEmoji}</span> : <Icon size={20} />}
        </span>
        <div className="ftp-page-titlerow">
          <h1 className="ftp-page-title">{shownTitle}</h1>
          {shownLocal && (
            <span lang={scriptLang(shownLocal)} className="ftp-page-local">
              {shownLocal}
            </span>
          )}
        </div>
        {shownDesc && <p className="ftp-page-desc">{shownDesc}</p>}
        {hasMeta && (
          <div className="ftp-page-meta">
            {freshness?.asOf && (
              <FreshnessPill asOf={freshness.asOf} status={freshness.status} thresholdHours={freshness.thresholdHours} />
            )}
            {source && <SourcePill label={source.label} href={source.href} />}
            {actions}
            {children}
          </div>
        )}
      </div>
      {notice}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  StatTile · StatStrip
// ─────────────────────────────────────────────────────────────────────

/**
 * StatTile — one big honest number on a white tile.
 *
 *   [icon] Label (12 px, sentence case)   ← optional small Lucide icon chip
 *   1,94,428  unit                        ← 28/34 tabular, deep module hue (24 on phone)
 *   sub line · trend arrow                ← 13 px text-2
 *   As of 12 Sep · SourcePill             ← only when provided
 *
 * v5: `emoji` is still accepted but draws the matching monochrome Lucide
 * icon (src/lib/design/emoji-icons.ts), or nothing — never the emoji.
 *
 * @prop label   Short name of the figure.
 * @prop value   The number (already formatted) or a string like "—".
 * @prop unit    Small unit after the value ("%", "mm", "₹ Cr").
 * @prop sub     One line under the number.
 * @prop asOf    Timestamp the value was true. Shown as "As of …".
 * @prop asOfPeriod  Free-text period instead of a date, e.g. "Census 2011"
 *                   or "FY 2024-25". Shown as "As of Census 2011".
 * @prop trend   up | down | neutral — rendered as an arrow glyph, never a coloured fill.
 * @prop icon    Optional Lucide icon beside the label.
 * @prop source  { label, href? } — a SourcePill under the number.
 */
export function StatTile({
  label,
  value,
  unit,
  sub,
  asOf,
  asOfPeriod,
  trend,
  icon: Icon,
  emoji,
  source,
  countUp = true,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  asOf?: string | Date | null;
  asOfPeriod?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  /** v4 prop. v5 draws the matching Lucide icon instead (or nothing); `icon` wins. */
  emoji?: string;
  source?: { label: string; href?: string };
  /** Count the number up when it scrolls into view (default true). */
  countUp?: boolean;
}) {
  const tk = useTranslations("kit");
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : trend === "neutral" ? Minus : null;
  const labelIcon = Icon ?? emojiIcon(emoji);
  return (
    <div
      style={{
        // v5: a plain white tile; the module hue shows only in the small
        // icon chip and the number.
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-tile)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "14px 16px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {labelIcon && (
          <span className="ftp-icon-chip" aria-hidden style={{ width: 26, height: 26, borderRadius: 8 }}>
            <KitIcon icon={labelIcon} size={14} />
          </span>
        )}
        <span style={LABEL}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span className="ftp-stat-value" style={{ color: "var(--hue-deep)" }}>
          {countUp ? <CountUp value={value} /> : value}
        </span>
        {unit && <span style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text-2)" }}>{unit}</span>}
      </div>
      {(sub || TrendIcon) && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {TrendIcon && (
            <>
              <TrendIcon size={14} aria-hidden style={{ color: "var(--hue-deep)" }} />
              <span className="sr-only">{trend === "up" ? tk("goingUp") : trend === "down" ? tk("goingDown") : tk("noChange")}</span>
            </>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
      {(asOf || asOfPeriod || source) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", minWidth: 0 }}>
          {(asOf || asOfPeriod) && <AsOfText asOf={asOf} period={asOfPeriod} />}
          {source && <SourcePill label={source.label} href={source.href} />}
        </div>
      )}
    </div>
  );
}

/**
 * StatStrip — a row of 2, 3 or 4 StatTiles on the 12-column grid.
 * Collapses to 2 × 2 on phones (CSS class `.ftp-stat-strip`).
 *
 * @prop cols  2 | 3 | 4. Defaults to the number of VISIBLE children, capped
 *             at 4. Conditional tiles written as `{x && <StatTile … />}` that
 *             render nothing (null / false / undefined) are not counted, so
 *             three real tiles give three columns, not four with a gap.
 */
export function StatStrip({ children, cols }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  // Children.toArray already drops null, undefined and true/false; we also skip "".
  const visible = React.Children.toArray(children).filter((child) => child !== "").length;
  const n = cols ?? (Math.min(4, Math.max(2, visible)) as 2 | 3 | 4);
  const style = { "--ftp-strip-cols": n } as React.CSSProperties;
  return (
    <div className="ftp-stat-strip" style={style}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Section · Card · CardGrid
// ─────────────────────────────────────────────────────────────────────

/**
 * SectionHeader — the title row of a Section on its own (H2 22/28 weight 500
 * + optional right-hand action). 24 px above, 12 px below.
 * Use `Section` when you also have children; use this when the content is
 * rendered separately (old pages do that via SectionLabel).
 */
export function SectionHeader({
  title,
  titleLocal,
  action,
  as = "h2",
  emoji,
}: {
  title: React.ReactNode;
  titleLocal?: string;
  action?: React.ReactNode;
  as?: "h2" | "h3";
  /** v4 prop, kept for old call sites. v5 headings carry no emoji and no icon. */
  emoji?: string;
}) {
  void emoji;
  const Tag = as;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "28px 0 12px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <Tag className="ftp-h2" style={{ margin: 0 }}>{title}</Tag>
        {titleLocal && <span lang={scriptLang(titleLocal)} style={{ fontSize: 18, lineHeight: "24px", fontWeight: 600, color: "var(--hue-deep)" }}>{titleLocal}</span>}
      </div>
      {action && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{action}</div>}
    </div>
  );
}

/**
 * Section — a titled block of a page: H2 + optional action link + content.
 *
 * @prop title       Section heading.
 * @prop titleLocal  Local-script heading, shown beside in text-2.
 * @prop action      Right-hand link/button (e.g. "View all →").
 * @prop id          Anchor id for in-page links.
 */
export function Section({
  title,
  titleLocal,
  action,
  id,
  emoji,
  children,
}: {
  title: React.ReactNode;
  titleLocal?: string;
  action?: React.ReactNode;
  id?: string;
  /** v4 prop, kept for old call sites. v5 headings carry no emoji (not drawn). */
  emoji?: string;
  children?: React.ReactNode;
}) {
  void emoji;
  return (
    <section id={id}>
      <SectionHeader title={title} titleLocal={titleLocal} action={action} />
      {children}
    </section>
  );
}

/**
 * Card — a white surface with a 1 px cool border, 14 px radius and a soft
 * shadow. When `href` is given it becomes a link: on hover it lifts 1 px and
 * its border takes the module hue. `tinted` gives a flat pastel wash.
 *
 * @prop padding  Inner padding in px (default 16).
 * @prop as       HTML tag when not a link ("div" | "article" | "section" | "li").
 */
export function Card({
  children,
  padding = 16,
  as = "div",
  href,
  style,
  className,
  tinted,
  ...rest
}: {
  children: React.ReactNode;
  padding?: number;
  as?: "div" | "article" | "section" | "li" | "aside";
  href?: string;
  style?: React.CSSProperties;
  className?: string;
  /** A flat pastel wash of the page hue with a soft hue border. */
  tinted?: boolean;
} & Omit<React.HTMLAttributes<HTMLElement>, "style" | "className">) {
  const base: React.CSSProperties = {
    background: tinted ? "color-mix(in srgb, var(--hue-tint) 65%, var(--ftp-surface))" : "var(--ftp-surface)",
    border: tinted ? "1px solid color-mix(in srgb, var(--hue) 16%, var(--ftp-border))" : "1px solid var(--ftp-border)",
    borderRadius: "var(--ftp-radius-card)",
    boxShadow: "var(--ftp-shadow-1)",
    padding,
    minWidth: 0,
    ...style,
  };
  if (href) {
    return (
      <Link href={href} className={["ftp-card-link", className].filter(Boolean).join(" ")} style={{ ...base, display: "block", textDecoration: "none", color: "inherit" }}>
        {children}
      </Link>
    );
  }
  return React.createElement(as, { style: base, className, ...rest }, children);
}

/**
 * CardGrid — a responsive grid of cards. Kept from v2 (same props).
 * @prop cols  Any CSS grid-template-columns value. Default auto-fills 200 px columns.
 */
export function CardGrid({
  children,
  cols = "repeat(auto-fill, minmax(200px, 1fr))",
}: {
  children: React.ReactNode;
  cols?: string;
}) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────
//  DataTable
// ─────────────────────────────────────────────────────────────────────

/** One column of a DataTable. */
export interface DataTableColumn {
  key: string;
  label: string;
  /** Render cells in JetBrains Mono, right-aligned (for numbers). */
  mono?: boolean;
  /** Alias of `mono` — clearer at call sites. */
  numeric?: boolean;
  align?: "right" | "left";
  /** Optional fixed width (CSS value). */
  width?: string | number;
}

/**
 * DataTable — zebra rows, 13 px text, mono numeric columns right-aligned,
 * sticky header, horizontal scroll on phones.
 *
 * @prop columns    Column definitions (see DataTableColumn).
 * @prop rows       Array of objects keyed by column key. Values may be React nodes.
 * @prop dense      Tighter row padding (6 px instead of 10 px).
 * @prop emptyText  Honest sentence shown when there are no rows.
 * @prop caption    Visually hidden <caption> for screen readers.
 */
export function DataTable({
  columns,
  rows,
  dense,
  emptyText,
  caption,
}: {
  columns: DataTableColumn[];
  rows: Record<string, React.ReactNode>[];
  dense?: boolean;
  emptyText?: string;
  caption?: string;
}) {
  const tk = useTranslations("kit");
  if (!rows.length) {
    return <EmptyState title={emptyText ?? tk("noRows")} />;
  }
  const pad = dense ? "6px 12px" : "10px 14px";
  return (
    <div
      className="data-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={caption ?? tk("table")}
      style={{
        overflowX: "auto",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 480 }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const right = col.align === "right" || col.numeric || col.mono;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{
                    ...LABEL,
                    color: "var(--hue-deep)",
                    padding: pad,
                    textAlign: right ? "right" : "left",
                    background: "var(--hue-tint)",
                    borderBottom: "1px solid color-mix(in srgb, var(--hue) 14%, var(--ftp-border))",
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="ftp-dt-row" style={{ background: i % 2 === 1 ? "color-mix(in srgb, var(--hue-tint) 40%, var(--ftp-surface))" : "transparent" }}>
              {columns.map((col) => {
                const num = col.numeric || col.mono;
                const right = col.align === "right" || num;
                return (
                  <td
                    key={col.key}
                    style={{
                      padding: pad,
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "var(--ftp-text)",
                      textAlign: right ? "right" : "left",
                      whiteSpace: num ? "nowrap" : undefined,
                      ...(num ? MONO : {}),
                    }}
                  >
                    {row[col.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ProgressBar · KpiRing
// ─────────────────────────────────────────────────────────────────────

/**
 * ProgressBar — a 6 px pastel track with a flat fill and a tabular value.
 *
 * @prop value / max  Fill = value ÷ max. Or pass `pct` directly (0–100).
 * @prop label        Text on the left of the value.
 * @prop tone         Fill colour: brand (default) | live | warn | danger | a ModuleAccent.
 * @prop color        DEPRECATED (v2). Any CSS colour string. Prefer `tone`.
 * @prop height       Track height in px (default 6).
 */
export function ProgressBar({
  value,
  max = 100,
  pct: pctProp,
  label,
  tone = "brand",
  color,
  height = 6,
}: {
  value?: number;
  max?: number;
  pct?: number;
  label?: string;
  tone?: Tone | ModuleAccent;
  color?: string;
  height?: number;
}) {
  const raw = pctProp !== undefined ? pctProp : max > 0 ? ((value ?? 0) / max) * 100 : 0;
  const pct = Math.max(0, Math.min(100, Math.round(raw)));
  // v5: the default ("brand") fill is the page hue, flat; semantic tones
  // (live / warn / danger) stay solid in their own colour.
  const fill =
    color ??
    (tone === "brand"
      ? "var(--hue)"
      : tone in TONE_SOLID
        ? TONE_SOLID[tone as Tone]
        : accentColor(tone as ModuleAccent));
  return (
    <div>
      {label !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
          <span>{label}</span>
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label ?? `${pct}%`}
        style={{ background: "color-mix(in srgb, var(--hue-pop) 35%, var(--ftp-surface-2))", borderRadius: "var(--ftp-radius-pill)", height, overflow: "hidden" }}
      >
        <div className="ftp-grow-x" style={{ background: fill, height: "100%", width: `${pct}%`, borderRadius: "var(--ftp-radius-pill)" }} />
      </div>
    </div>
  );
}

/**
 * KpiRing — the district health grade as a thin ring with the grade in mono.
 * Used on the district identity card only.
 *
 * @prop score  0–100. Drives how much of the ring is filled.
 * @prop grade  Letter grade shown in the middle, e.g. "C+".
 * @prop size   Diameter in px (default 64).
 * @prop label  Accessible label (default "District health score").
 */
export function KpiRing({
  score,
  grade,
  size = 64,
  label: labelProp,
}: {
  score: number;
  grade: string;
  size?: number;
  label?: string;
}) {
  const tKit = useTranslations("kit");
  const tp = useTranslations("page_kit");
  const label = labelProp ?? tp("healthScore");
  const stroke = Math.max(5, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      role="img"
      aria-label={`${label}: ${grade}, ${tKit("outOf100", { n: Math.round(pct) })}`}
      title={`${label}: ${Math.round(pct)}/100`}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
        <circle
          className="ftp-draw-path"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hue)"
          strokeWidth={stroke}
          style={{ ["--len" as string]: c }}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="ftp-bignum"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.32),
          color: "var(--hue-deep)",
        }}
      >
        {grade}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  States: LoadingShell · ErrorBlock · EmptyState
// ─────────────────────────────────────────────────────────────────────

/**
 * LoadingShell — flat skeleton rows while data loads. No gradient shimmer;
 * a gentle opacity fade that reduced-motion turns off.
 * @prop rows  Number of placeholder rows (default 4).
 */
export function LoadingShell({ rows = 4 }: { rows?: number }) {
  const tk = useTranslations("kit");
  return (
    <div aria-busy="true" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ftp-skeleton" style={{ height: 48, borderRadius: "var(--ftp-radius-tile)" }} />
      ))}
      <span className="sr-only">{tk("loading")}</span>
    </div>
  );
}

/**
 * ErrorBlock — a calm error card: icon in the danger colour, plain text,
 * optional retry button. No red background (semantic colour is text only).
 * @prop message  Sentence to show (default "Could not load this data.").
 * @prop onRetry  If given, renders a "Try again" button.
 */
export function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const tk = useTranslations("kit");
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "16px",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        fontSize: 13,
        lineHeight: "20px",
        color: "var(--ftp-text)",
      }}
    >
      <AlertCircle size={16} aria-hidden style={{ color: "var(--ftp-danger)", flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message ?? tk("loadError")}</span>
      {onRetry && (
        <ToolbarButton icon={RefreshCw} onClick={onRetry}>
          {tk("tryAgain")}
        </ToolbarButton>
      )}
    </div>
  );
}

/**
 * EmptyState — one honest sentence when there is nothing to show.
 * Example: title="No court data yet for Pune." body="We are working on the NJDG feed."
 * Never a fake zero, never a sad-face graphic.
 *
 * @prop title   The honest sentence.
 * @prop body    Optional second line (what is being done about it).
 * @prop action  Optional link or button.
 * @prop icon    Lucide icon for the chip (default Inbox).
 * @prop emoji   v4 prop: mapped to its Lucide icon (never drawn as an emoji).
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
  emoji,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  /** v4 prop. v5 draws the matching Lucide icon (default Inbox), never the emoji. */
  emoji?: string;
}) {
  const chipIcon = icon ?? emojiIcon(emoji) ?? Inbox;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "18px 20px",
        background: "color-mix(in srgb, var(--hue-tint) 45%, var(--ftp-surface))",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
      }}
    >
      <span className="ftp-icon-chip" aria-hidden style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)" }}>
        <KitIcon icon={chipIcon} size={18} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 15, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)", margin: 0 }}>{title}</p>
        {body && <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{body}</p>}
        {action && <div style={{ marginTop: 12 }}>{action}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Chips · Toolbar · SourcesFooter
// ─────────────────────────────────────────────────────────────────────

/** One filter chip. */
export interface ChipItem {
  value: string;
  label: string;
  /** Optional count shown in mono after the label. */
  count?: number;
}

/**
 * Chips — a row of filter chips (34 px tall, 44 px on phones, 12 px radius).
 * The active chip is pastel: the module tint, deep-hue text and a hue
 * border. The rest are white with a thin border (tint on hover).
 *
 * @prop items     [{ value, label, count? }]
 * @prop value     Currently selected value.
 * @prop onChange  Called with the new value.
 * @prop label     Accessible group label (default "Filter").
 */
export function Chips({
  items,
  value,
  onChange,
  label,
}: {
  items: ChipItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const tk = useTranslations("kit");
  const groupLabel = label ?? tk("filter");
  return (
    <div role="group" aria-label={groupLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className="ftp-chip"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 34,
              padding: "0 12px",
              borderRadius: "var(--ftp-radius-tile)",
              border: `1px solid ${active ? "var(--hue)" : "var(--ftp-border)"}`,
              background: active ? "var(--hue-tint)" : "var(--ftp-surface)",
              color: active ? "var(--hue-deep)" : "var(--ftp-text)",
              transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
              fontFamily: "var(--ftp-font-sans)",
              fontSize: 13,
              lineHeight: "20px",
              fontWeight: active ? 650 : 500,
              cursor: "pointer",
            }}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ftp-num" style={{ fontSize: 12, color: active ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ToolbarButton — the secondary (quiet) button: 32 px, bordered, surface
 * background, 13 px text, optional 14 px Lucide icon. Renders a <Link> when
 * `href` is given, a real <button> otherwise.
 *
 * On phones (< 768 px) it grows to 44 px tall for a comfortable touch
 * target. That comes from the `.ftp-btn` class in globals.css (a media
 * query), because inline styles cannot contain media queries.
 */
/** Classes on every quiet button: `.ftp-btn` = 44 px tall on phones, `.ftp-btn-secondary` = hover. */
const BTN_SECONDARY_CLASS = "ftp-btn ftp-btn-secondary";

export function ToolbarButton({
  icon: Icon,
  children,
  onClick,
  href,
  download,
  external,
  disabled,
  ariaLabel,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  download?: boolean | string;
  external?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 34,
    padding: "0 12px",
    borderRadius: "var(--ftp-radius-tile)",
    border: "1px solid var(--ftp-border)",
    background: "var(--ftp-surface)",
    color: "var(--ftp-text)",
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 13,
    lineHeight: "20px",
    fontWeight: 500,
    textDecoration: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
  const inner = (
    <>
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </>
  );
  if (href && !disabled) {
    if (external || download) {
      return (
        <a href={href} download={download} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={BTN_SECONDARY_CLASS} style={style} aria-label={ariaLabel}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={BTN_SECONDARY_CLASS} style={style} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={BTN_SECONDARY_CLASS} style={style} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/**
 * PrimaryButton — the ONE main button on a screen ("Explore all of India",
 * "Open my district"). Filled brand blue with white text (5.2 : 1),
 * radius 12, 40 px tall on desktop and 44 px on phones (`.ftp-btn`).
 * Hover darkens to `--ftp-brand-deep` (`.ftp-btn-brand` in globals.css —
 * the fill lives in the class, not inline, so the hover can win).
 *
 * Renders a Next.js <Link> when `href` is given, a real <button> otherwise.
 * Use ToolbarButton for everything secondary; keep one PrimaryButton per view.
 *
 * @prop icon       Optional Lucide icon, 16 px, before the label.
 * @prop href       Internal path (uses <Link>) or, with `external`, any URL.
 * @prop external   Open `href` in a new tab (plain <a>, rel="noopener noreferrer").
 * @prop onClick    Click handler when it is a <button>.
 * @prop type       Button type inside a form: "button" (default) | "submit".
 * @prop disabled   Greys it out; a disabled link renders as a disabled button.
 * @prop ariaLabel  Accessible name when the visible text is not enough.
 * @prop fullWidth  Stretch to the width of the parent (handy on phones).
 */
export function PrimaryButton({
  icon: Icon,
  children,
  href,
  external,
  onClick,
  type = "button",
  disabled,
  ariaLabel,
  fullWidth,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
  fullWidth?: boolean;
}) {
  const style: React.CSSProperties = {
    display: fullWidth ? "flex" : "inline-flex",
    width: fullWidth ? "100%" : undefined,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: "var(--ftp-radius-tile)",
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  const className = "ftp-btn ftp-btn-brand";
  const inner = (
    <>
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </>
  );
  if (href && !disabled) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} aria-label={ariaLabel}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={className} style={style} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/**
 * Toolbar — a quiet row for CSV / Share / Compare buttons (ToolbarButton).
 * Put it at the end of a module page, after the SourcesFooter.
 */
export function Toolbar({ children, label }: { children: React.ReactNode; label?: string }) {
  const tp = useTranslations("page_kit");
  return (
    <div role="toolbar" aria-label={label ?? tp("pageActions")} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "24px 0 0" }}>
      {children}
    </div>
  );
}

/** One data source line in SourcesFooter. */
export interface SourceEntry {
  name: string;
  url?: string | null;
  licence?: string;
  frequency?: string;
}

/**
 * SourcesFooter — collapsible "Sources" list for the bottom of every module
 * page. Feed it from getModuleSources() or a hand-written list.
 *
 * @prop sources         [{ name, url?, licence?, frequency? }]
 * @prop methodologyHref Optional link to the methodology page.
 * @prop defaultOpen     Start expanded (default false).
 */
export function SourcesFooter({
  sources,
  methodologyHref,
  defaultOpen = false,
}: {
  sources: SourceEntry[];
  methodologyHref?: string;
  defaultOpen?: boolean;
}) {
  const tk = useTranslations("kit");
  if (!sources.length) return null;
  return (
    <details
      open={defaultOpen}
      style={{
        marginTop: 32,
        borderTop: "1px solid var(--ftp-border)",
        paddingTop: 12,
      }}
    >
      <summary style={{ ...LABEL, cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
        {tk("sources")}
        <span className="ftp-num" style={{ textTransform: "none", letterSpacing: 0 }}>({sources.length})</span>
      </summary>
      <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {sources.map((s, i) => (
          <li key={i} style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ftp-brand)", textDecoration: "none" }}>
                {s.name}
              </a>
            ) : (
              <span>{s.name}</span>
            )}
            {(s.licence || s.frequency) && (
              <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>
                {[s.licence, s.frequency].filter(Boolean).join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
      {methodologyHref && (
        <Link href={methodologyHref} style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}>
          {tk("howComputed")}
        </Link>
      )}
    </details>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  InfoCard · AIInsightBanner · SeverityBadge · CacheBadge · LastUpdated
// ─────────────────────────────────────────────────────────────────────

/**
 * InfoCard — a Card with a title row (title 15/22, subtitle 13 text-2,
 * optional Pill badge and right-hand action) above free content.
 *
 * @prop badgeTone  Tone of the badge Pill (default "brand").
 * @prop badgeColor DEPRECATED (v2 hex). Ignored — use badgeTone.
 */
export function InfoCard({
  title,
  subtitle,
  badge,
  badgeTone = "brand",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  badgeColor,
  children,
  action,
  href,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: Tone;
  badgeColor?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
}) {
  return (
    <Card href={href}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: subtitle || children ? 10 : 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, lineHeight: "22px", fontWeight: 500, color: "var(--ftp-text)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {badge && <Pill tone={badgeTone}>{badge}</Pill>}
          {action}
        </div>
      </div>
      {children}
    </Card>
  );
}

/**
 * AIInsightBanner — a summary written by the AI news pipeline. Same props as
 * v2. Restyled as a plain Card: Sparkles icon in the features accent, a
 * sentiment Pill, mono confidence, the date, and a two-line clamp with
 * "Read more". No stripe, no tinted background, no emoji.
 */
export function AIInsightBanner({
  headline,
  summary,
  sentiment,
  confidence,
  sourceUrls,
  createdAt,
}: {
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  sourceUrls?: string[];
  createdAt?: string;
}) {
  const tp = useTranslations("page_kit");
  const [expanded, setExpanded] = React.useState(false);
  const tone: Tone = sentiment === "positive" ? "live" : sentiment === "negative" ? "danger" : "neutral";
  const confidencePct = Math.round(confidence * 100);
  const created = toDate(createdAt);

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-features-tint)",
            color: "var(--ftp-features)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={LABEL}>{tp("aiSummary")}</span>
            <Pill tone={tone}>{tp(`sentiment.${sentiment}`)}</Pill>
            <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{tp("confidence", { n: confidencePct })}</span>
            {created && (
              <span style={{ marginLeft: "auto" }}>
                <AsOfText asOf={created} prefix={tp("written")} />
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, lineHeight: "22px", fontWeight: 500, color: "var(--ftp-text)", marginBottom: 4 }}>{headline}</div>
          <p
            style={{
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--ftp-text-2)",
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {summary}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-brand)", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--ftp-font-sans)" }}
            >
              {expanded ? tp("showLess") : tp("readMore")}
            </button>
            {expanded && sourceUrls && sourceUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sourceUrls.slice(0, 3).map((url, i) => (
                  <SourcePill key={i} label={tp("sourceN", { n: i + 1 })} href={url} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * SeverityBadge — alert severity as a Pill.
 * critical → danger · high → warn · medium → brand · low → live · info → neutral.
 */
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, Tone> = { critical: "danger", high: "warn", medium: "brand", info: "neutral", low: "live" };
  const tone = map[severity.toLowerCase()] ?? "neutral";
  return <Pill tone={tone}>{severity}</Pill>;
}

/** CacheBadge — tiny "Cached" marker shown when a response came from cache. */
export function CacheBadge({ fromCache }: { fromCache?: boolean }) {
  const tp = useTranslations("page_kit");
  if (!fromCache) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
      <RefreshCw size={11} aria-hidden />
      {tp("cached")}
    </span>
  );
}

/**
 * LastUpdated — FreshnessPill plus an optional real refresh button.
 * @prop updatedAt  ISO timestamp.
 * @prop onRefetch  If given, renders a 24 px "Refresh" icon button.
 */
export function LastUpdated({ updatedAt, onRefetch }: { updatedAt?: string | null; onRefetch?: () => void }) {
  const tp = useTranslations("page_kit");
  if (!updatedAt) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <FreshnessPill asOf={updatedAt} />
      {onRefetch && (
        <button
          type="button"
          onClick={onRefetch}
          aria-label={tp("refresh")}
          title={tp("refresh")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "var(--ftp-radius-pill)",
            border: "1px solid var(--ftp-border)",
            background: "var(--ftp-surface)",
            color: "var(--ftp-text-2)",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} aria-hidden />
        </button>
      )}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  LEGACY WRAPPERS (v2 names). Keep pages compiling; migrate when touched.
// ═════════════════════════════════════════════════════════════════════

/**
 * ModuleHeader (v2) → PageHeader.
 * `liveTag` is accepted but IGNORED: v3 never shows "Live" without a date.
 * Pass `freshness={{ asOf }}` to PageHeader instead. Children become actions.
 */
export function ModuleHeader({
  icon,
  title,
  description,
  backHref,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  liveTag,
  children,
  freshness,
  source,
  titleLocal,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref: string;
  liveTag?: boolean;
  children?: React.ReactNode;
  freshness?: { asOf?: string | Date | null; status?: FreshnessStatus; thresholdHours?: number };
  source?: { label: string; href?: string };
  titleLocal?: string;
  accent?: ModuleAccent;
}) {
  return (
    <PageHeader
      icon={icon}
      title={title}
      titleLocal={titleLocal}
      description={description}
      backHref={backHref}
      backLabel="Back to Overview"
      freshness={freshness}
      source={source}
      accent={accent}
      actions={children}
    />
  );
}

/**
 * StatCard (v2) → StatTile. `accent` (a v2 hex string) is ignored — tiles
 * carry no colour; `icon`, `sub` and `trend` pass straight through.
 */
export function StatCard({
  label,
  value,
  sub,
  icon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accent,
  trend,
  asOf,
  unit,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: string;
  trend?: "up" | "down" | "neutral";
  asOf?: string | Date | null;
  unit?: string;
}) {
  return <StatTile label={label} value={value} sub={sub} icon={icon} trend={trend} asOf={asOf} unit={unit} />;
}

/**
 * SectionLabel (v2) → SectionHeader row (H2 22/28 + optional action).
 * Content that used to follow a SectionLabel keeps following it unchanged.
 */
export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <SectionHeader title={children} action={action} />;
}

/**
 * EmptyBlock (v2) → EmptyState. The v2 `icon` (an emoji string) is mapped to
 * its Lucide icon like every other kit emoji (v5).
 */
export function EmptyBlock({
  message,
  icon,
  body,
  action,
}: {
  message?: string;
  icon?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const tp = useTranslations("page_kit");
  return <EmptyState title={message ?? tp("noDataYet")} body={body} action={action} emoji={icon} />;
}

/**
 * LiveBadge (v2) → FreshnessPill. Shows the live dot only when `asOf` is
 * under 30 minutes old, otherwise "As of <date>". With no `asOf` it renders
 * NOTHING — the old unconditional green "LIVE" is gone on purpose.
 */
export function LiveBadge({ asOf, status }: { asOf?: string | Date | null; status?: FreshnessStatus }) {
  if (!asOf) return null;
  return <FreshnessPill asOf={asOf} status={status} />;
}

/** LastUpdatedBadge (v2) → FreshnessPill. */
export function LastUpdatedBadge({ lastUpdated }: { lastUpdated?: string | null }) {
  if (!lastUpdated) return null;
  return <FreshnessPill asOf={lastUpdated} />;
}

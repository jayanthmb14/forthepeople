/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  District UI kit — Design v3 "Civic Ledger"  (CONCEPT-v3 §4)
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
//    • No shadows, no gradients, no emoji. Icons are Lucide, 16/18/20 px.
//    • Three radii only: 12 px (card), 8 px (tile), 999 px (pill).
//    • Text is Plus Jakarta Sans 400/500 (600 only for a page H1).
//      Numbers are always JetBrains Mono 500 with tabular figures.
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
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
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

/** 10 % tint of an accent, for the 40 px icon square behind it. */
function accentTint(accent: ModuleAccent = "brand"): string {
  return accent === "brand"
    ? "var(--ftp-brand-tint)"
    : `color-mix(in srgb, var(--accent-${accent}-700) 10%, transparent)`;
}

const MONO: React.CSSProperties = {
  fontFamily: "var(--ftp-font-mono)",
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  lineHeight: "16px",
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ftp-text-2)",
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Sep" or "12 Sep 2025" when the year differs from today. */
function shortDate(d: Date): string {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Asia/Kolkata",
  });
}

/** Exact IST timestamp for tooltips: "12 Sep 2026, 14:05 IST". */
export function formatIST(value: string | Date | null | undefined): string | null {
  const d = toDate(value);
  if (!d) return null;
  return (
    d.toLocaleString("en-IN", {
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
  if (!info) return null;
  return (
    <Pill tone={info.tone} dot={info.isLive} pulse={info.isLive} title={`Exact: ${info.exact}`}>
      <span suppressHydrationWarning>{info.label}</span>
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
    ...MONO,
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
    <a href={href} target="_blank" rel="noopener noreferrer" style={base} title={`Source: ${label}`}>
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
  prefix = "As of",
}: {
  asOf?: string | Date | null;
  period?: string | null;
  prefix?: string;
}) {
  const d = toDate(asOf);
  const style: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" };
  const label = period?.trim();
  if (label) {
    return (
      <span title={d ? `Fetched: ${formatIST(d)}` : undefined} style={style}>
        {prefix ? `${prefix} ` : ""}
        {label}
      </span>
    );
  }
  if (!d) return null;
  return (
    <span title={`Exact: ${formatIST(d)}`} style={style}>
      <span suppressHydrationWarning>{prefix} {shortDate(d)}</span>
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
//  PageHeader
// ─────────────────────────────────────────────────────────────────────

/**
 * PageHeader — the top of every module page. Replaces ModuleHeader.
 *
 * Layout: back link → [40 px tinted icon] [H1 22/28 + local-script name]
 *                     [description 13/20] … right: FreshnessPill · SourcePill · actions
 *
 * @prop icon        Lucide icon for the module.
 * @prop title       Page title (the ONE h1 on the page).
 * @prop titleLocal  Local-script name from the dictionary (never machine-translated).
 * @prop description One short line of context.
 * @prop backHref    Where the back link goes (usually the district overview).
 * @prop backLabel   Text of the back link (default "Back to overview").
 * @prop freshness   { asOf, status?, thresholdHours? } — feeds a FreshnessPill.
 *                   thresholdHours = how many hours still count as "fresh"
 *                   (green) for this module; default 24. A weekly feed
 *                   might pass 168 so it is not amber on day two.
 * @prop source      { label, href? } — feeds a SourcePill.
 * @prop actions     Buttons on the right (CSV, Share, Compare) — see Toolbar.
 * @prop accent      Module accent for the icon tint (see ModuleAccent).
 */
export function PageHeader({
  icon: Icon,
  title,
  titleLocal,
  description,
  backHref,
  backLabel = "Back to overview",
  freshness,
  source,
  actions,
  accent = "brand",
  children,
}: {
  icon: LucideIcon;
  title: string;
  titleLocal?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  freshness?: { asOf?: string | Date | null; status?: FreshnessStatus; thresholdHours?: number };
  source?: { label: string; href?: string };
  actions?: React.ReactNode;
  accent?: ModuleAccent;
  children?: React.ReactNode;
}) {
  return (
    <header style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 20, marginBottom: 24 }}>
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--ftp-text-2)",
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={14} aria-hidden />
          {backLabel}
        </Link>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--ftp-radius-tile)",
            background: accentTint(accent),
            color: accentColor(accent),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, lineHeight: "28px", fontWeight: 500, color: "var(--ftp-text)", margin: 0 }}>
              {title}
            </h1>
            {titleLocal && (
              <span lang="und" style={{ fontSize: 22, lineHeight: "28px", fontWeight: 400, color: "var(--ftp-text-2)" }}>
                {titleLocal}
              </span>
            )}
          </div>
          {description && (
            <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "2px 0 0" }}>{description}</p>
          )}
        </div>
        {(freshness || source || actions || children) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {freshness && (
              <FreshnessPill asOf={freshness.asOf} status={freshness.status} thresholdHours={freshness.thresholdHours} />
            )}
            {source && <SourcePill label={source.label} href={source.href} />}
            {actions}
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  StatTile · StatStrip
// ─────────────────────────────────────────────────────────────────────

/**
 * StatTile — one big honest number.
 *
 *   LABEL (11 px uppercase)          ← optional 13 px icon on the left
 *   1,94,428  unit                   ← mono 28/32 (24 on phone)
 *   sub line · trend arrow           ← 13 px text-2
 *   As of 12 Sep · SourcePill        ← only when provided
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
  source,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  asOf?: string | Date | null;
  asOfPeriod?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  source?: { label: string; href?: string };
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : trend === "neutral" ? Minus : null;
  return (
    <div
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-tile)",
        padding: "14px 16px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={13} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />}
        <span style={LABEL}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span className="ftp-num ftp-stat-value" style={{ color: "var(--ftp-text)", letterSpacing: "-0.01em" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{unit}</span>}
      </div>
      {(sub || TrendIcon) && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {TrendIcon && <TrendIcon size={14} aria-label={trend} />}
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
}: {
  title: React.ReactNode;
  titleLocal?: string;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}) {
  const Tag = as;
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "24px 0 12px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <Tag className="ftp-h2" style={{ margin: 0 }}>{title}</Tag>
        {titleLocal && <span style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text-2)" }}>{titleLocal}</span>}
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
  children,
}: {
  title: React.ReactNode;
  titleLocal?: string;
  action?: React.ReactNode;
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id}>
      <SectionHeader title={title} titleLocal={titleLocal} action={action} />
      {children}
    </section>
  );
}

/**
 * Card — a surface with a 1 px border and 12 px radius. No shadow.
 * When `href` is given it becomes a link and its border darkens on hover
 * (150 ms). That hover is the only motion a card is allowed.
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
  ...rest
}: {
  children: React.ReactNode;
  padding?: number;
  as?: "div" | "article" | "section" | "li" | "aside";
  href?: string;
  style?: React.CSSProperties;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "style" | "className">) {
  const base: React.CSSProperties = {
    background: "var(--ftp-surface)",
    border: "1px solid var(--ftp-border)",
    borderRadius: "var(--ftp-radius-card)",
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
  if (!rows.length) {
    return <EmptyState title={emptyText ?? "No rows to show yet."} />;
  }
  const pad = dense ? "6px 12px" : "10px 14px";
  return (
    <div
      className="data-table-scroll"
      style={{
        overflowX: "auto",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
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
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    padding: pad,
                    textAlign: right ? "right" : "left",
                    background: "var(--ftp-surface)",
                    borderBottom: "1px solid var(--ftp-border)",
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
            <tr key={i} style={{ background: i % 2 === 1 ? "var(--ftp-surface-2)" : "transparent" }}>
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
 * ProgressBar — a 6 px track with a flat fill and a mono value.
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
  const fill =
    color ??
    (tone in TONE_SOLID ? TONE_SOLID[tone as Tone] : accentColor(tone as ModuleAccent));
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
        aria-label={label}
        style={{ background: "var(--ftp-surface-2)", borderRadius: "var(--ftp-radius-pill)", height, overflow: "hidden" }}
      >
        <div style={{ background: fill, height: "100%", width: `${pct}%`, borderRadius: "var(--ftp-radius-pill)" }} />
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
  label = "District health score",
}: {
  score: number;
  grade: string;
  size?: number;
  label?: string;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      role="img"
      aria-label={`${label}: ${grade}, ${Math.round(pct)} out of 100`}
      title={`${label}: ${Math.round(pct)}/100`}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ftp-surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ftp-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="ftp-num"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.3),
          color: "var(--ftp-text)",
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
  return (
    <div aria-busy="true" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ftp-skeleton" style={{ height: 48, borderRadius: "var(--ftp-radius-tile)" }} />
      ))}
      <span className="sr-only">Loading</span>
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
      <span style={{ flex: 1 }}>{message ?? "Could not load this data. Please refresh the page."}</span>
      {onRetry && (
        <ToolbarButton icon={RefreshCw} onClick={onRetry}>
          Try again
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
 */
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
      }}
    >
      <p style={{ fontSize: 15, lineHeight: "22px", fontWeight: 500, color: "var(--ftp-text)", margin: 0 }}>{title}</p>
      {body && <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "4px 0 0" }}>{body}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
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
 * Chips — a row of filter chips (32 px tall, 44 px on phones). The active
 * chip uses the brand tint; the rest are bordered surface pills.
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
  label = "Filter",
}: {
  items: ChipItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
              padding: "0 12px",
              borderRadius: "var(--ftp-radius-pill)",
              border: `1px solid ${active ? "var(--ftp-brand)" : "var(--ftp-border)"}`,
              background: active ? "var(--ftp-brand-tint)" : "var(--ftp-surface)",
              color: active ? "var(--ftp-brand-deep)" : "var(--ftp-text)",
              fontFamily: "var(--ftp-font-sans)",
              fontSize: 13,
              lineHeight: "20px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ftp-num" style={{ fontSize: 11, color: active ? "var(--ftp-brand-deep)" : "var(--ftp-text-2)" }}>
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
    height: 32,
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
 * PrimaryButton — the ONE loud button on a screen ("Open my district",
 * "Support this project"). Filled brand blue with `--ftp-surface` text,
 * radius 8, 40 px tall on desktop and 44 px on phones (`.ftp-btn`).
 * Hover darkens to `--ftp-brand-deep` (150 ms, `.ftp-btn-primary`).
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
    border: "1px solid var(--ftp-brand)",
    background: "var(--ftp-brand)",
    color: "var(--ftp-surface)",
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  const className = "ftp-btn ftp-btn-primary";
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
export function Toolbar({ children, label = "Page actions" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="toolbar" aria-label={label} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "24px 0 0" }}>
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
        Sources
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
          How we compute these numbers
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
            <span style={LABEL}>AI summary</span>
            <Pill tone={tone}>{sentiment}</Pill>
            <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{confidencePct}% confidence</span>
            {created && (
              <span style={{ marginLeft: "auto" }}>
                <AsOfText asOf={created} prefix="Written" />
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
              {expanded ? "Show less" : "Read more"}
            </button>
            {expanded && sourceUrls && sourceUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sourceUrls.slice(0, 3).map((url, i) => (
                  <SourcePill key={i} label={`Source ${i + 1}`} href={url} />
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
  if (!fromCache) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
      <RefreshCw size={11} aria-hidden />
      Cached
    </span>
  );
}

/**
 * LastUpdated — FreshnessPill plus an optional real refresh button.
 * @prop updatedAt  ISO timestamp.
 * @prop onRefetch  If given, renders a 24 px "Refresh" icon button.
 */
export function LastUpdated({ updatedAt, onRefetch }: { updatedAt?: string | null; onRefetch?: () => void }) {
  if (!updatedAt) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <FreshnessPill asOf={updatedAt} />
      {onRefetch && (
        <button
          type="button"
          onClick={onRefetch}
          aria-label="Refresh data"
          title="Refresh data"
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
 * EmptyBlock (v2) → EmptyState. The v2 `icon` (an emoji string) is dropped.
 */
export function EmptyBlock({
  message,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon,
  body,
  action,
}: {
  message?: string;
  icon?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return <EmptyState title={message ?? "No data yet for this district."} body={body} action={action} />;
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

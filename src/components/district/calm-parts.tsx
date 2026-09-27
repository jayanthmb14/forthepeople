/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Calm parts (v5) for the module pages: small pieces with no emoji
// ═══════════════════════════════════════════════════════════════════════
//    IconPictogram  10 simple line icons in the page hue, N lit ("8 of
//                   every 10 rupees were used"). Same meaning as the kit
//                   Pictogram, drawn with a lucide icon instead of emoji.
//    CalmNote       a soft note box with an optional small icon; "warn"
//                   is the calm amber used for old data.
//    StaleNote      "This is 160 days old. We could not find newer data."
//                   or "Date not published by the source." — only when
//                   the data is older than the page's own limit.
//    daysSince      whole days between a date and now (null when unknown).
//  Words come from "page_modules-a"; colours from the page hue and the
//  --ftp-warn tokens.
"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/** Whole days since `value` (0 for today), or null when there is no valid date. */
export function daysSince(value: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((now.getTime() - ms) / 86_400_000));
}

/** `total` icons in a row, the first `filled` lit in the page hue (fractions light part of one). */
export function IconPictogram({
  filled,
  total = 10,
  icon: Icon,
  label,
  size = 22,
}: {
  filled: number;
  total?: number;
  icon: LucideIcon;
  /** Sentence shown under the row and read by screen readers. */
  label: string;
  size?: number;
}) {
  const f = Math.max(0, Math.min(total, filled));
  return (
    <figure style={{ margin: 0 }}>
      <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => {
          const lit = Math.max(0, Math.min(1, f - i));
          return (
            <span
              key={i}
              style={{
                position: "relative",
                display: "inline-flex",
                width: size + 14,
                height: size + 14,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                background: lit > 0 ? "var(--hue-tint)" : "var(--ftp-surface-2)",
              }}
            >
              <Icon size={size} strokeWidth={1.75} style={{ color: "var(--ftp-border-strong)" }} />
              {lit > 0 && (
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", clipPath: `inset(0 ${Math.round((1 - lit) * 100)}% 0 0)` }}>
                  <Icon size={size} strokeWidth={1.75} style={{ color: "var(--hue-deep)" }} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{label}</figcaption>
    </figure>
  );
}

/** A soft note box. `tone="warn"` is the calm amber for old or unconfirmed data. */
export function CalmNote({
  children,
  icon: Icon,
  tone = "hue",
  style,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "hue" | "warn" | "quiet";
  style?: React.CSSProperties;
}) {
  const palette =
    tone === "warn"
      ? { bg: "var(--ftp-warn-tint)", border: "color-mix(in srgb, var(--ftp-warn) 28%, transparent)", icon: "var(--ftp-warn)" }
      : tone === "quiet"
        ? { bg: "var(--ftp-surface-2)", border: "var(--ftp-border)", icon: "var(--ftp-text-2)" }
        : { bg: "var(--hue-tint)", border: "color-mix(in srgb, var(--hue) 20%, transparent)", icon: "var(--hue-deep)" };
  return (
    <div
      role="note"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: 12,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        fontSize: 14,
        lineHeight: "21px",
        color: "var(--ftp-text)",
        ...style,
      }}
    >
      {Icon && <Icon size={16} aria-hidden style={{ color: palette.icon, flexShrink: 0, marginTop: 2 }} />}
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

/**
 * The honest age line for one dataset. Renders nothing while the data is
 * within `maxAgeDays`; past it, a calm amber note with the age in days.
 * `asOf` null → "Date not published by the source" (only when `showUnknown`).
 */
export function StaleNote({
  asOf,
  maxAgeDays,
  showUnknown = false,
  style,
}: {
  asOf: string | Date | null | undefined;
  maxAgeDays: number;
  showUnknown?: boolean;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("page_modules-a");
  const days = daysSince(asOf);
  if (days === null) {
    return showUnknown ? (
      <CalmNote tone="quiet" icon={Clock} style={style}>
        {t("stale.noDate")}
      </CalmNote>
    ) : null;
  }
  if (days <= maxAgeDays) return null;
  return (
    <CalmNote tone="warn" icon={Clock} style={style}>
      <strong>{t("stale.old", { n: days })}</strong> {t("stale.noNewer")}
    </CalmNote>
  );
}

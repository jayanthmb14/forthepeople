/**
 * ModulePreviewCard — one module on the super-category page grid.
 *
 * Emoji chip, translated title and tagline, a Live / Soon pill, and the
 * module's headline figure when IndiaIndicator has one (with its label and
 * date). Before Sep 2026 the card printed the registry's placeholder
 * `mockValue` as if it were a real number; with no published row the card
 * now says so instead.
 *
 * Server-safe; strings arrive translated from the page.
 */

import * as React from "react";
import Link from "next/link";

export interface ModulePreviewFigure {
  value: string;
  unit?: string;
  /** "Tigers in the wild, as of 9 Apr 2023" — already translated. */
  caption: string;
}

export interface ModulePreviewCardProps {
  href: string;
  emoji: string;
  title: string;
  tagline: string;
  isLive: boolean;
  statusLabel: string;
  figure?: ModulePreviewFigure;
  noFigureLabel: string;
}

export function ModulePreviewCard({
  href,
  emoji,
  title,
  tagline,
  isLive,
  statusLabel,
  figure,
  noFigureLabel,
}: ModulePreviewCardProps) {
  return (
    <Link
      href={href}
      className="ftp-card-link"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 7%, #fff) 0%, #fff 70%)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "16px 18px",
        textDecoration: "none",
        color: "var(--ftp-text)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 21, borderRadius: 13 }}>
          {emoji}
        </span>
        <span className="ftp-display" style={{ flex: 1, fontSize: 16, fontWeight: 650, lineHeight: 1.3 }}>
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: isLive ? "#E9F6EE" : "#FAEEDA",
            color: isLive ? "#14532D" : "#854F0B",
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {figure ? (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span className="ftp-bignum" style={{ fontSize: 26, lineHeight: 1.1, color: "var(--hue-deep)" }}>
              {figure.value}
            </span>
            {figure.unit ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ftp-text-2)" }}>{figure.unit}</span> : null}
          </div>
          <div style={{ fontSize: 12, color: "var(--ftp-text-2)", marginTop: 2 }}>{figure.caption}</div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--ftp-text-2)", fontStyle: "italic" }}>{noFigureLabel}</div>
      )}

      <p style={{ fontSize: 13, color: "var(--ftp-text-2)", margin: 0, lineHeight: 1.5 }}>{tagline}</p>
    </Link>
  );
}

export default ModulePreviewCard;

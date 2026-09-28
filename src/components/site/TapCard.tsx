/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  TapCard — a card you tap to open its DetailSheet (site pages)
// ═══════════════════════════════════════════════════════════════════════
//  Looks like the kit Card (surface, 1 px border, card radius, lift on
//  hover) but is a real <button>, so it works with the keyboard and tells
//  screen readers that it opens a dialog. A chevron on the end says "there
//  is more inside". Colour comes from the surrounding hue class.
//
//    <TapCard onClick={() => setOpen(item)} label={t("openDetails", { name })}>
//      …card body…
//    </TapCard>

import React from "react";
import { ChevronRight } from "lucide-react";

export default function TapCard({
  onClick,
  label,
  tinted,
  padding = 14,
  highlighted,
  style,
  children,
}: {
  onClick: () => void;
  /** Accessible name, e.g. "Details of Hosahalli". Defaults to the visible text. */
  label?: string;
  /** A soft wash of the page hue. */
  tinted?: boolean;
  padding?: number;
  /** Hue border + wash (the chosen / preselected item). */
  highlighted?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const wash = tinted || highlighted;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={label}
      className="ftp-card-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: "100%",
        minHeight: 48,
        padding,
        textAlign: "start",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        // v5.2 "White Calm": always white; `wash` marks the card with a
        // 3 px hue rule on its left edge instead of a tinted fill.
        background: "var(--ftp-surface)",
        border: highlighted ? "1px solid var(--hue)" : "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: wash ? "inset 3px 0 0 var(--hue), var(--ftp-shadow-1)" : "var(--ftp-shadow-1)",
        minWidth: 0,
        ...style,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, display: "block" }}>{children}</span>
      <ChevronRight size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
    </button>
  );
}

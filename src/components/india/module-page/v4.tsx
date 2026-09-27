/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Design v4 helpers for the India module deep-dive pages.
 *
 *   indiaCategoryHue(category)  the v4 hue closest to the category's
 *                               existing accent (CATEGORY_ACCENT), so the
 *                               kit pieces (emoji chips, EmptyState) sit in
 *                               the same colour family as the page.
 *   IndiaSectionTitle           the section heading: an emoji chip + an H2 in
 *                               the display face, sentence case. Replaces the
 *                               old tracked-out uppercase eyebrow labels.
 *
 * Server-safe (no hooks); the kit classes it uses live in globals.css.
 */

import * as React from "react";
import type { IndiaModuleCategory } from "@/lib/india/india-modules";
import { hueClass, type Hue } from "@/lib/design/hues";

const CATEGORY_HUE: Record<IndiaModuleCategory, Hue> = {
  snapshot: "indigo",
  demographics: "indigo",
  economy: "blue",
  budget: "blue",
  trade: "blue",
  agriculture: "green",
  livestock: "green",
  wildlife: "green",
  sports: "green",
  infrastructure: "orange",
  energy: "orange",
  tourism: "orange",
  health: "rose",
  education: "violet",
  defence: "indigo",
  elections: "indigo",
  justice: "slate",
  science: "cyan",
  custom: "slate",
};

/** className that scopes the v4 hue variables for an India category. */
export function indiaCategoryHue(category: IndiaModuleCategory): string {
  return hueClass(CATEGORY_HUE[category] ?? "blue");
}

export function IndiaSectionTitle({
  emoji,
  children,
  aside,
}: {
  emoji?: string;
  children: React.ReactNode;
  /** Small right-hand note (e.g. a data caveat). */
  aside?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px 12px",
        flexWrap: "wrap",
        margin: "0 0 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {emoji ? (
          <span
            className="ftp-icon-chip ftp-emoji"
            aria-hidden
            style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}
          >
            {emoji}
          </span>
        ) : null}
        <h2 className="ftp-h2" style={{ fontSize: 20, lineHeight: "26px" }}>
          {children}
        </h2>
      </div>
      {aside ? <div style={{ minWidth: 0 }}>{aside}</div> : null}
    </div>
  );
}

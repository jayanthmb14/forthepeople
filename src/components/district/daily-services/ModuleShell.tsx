/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ModuleShell — shared building blocks for the "Daily services" module
//  pages (crops, weather, water, health, schools, power, jjm, transport,
//  housing, farm, services, offices, alerts).
// ═══════════════════════════════════════════════════════════════════════
//
//  Every module page follows the same order (CONCEPT-v3 §5 "Module page"):
//
//    <ModulePage>
//      <PageHeader … />            ← from the kit (ui.tsx)
//      <ModuleSummary>…</ModuleSummary>   one honest paragraph
//      <StatStrip>…</StatStrip>    2–4 headline numbers
//      <Section>…</Section>        charts / tables
//      <ModuleSources … />         Sources list + the legal disclaimer
//      <ModuleNews … />            related news (shared component)
//      <ModuleToolbar … />         CSV · Share · Compare
//    </ModulePage>
//
//  These helpers only arrange kit pieces. They hold no data logic, so a
//  page can drop any of them without breaking anything.
"use client";

import React from "react";
import { Download, GitCompare } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton } from "@/components/district/ui";
import ShareButtons from "@/components/common/ShareButtons";
import { getModuleSources } from "@/lib/constants/state-config";
import type { LegendEntry } from "./chart-tokens";

/**
 * ModulePage — the outer wrapper. Uses the v3 container (24 px side padding,
 * 16 px on phones) capped at the 960 px reading width, with 24 px on top
 * and 48 px at the bottom so the floating feedback button never covers
 * the toolbar.
 */
export function ModulePage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ftp-container"
      style={{
        maxWidth: "calc(var(--ftp-reading-max) + 2 * var(--ftp-gutter))",
        paddingTop: 24,
        paddingBottom: 48,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ModuleSummary — the one-paragraph plain-language description at the top
 * of a module page. It is also what search engines and AI crawlers read,
 * so keep the sentences factual. Styled as ordinary body text (no stripe,
 * no tinted box).
 */
export function ModuleSummary({ children }: { children: React.ReactNode }) {
  return (
    <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px", maxWidth: 720 }}>
      {children}
    </p>
  );
}

/**
 * ModuleSources — the collapsible "Sources" list for a module (from
 * getModuleSources) plus the standing legal line that this is not an
 * official government website. The disclaimer text is the same sentence
 * the old DataSourceBanner showed; do not shorten it.
 *
 * @prop module  Module key as used by getModuleSources ("crops", "water"…).
 * @prop state   State slug, so state-specific portals (DISCOM, water portal) show.
 */
export function ModuleSources({ module, state }: { module: string; state: string }) {
  const info = getModuleSources(module, state);
  return (
    <div>
      <SourcesFooter
        defaultOpen
        sources={info.sources.map((name) => ({ name, frequency: info.frequency }))}
      />
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "10px 0 0" }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government
        portals under India&apos;s Open Data Policy (NDSAP).
      </p>
    </div>
  );
}

/**
 * ModuleToolbar — the quiet action row at the end of a module page:
 * CSV download (only when `onCsv` is given), Share (WhatsApp / copy link)
 * and "Compare with another district".
 *
 * @prop locale / district  Used to build the compare link.
 * @prop moduleSlug         Module slug for the compare link.
 * @prop moduleLabel        Human name used by the share text.
 * @prop shareText          One-line summary for WhatsApp sharing.
 * @prop onCsv              Called when "CSV" is pressed. Omit to hide the button.
 * @prop csvLabel           Accessible label for the CSV button.
 */
export function ModuleToolbar({
  locale,
  district,
  moduleSlug,
  moduleLabel,
  shareText,
  onCsv,
  csvLabel,
}: {
  locale: string;
  district: string;
  moduleSlug: string;
  moduleLabel: string;
  shareText: string;
  onCsv?: () => void;
  csvLabel?: string;
}) {
  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;
  return (
    <Toolbar>
      {onCsv && (
        <ToolbarButton icon={Download} onClick={onCsv} ariaLabel={csvLabel ?? `Download ${moduleLabel} as CSV`}>
          CSV
        </ToolbarButton>
      )}
      <ShareButtons text={shareText} district={district} module={moduleLabel} />
      <ToolbarButton icon={GitCompare} href={compareHref}>
        Compare with another district
      </ToolbarButton>
    </Toolbar>
  );
}

/**
 * ChartLegend — a small legend row under a chart: a 16 px line swatch in
 * each series colour plus its name (11 px, text-2).
 */
export function ChartLegend({ entries }: { entries: LegendEntry[] }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
      {entries.map((e) => (
        <span key={e.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <span
            aria-hidden
            style={{
              width: 16,
              height: 0,
              borderTop: `2px ${e.dashed ? "dashed" : "solid"} ${e.color}`,
            }}
          />
          {e.label}
        </span>
      ))}
    </div>
  );
}

/**
 * mutedIf — style for a single stale row inside a list (e.g. a weather
 * reading older than 24 h): greys the text so fresh rows stand out while
 * staying readable. Pair it with an "as of" date on that row.
 */
export function mutedIf(stale: boolean): React.CSSProperties {
  return stale ? { color: "var(--ftp-text-2)" } : {};
}

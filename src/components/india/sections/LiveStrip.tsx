/**
 * LiveStrip — slim freshness/coverage strip above the hero.
 *
 * File 48 §4.7.2, aligned to Design v3 "Civic Ledger" on 2026-09-27:
 *
 *   • Freshness is a kit FreshnessPill fed by the newest
 *     IndiaIndicator.asOfDate. India indicators (Census, NFHS, NTCA …)
 *     update yearly, so the pill will almost always read "As of <date>" in
 *     grey. It only turns green / shows the 6 px live dot when the data is
 *     genuinely recent — the old unconditional pulsing "LIVE" label is gone.
 *   • No gradient, no shadow, no marquee. On phones the row simply scrolls
 *     sideways inside its own box (the page itself never scrolls sideways).
 *   • District and state coverage counts come from the registry
 *     (getPlatformFacts), never typed by hand.
 *
 * Server Component (reads Prisma). The FreshnessPill it renders is a client
 * component; the date is passed as an ISO string so it serialises cleanly.
 *
 * Sticky positioning (Phase D 2026-05-21): pinned at top:81px (header 41 +
 * breadcrumb 36 + section progress bar 4 = 81) so the strip stays visible as
 * the user scrolls. Z-index 38 sits one below SectionProgressBar's 39.
 */

import * as React from "react";
import { prisma } from "@/lib/db";
import { getPlatformFacts } from "@/lib/platform-facts";
import { FreshnessPill } from "@/components/district/ui";

interface LiveStripProps {
  sourceCount?: number;
  liveModuleCount?: number;
  editorialModuleCount?: number;
  totalStates?: number;
}

/** One "LABEL value" pair. Label 11 px uppercase, value in JetBrains Mono. */
function Item({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span className="ftp-label">{label}</span>
      <span className="ftp-num" style={{ color: "var(--ftp-text)", fontSize: 11, lineHeight: "16px" }}>
        {value}
      </span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 12, background: "var(--ftp-border)", flexShrink: 0 }} />;
}

export async function LiveStrip({
  // TODO Phase 5+: derive from DB (INDIA_SOURCES count, INDIA_MODULES live/editorial split,
  // State table count). These drift slowly so placeholder is acceptable for now.
  sourceCount = 320,
  liveModuleCount = 53,
  editorialModuleCount = 6,
  totalStates = 36,
}: LiveStripProps = {}) {
  // The honest freshness signal is the most recent source asOfDate across
  // all India indicators. Phase D 2026-05-21 replaced the misleading
  // "LAST SYNC X h ago" (seed-placeholder timestamps) with this.
  const latestIndicator = await prisma.indiaIndicator.findFirst({
    orderBy: { asOfDate: "desc" },
    select: { asOfDate: true },
  });
  const asOfIso = latestIndicator?.asOfDate ? latestIndicator.asOfDate.toISOString() : null;

  // Registry-derived coverage (issue #36: never hand-type these).
  const { activeDistricts, activeStates, totalIndiaDistricts } = getPlatformFacts();

  return (
    <div
      role="status"
      aria-label="Platform freshness and coverage"
      style={{
        // Phase D 2026-05-21: pin the strip below the section progress bar
        // so it stays visible as a contextual anchor while the user scrolls.
        position: "sticky",
        top: "81px",
        zIndex: 38,
        // Opaque surface so content scrolling underneath stays hidden.
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-tile)",
        padding: "6px 12px",
        minHeight: 36,
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        overflowX: "auto",
      }}
    >
      {asOfIso ? (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="ftp-label">Data</span>
          <FreshnessPill asOf={asOfIso} />
        </span>
      ) : (
        <Item label="Data as of" value="—" />
      )}
      <Divider />
      <Item label="Sources" value={`${sourceCount} .gov.in`} />
      <Divider />
      <Item label="Modules" value={`${liveModuleCount} live · ${editorialModuleCount} editorial`} />
      <Divider />
      <Item label="Districts" value={`${activeDistricts} of ${totalIndiaDistricts}`} />
      <Divider />
      <Item label="States" value={`${activeStates} of ${totalStates}`} />
    </div>
  );
}

export default LiveStrip;

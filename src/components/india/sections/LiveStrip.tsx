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
 *   • Module and source counts (2026-09-27) are counted from the India
 *     registries instead of the old typed placeholders (320 / 53 / 6):
 *       - Modules: INDIA_MODULES grouped by `status` (live, beta,
 *         coming soon, planned) — see countModulesByStatus below.
 *       - Sources: distinct INDIA_SOURCES entries cited by at least one
 *         module (a module citing a key missing from the registry is
 *         not counted, so the number can only under-state).
 *       - States/UTs: 36 is a constitutional fact (28 states + 8 union
 *         territories), kept as the named constant STATES_AND_UTS_OF_INDIA.
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
import { INDIA_MODULES } from "@/lib/india/india-modules";
import type { IndiaModuleStatus } from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";

/**
 * India has 28 states and 8 union territories (Constitution, First
 * Schedule, as amended in 2020). A fixed fact, not a platform count, so it
 * is a named constant rather than something derived from our registry.
 */
const STATES_AND_UTS_OF_INDIA = 36;

/** Display words for each module status, in the order they are listed. */
const STATUS_WORDS: Array<[IndiaModuleStatus, string]> = [
  ["live", "live"],
  ["beta", "beta"],
  ["coming_soon", "coming soon"],
  ["planned", "planned"],
];

/**
 * "31 live · 22 coming soon · 6 planned" — counted from INDIA_MODULES.
 * Statuses with zero modules are left out.
 */
function countModulesByStatus(): string {
  const counts = new Map<IndiaModuleStatus, number>();
  for (const m of INDIA_MODULES) counts.set(m.status, (counts.get(m.status) ?? 0) + 1);
  return STATUS_WORDS.filter(([s]) => (counts.get(s) ?? 0) > 0)
    .map(([s, word]) => `${counts.get(s)} ${word}`)
    .join(" · ");
}

/** Number of distinct registered sources that at least one module cites. */
function countCitedSources(): number {
  const cited = new Set<string>();
  for (const m of INDIA_MODULES) {
    for (const s of m.sources) if (s.sourceKey in INDIA_SOURCES) cited.add(s.sourceKey);
  }
  return cited.size;
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

export async function LiveStrip() {
  // Registry-derived counts (see the header comment). Cheap: plain array walks.
  const moduleSummary = countModulesByStatus();
  const sourceCount = countCitedSources();

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
      <Item label="Sources" value={`${sourceCount} cited`} />
      <Divider />
      <Item label="Modules" value={moduleSummary} />
      <Divider />
      <Item label="Districts" value={`${activeDistricts} of ${totalIndiaDistricts}`} />
      <Divider />
      <Item label="States" value={`${activeStates} of ${STATES_AND_UTS_OF_INDIA}`} />
    </div>
  );
}

export default LiveStrip;

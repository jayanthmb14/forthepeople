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
 * i18n (Sep 2026): labels from page_india "liveStrip.*"; the status list is
 * joined with Intl.ListFormat in the page language.
 *
 * Server Component (reads Prisma). The FreshnessPill it renders is a client
 * component; the date is passed as an ISO string so it serialises cleanly.
 *
 * Sticky positioning (Phase D 2026-05-21): pinned at top:81px (header 41 +
 * breadcrumb 36 + section progress bar 4 = 81) so the strip stays visible as
 * the user scrolls. Z-index 38 sits one below SectionProgressBar's 39.
 */

import * as React from "react";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Library, Map as MapIcon, MapPin, Puzzle, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { NOT_STANDING_FACT } from "@/lib/india/figure-dates";
import { getPlatformFacts } from "@/lib/platform-facts";
import { FreshnessPill } from "@/components/district/ui";
import { INDIA_MODULES } from "@/lib/india/india-modules";
import type { IndiaModuleStatus } from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { intlLocale } from "@/i18n/languages";
import { INDIA_NS } from "../i18n";

/**
 * India has 28 states and 8 union territories (Constitution, First
 * Schedule, as amended in 2020). A fixed fact, not a platform count, so it
 * is a named constant rather than something derived from our registry.
 */
const STATES_AND_UTS_OF_INDIA = 36;

/** Message key for each module status, in the order they are listed. */
const STATUS_KEYS: Array<[IndiaModuleStatus, string]> = [
  ["live", "liveStrip.live"],
  ["beta", "liveStrip.beta"],
  ["coming_soon", "liveStrip.soon"],
  ["planned", "liveStrip.planned"],
];

/** Module counts by status from INDIA_MODULES; statuses with zero modules are left out. */
function countModulesByStatus(): Array<[string, number]> {
  const counts = new Map<IndiaModuleStatus, number>();
  for (const m of INDIA_MODULES) counts.set(m.status, (counts.get(m.status) ?? 0) + 1);
  return STATUS_KEYS.filter(([s]) => (counts.get(s) ?? 0) > 0).map(([s, key]) => [key, counts.get(s) ?? 0]);
}

/** Number of distinct registered sources that at least one module cites. */
function countCitedSources(): number {
  const cited = new Set<string>();
  for (const m of INDIA_MODULES) {
    for (const s of m.sources) if (s.sourceKey in INDIA_SOURCES) cited.add(s.sourceKey);
  }
  return cited.size;
}

/** Small monochrome icon before each fact (v5.1: was an emoji). */
const ICON_STYLE: React.CSSProperties = { color: "var(--ftp-text-2)", flexShrink: 0 };

/** One "label value" pair with an icon. */
function Item({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <span className="india-live-item" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <Icon size={14} aria-hidden style={ICON_STYLE} />
      <span className="ftp-label">{label}</span>
      <span className="ftp-num" style={{ color: "var(--ftp-text)", fontSize: 12, lineHeight: "16px" }}>
        {value}
      </span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden className="india-live-div" style={{ width: 1, height: 12, background: "var(--ftp-border)", flexShrink: 0 }} />;
}

export async function LiveStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: INDIA_NS });
  // Registry-derived counts (see the header comment). Cheap: plain array walks.
  const moduleSummary = new Intl.ListFormat(intlLocale(locale), { style: "narrow", type: "unit" }).format(
    countModulesByStatus().map(([key, n]) => t(key, { n })),
  );
  const sourceCount = countCitedSources();

  // The honest freshness signal is the most recent source asOfDate across
  // all India indicators. Phase D 2026-05-21 replaced the misleading
  // "LAST SYNC X h ago" (seed-placeholder timestamps) with this.
  let latestIndicator: { asOfDate: Date } | null = null;
  try {
    // Standing facts (seats, states, targets) carry the day they were last
    // checked, and hidden rows have no value — neither is new data.
    latestIndicator = await prisma.indiaIndicator.findFirst({
      where: { numericValue: { not: null }, ...NOT_STANDING_FACT },
      orderBy: { asOfDate: "desc" },
      select: { asOfDate: true },
    });
  } catch {
    latestIndicator = null;
  }
  const asOfIso = latestIndicator?.asOfDate ? latestIndicator.asOfDate.toISOString() : null;

  // Registry-derived coverage (issue #36: never hand-type these).
  const { activeDistricts, activeStates, totalIndiaDistricts } = getPlatformFacts();

  return (
    <div
      role="status"
      className="india-live-strip"
      aria-label={t("liveStrip.aria")}
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
          <CalendarDays size={14} aria-hidden style={ICON_STYLE} />
          <span className="ftp-label">{t("liveStrip.data")}</span>
          <FreshnessPill asOf={asOfIso} />
        </span>
      ) : (
        <Item icon={CalendarDays} label={t("liveStrip.dataAsOf")} value="—" />
      )}
      <Divider />
      <Item icon={Library} label={t("liveStrip.sources")} value={t("liveStrip.sourcesValue", { n: sourceCount })} />
      <Divider />
      <Item icon={Puzzle} label={t("liveStrip.modules")} value={moduleSummary} />
      <Divider />
      <Item icon={MapPin} label={t("liveStrip.districts")} value={t("liveStrip.ofTotal", { n: activeDistricts, total: totalIndiaDistricts })} />
      <Divider />
      <Item icon={MapIcon} label={t("liveStrip.states")} value={t("liveStrip.ofTotal", { n: activeStates, total: STATES_AND_UTS_OF_INDIA })} />
      {/* v4.1: on phones the strip is not pinned (three pinned bars took a
          third of the screen) and its items wrap instead of hiding off the
          right edge. */}
      <style>{`
        @media (max-width: 767px) {
          .india-live-strip { position: static !important; flex-wrap: wrap; row-gap: 6px; overflow-x: visible !important; }
          .india-live-div { display: none; }
          .india-live-item { white-space: normal !important; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}

export default LiveStrip;

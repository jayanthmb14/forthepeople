/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * platform-facts — the ONE place citizen-facing platform numbers come from.
 *
 * Why this file exists (GitHub issue #36): the site used to say "9 districts"
 * in the FAQ JSON-LD, the About page and the support chatbot while the
 * homepage said 10, and the "modules per district" number appeared as 25+,
 * 28, 29 and 32 depending on which file you read. Every one of those was a
 * hand-typed literal that nobody remembered to update.
 *
 * Everything here is DERIVED from registries that already have to be right
 * for the site to work:
 *   - districts / states  → src/lib/constants/districts.ts (`active: true` flags)
 *   - modules per district → src/lib/constants/sidebar-modules.ts (the sidebar)
 *   - total India districts → src/lib/constants.ts
 *
 * All functions are synchronous and safe to call from server components,
 * client components, route handlers and plain TS files — no DB, no fetch.
 */

import {
  INDIA_STATES,
  getActiveStateCount,
  getTotalActiveDistrictCount,
} from "@/lib/constants/districts";
import { DASHBOARDS_PER_DISTRICT, TOTAL_INDIA_DISTRICTS } from "@/lib/constants";

export interface PlatformFacts {
  /** Districts with `active: true` in the registry (e.g. 10). */
  activeDistricts: number;
  /** States/UTs that have at least one active district (e.g. 7). */
  activeStates: number;
  /** Modules in the district sidebar — the honest "dashboards per district". */
  modulesPerDistrict: number;
  /** Total districts in India (LGD count, see TOTAL_INDIA_DISTRICTS). */
  totalIndiaDistricts: number;
  /**
   * Districts a visitor can vote for on /vote-district: the not-yet-live
   * districts in the registry (the same list the page shows). Not
   * "total − active": the registry does not list every district in India.
   */
  comingDistricts: number;
}

/** Returns every platform count the UI is allowed to print. */
export function getPlatformFacts(): PlatformFacts {
  const activeDistricts = getTotalActiveDistrictCount();
  return {
    activeDistricts,
    activeStates: getActiveStateCount(),
    modulesPerDistrict: DASHBOARDS_PER_DISTRICT,
    totalIndiaDistricts: TOTAL_INDIA_DISTRICTS,
    comingDistricts: INDIA_STATES.reduce((n, s) => n + s.districts.filter((d) => !d.active).length, 0),
  };
}

/**
 * Human-readable coverage line, e.g.
 * "Karnataka (Mandya, Bengaluru Urban, Mysuru), Delhi (New Delhi), …".
 * Used by the FAQ JSON-LD and the About page so the district list is
 * generated from the registry instead of being retyped by hand.
 */
export function getCoverageSentence(): string {
  return INDIA_STATES.filter((s) => s.districts.some((d) => d.active))
    .map((s) => {
      const names = s.districts.filter((d) => d.active).map((d) => d.name);
      return `${s.name} (${names.join(", ")})`;
    })
    .join(", ");
}

/**
 * Short "N districts across M states" phrase with correct pluralisation.
 * Example: "10 districts across 7 states".
 */
export function getCoveragePhrase(): string {
  const { activeDistricts, activeStates } = getPlatformFacts();
  const d = activeDistricts === 1 ? "district" : "districts";
  const s = activeStates === 1 ? "state" : "states";
  return `${activeDistricts} ${d} across ${activeStates} ${s}`;
}

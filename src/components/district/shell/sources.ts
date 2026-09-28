/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Source names and the "check it yourself" portal for a module, used by
// the stale-data notice and the verification panel. Names come from the
// curated registry (getModuleSources in state-config.ts), not from the
// free-text `source` column of each row, which often holds internal notes.
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getFreshnessRule } from "@/lib/constants/sidebar-modules";
import { tenderPortalFor } from "@/lib/constants/tender-portals";

/** Registry key used by getModuleSources for a sidebar slug. */
const SOURCE_KEY: Record<string, string> = {
  finance: "budget",
  "file-rti": "rti",
};

/**
 * Official source names for a module in a district (English proper names).
 * Pass the district: its own values (power company, water board) override
 * the state's — Sept 2026 audit: Mandya's panel named BESCOM although
 * CESC Mysore supplies it, and Mumbai's named MSEDCL instead of BEST / Adani.
 */
export function moduleSourceNames(module: string, stateSlug: string, districtSlug?: string): string[] {
  return getModuleSources(SOURCE_KEY[module] ?? module, stateSlug, districtSlug).sources;
}

/**
 * An official portal to check a module's figures, state-specific where one
 * exists. Tenders: the state portal the rows came from, or none when no
 * collector reads the state (never a portal that supplied nothing).
 */
export function modulePortal(module: string, stateSlug: string, districtSlug?: string): string | null {
  const config = getStateConfig(stateSlug, districtSlug);
  if (module === "tenders") return tenderPortalFor(stateSlug)?.app ?? null;
  const byState: Record<string, string | null | undefined> = {
    water: config?.waterPortalUrl,
    power: config?.discomPortalUrl,
    transport: config?.stateTransportUrl,
    rti: config?.rtiPortalUrl,
  };
  return byState[module] ?? getFreshnessRule(module)?.portal ?? null;
}

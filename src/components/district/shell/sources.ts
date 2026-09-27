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

/** Registry key used by getModuleSources for a sidebar slug. */
const SOURCE_KEY: Record<string, string> = {
  finance: "budget",
  "file-rti": "rti",
};

/** Official source names for a module in a state (English proper names). */
export function moduleSourceNames(module: string, stateSlug: string): string[] {
  return getModuleSources(SOURCE_KEY[module] ?? module, stateSlug).sources;
}

/** An official portal to check a module's figures, state-specific where one exists. */
export function modulePortal(module: string, stateSlug: string): string | null {
  const config = getStateConfig(stateSlug);
  const byState: Record<string, string | null | undefined> = {
    water: config?.waterPortalUrl,
    power: config?.discomPortalUrl,
    transport: config?.stateTransportUrl,
    rti: config?.rtiPortalUrl,
  };
  return byState[module] ?? getFreshnessRule(module)?.portal ?? null;
}

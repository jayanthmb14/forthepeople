/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Translated module-group names for the district navigation (sidebar,
// "All modules" drawer, "See also"). Groups come from the registry
// (MODULE_GROUPS in src/lib/constants/sidebar-modules.ts); their text lives
// in `moduleGroups.<key>` in every language, with the registry's English
// label as the fallback.
"use client";

import { useTranslations } from "next-intl";
import { MODULE_GROUPS, type ModuleGroupKey } from "@/lib/constants/sidebar-modules";

const ENGLISH = Object.fromEntries(MODULE_GROUPS.map((g) => [g.key, g.label])) as Record<ModuleGroupKey, string>;

/** `groupName("whoRuns")` → "Who runs it" / "ಯಾರು ನಡೆಸುತ್ತಾರೆ". */
export function useModuleGroupName(): (key: ModuleGroupKey) => string {
  const t = useTranslations("moduleGroups");
  return (key) => (t.has(key) ? t(key) : ENGLISH[key] ?? key);
}

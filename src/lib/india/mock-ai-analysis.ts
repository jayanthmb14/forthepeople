/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  MOCK ANALYSIS — replace in Session C1                   ║
 * ║                                                           ║
 * ║  Every entry here is generic placeholder copy keyed by    ║
 * ║  module slug. Real analysis comes from a Claude/Gemini    ║
 * ║  authored 100-200 word paragraph stored in the            ║
 * ║  IndiaAnalysis Prisma table once Session C1 lands.        ║
 * ║                                                           ║
 * ║  grep this file via:                                      ║
 * ║      rg "MOCK ANALYSIS — replace in Session C1"          ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

import { INDIA_MODULES } from "./india-modules";

export const __MOCK__ = "MOCK ANALYSIS — replace in Session C1" as const;

export interface MockAnalysis {
  moduleSlug: string;
  headline: string;
  body: string;
  authoredBy: string;
  authoredAt: string;
  sources: string[];
  asOfDate: string;
}

/**
 * One mock analysis per module slug, generated from the registry so
 * the whole map is always in sync with the canonical module list.
 */
export const MOCK_ANALYSES: Record<string, MockAnalysis> = (() => {
  const map: Record<string, MockAnalysis> = {};
  for (const mod of INDIA_MODULES) {
    map[mod.slug] = {
      moduleSlug: mod.slug,
      headline: `${mod.title}: signal vs. noise — what the latest data is showing`,
      body:
        `[MOCK ANALYSIS — replaced in Session C1] ${mod.title} sits in the ` +
        `${mod.category} category and tracks ${mod.tagline.toLowerCase()} ` +
        `Once real values land, this card will show a 100-200 word ` +
        `human-readable summary: top-line trend, biggest year-on-year ` +
        `mover, the state that breaks the pattern, and a sourced ` +
        `caveat. The pipeline that lands real text is described in ` +
        `docs/india/sessions/SESSION-2.5-REPORT.md. Until then the ` +
        `paragraph stays generic so layout and source-citation logic ` +
        `can be reviewed without committing to any specific numbers.`,
      authoredBy: "mock",
      authoredAt: "2026-04-29",
      sources: mod.sources.map((s) => s.sourceKey),
      asOfDate: "2026-04-29",
    };
  }
  return map;
})();

export function getMockAnalysis(moduleSlug: string): MockAnalysis | undefined {
  return MOCK_ANALYSES[moduleSlug];
}

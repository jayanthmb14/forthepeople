/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Does a data module's "live" / "coming soon" label match what it shows?
 * Pure (no database): scripts/check-india-module-status.ts passes in the
 * modules that have published figures; tests/india-module-status.test.ts
 * covers the rule.
 *
 * Rule: a DATA module is "live" exactly when it has at least one published
 * figure (an IndiaIndicator row with a value). Editorial modules
 * (Know India articles) are judged by their articles, not here.
 */
import type { IndiaModuleDef, IndiaModuleStatus } from "./india-modules";

export interface StatusMismatch {
  slug: string;
  status: IndiaModuleStatus;
  shouldBe: "live" | "coming_soon";
}

export function moduleStatusMismatches(
  modules: ReadonlyArray<Pick<IndiaModuleDef, "slug" | "status" | "contentType">>,
  slugsWithFigures: ReadonlySet<string>,
): StatusMismatch[] {
  const out: StatusMismatch[] = [];
  for (const m of modules) {
    if (m.contentType !== "data") continue;
    const has = slugsWithFigures.has(m.slug);
    if (m.status === "live" && !has) out.push({ slug: m.slug, status: m.status, shouldBe: "coming_soon" });
    else if (m.status !== "live" && has) out.push({ slug: m.slug, status: m.status, shouldBe: "live" });
  }
  return out;
}

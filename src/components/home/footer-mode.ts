/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Which footer a page gets (v5.3).
//
//   slim  one thin line — logo mark, "Built by Jayanth M B", About ·
//         Privacy · Disclaimer and a "More" button that opens the full
//         footer in place. On pages people scroll through module by
//         module, so the big footer does not show up at the end of every
//         topic:
//           • district pages: /<locale>/<state>/<district> and everything
//             under it (module pages, taluk and village pages);
//           • India module pages: /<locale>/india/<module> (not the India
//             home, its categories or "updates").
//   full  every other page (home, about, support, prices, the state page…).
//
// Pure (no React), so the test in tests/footer-mode.test.ts can call it.
import { getDistrict, getState } from "@/lib/constants/districts";

export function isSlimFooterPath(pathname: string | null | undefined): boolean {
  const parts = (pathname ?? "").split("/").filter(Boolean); // [locale, …]
  if (parts[1] === "india") {
    return Boolean(parts[2]) && parts[2] !== "category" && parts[2] !== "updates";
  }
  const state = parts[1] ? getState(parts[1]) : undefined;
  return Boolean(state && parts[2] && getDistrict(state.slug, parts[2]));
}

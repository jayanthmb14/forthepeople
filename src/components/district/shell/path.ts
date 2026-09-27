/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Where a district URL points: the overview, a module page or a taluk page.
//   /en/karnataka/mandya            → overview
//   /en/karnataka/mandya/weather/…  → module "weather"
//   /en/karnataka/mandya/maddur     → taluk "maddur"
// Used by the district shell (bar, glance row, stale notice, verification
// panel), which must treat a taluk page differently from a module page.
import { getModule } from "@/lib/constants/sidebar-modules";

export type DistrictPageKind = "overview" | "module" | "taluk";

export interface DistrictRoute {
  kind: DistrictPageKind;
  /** Module slug ("overview" on the overview, null on a taluk page). */
  module: string | null;
  /** Taluk slug on a taluk page, else null. */
  taluk: string | null;
}

export function districtRoute(pathname: string | null | undefined): DistrictRoute {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  const seg = parts[3];
  if (!seg) return { kind: "overview", module: "overview", taluk: null };
  if (seg !== "overview" && getModule(seg)) return { kind: "module", module: seg, taluk: null };
  if (seg === "overview") return { kind: "overview", module: "overview", taluk: null };
  return { kind: "taluk", module: null, taluk: seg };
}

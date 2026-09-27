/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// DistrictLandmark — a live district's small landmark picture (sugar cane
// for Mandya, Charminar for Hyderabad…) from src/components/district/icons.
// Renders nothing for a district without one. Decorative: callers wrap it
// in an aria-hidden element, the district's name is always written next
// to it.
import { createElement } from "react";
import { getDistrictIcon } from "@/components/district/icons";

export default function DistrictLandmark({ slug, size = 28 }: { slug: string; size?: number }) {
  const icon = getDistrictIcon(slug);
  return icon ? createElement(icon, { size, "aria-label": "" }) : null;
}

/** True when the district has a landmark picture. */
export function hasLandmark(slug: string): boolean {
  return getDistrictIcon(slug) !== null;
}

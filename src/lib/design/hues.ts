/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Design v4 "Rang" — one colour identity per module
// ═══════════════════════════════════════════════════════════════════════
//  Each module slug maps to a hue name. The CSS for every hue lives in
//  globals.css as `.ftp-hue-<name>` and sets --hue / --hue-deep /
//  --hue-pop / --hue-tint. A page (or any element) opts in by adding
//  `hueClass(slug)` to its className; kit components then colour
//  themselves from those variables. Emoji + label come from the sidebar
//  registry so there is still only one list of modules.

import { SIDEBAR_MODULES, type SidebarModule } from "@/lib/constants/sidebar-modules";

export type Hue =
  | "blue" | "sky" | "cyan" | "teal" | "green" | "lime" | "yellow"
  | "amber" | "orange" | "rose" | "pink" | "violet" | "indigo" | "slate";

/** Solid accent per hue, for places that cannot read CSS variables (SVG maps, canvas, OG images). */
export const HUE_HEX: Record<Hue, { hue: string; deep: string; pop: string; tint: string }> = {
  blue:   { hue: "#2563EB", deep: "#1E3A8A", pop: "#93B4F5", tint: "#EEF3FE" },
  sky:    { hue: "#0284C7", deep: "#0C4A6E", pop: "#7CC4EA", tint: "#E9F6FC" },
  cyan:   { hue: "#0E7490", deep: "#164E63", pop: "#67C3D6", tint: "#E6F5F8" },
  teal:   { hue: "#0F766E", deep: "#134E4A", pop: "#6CC5BA", tint: "#E5F4F2" },
  green:  { hue: "#15803D", deep: "#14532D", pop: "#7CC794", tint: "#E9F6EE" },
  lime:   { hue: "#4D7C0F", deep: "#365314", pop: "#A3C763", tint: "#F0F7E5" },
  yellow: { hue: "#CA8A04", deep: "#713F12", pop: "#EFC75E", tint: "#FEF8E3" },
  amber:  { hue: "#B45309", deep: "#78350F", pop: "#E9B35E", tint: "#FDF3E5" },
  orange: { hue: "#C2410C", deep: "#7C2D12", pop: "#F0A37A", tint: "#FDEFE7" },
  rose:   { hue: "#BE123C", deep: "#881337", pop: "#EE8FA6", tint: "#FDEBEF" },
  pink:   { hue: "#BE185D", deep: "#831843", pop: "#EC91BD", tint: "#FCECF4" },
  violet: { hue: "#7C3AED", deep: "#4C1D95", pop: "#B79AF3", tint: "#F3EEFD" },
  indigo: { hue: "#4F46E5", deep: "#312E81", pop: "#A5A1F2", tint: "#EEEEFD" },
  slate:  { hue: "#475569", deep: "#1E293B", pop: "#A3AEBD", tint: "#F0F3F6" },
};

/** Module slug → hue. Anything not listed (overview, unknown) is brand blue. */
export const MODULE_HUE: Record<string, Hue> = {
  // Civic duty
  responsibility: "green", overview: "blue", leadership: "indigo", elections: "violet", "citizen-corner": "pink",
  // Money & resources
  finance: "amber", infrastructure: "orange", tenders: "indigo", industries: "slate", schemes: "violet",
  crops: "green", farm: "lime", water: "cyan", "gram-panchayat": "teal",
  // Daily services
  jjm: "sky", power: "yellow", transport: "indigo", health: "rose", schools: "violet", housing: "orange",
  services: "teal", offices: "slate", weather: "sky", alerts: "rose",
  // Accountability
  police: "blue", courts: "violet", "file-rti": "amber", rti: "indigo", "data-sources": "slate", "update-log": "slate",
  // Community & people
  news: "blue", exams: "violet", contributors: "pink", "famous-personalities": "amber", population: "teal", map: "green",
};

export function getModuleHue(slug: string | null | undefined): Hue {
  return (slug && MODULE_HUE[slug]) || "blue";
}

/** className that scopes the hue variables to an element. */
export function hueClass(slugOrHue: string | null | undefined): string {
  if (!slugOrHue) return "ftp-hue-blue";
  const hue = (slugOrHue in HUE_HEX ? slugOrHue : getModuleHue(slugOrHue)) as Hue;
  return `ftp-hue-${hue}`;
}

/** Emoji + label + hue for a module slug (null for unknown slugs). */
export function getModuleMeta(slug: string): (SidebarModule & { hue: Hue }) | null {
  const m = SIDEBAR_MODULES.find((x) => x.slug === slug);
  return m ? { ...m, hue: getModuleHue(slug) } : null;
}

/**
 * The module slug for a district URL:
 *   /en/karnataka/mandya/finance/…  → "finance"
 *   /en/karnataka/mandya            → "overview"
 * Taluk pages (/…/mandya/<taluk>) fall back to "overview".
 */
export function moduleFromPath(pathname: string | null | undefined): string {
  if (!pathname) return "overview";
  const parts = pathname.split("/").filter(Boolean);
  const seg = parts[3];
  if (!seg) return "overview";
  return MODULE_HUE[seg] ? seg : "overview";
}

/** Colour per live district — loosely its landmark's palette. */
export const DISTRICT_HUE: Record<string, Hue> = {
  mandya: "green",
  "bengaluru-urban": "indigo",
  mysuru: "amber",
  hyderabad: "orange",
  chennai: "cyan",
  mumbai: "blue",
  pune: "pink",
  lucknow: "violet",
  kolkata: "teal",
  "new-delhi": "rose",
};
const DISTRICT_CYCLE: Hue[] = ["sky", "lime", "yellow", "slate", "rose", "teal", "violet", "orange"];

/** Hue for a district slug; unknown districts get a stable colour from their name. */
export function getDistrictHue(slug: string): Hue {
  if (DISTRICT_HUE[slug]) return DISTRICT_HUE[slug];
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DISTRICT_CYCLE[h % DISTRICT_CYCLE.length];
}

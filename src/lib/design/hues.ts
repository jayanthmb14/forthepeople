/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Design v5 "Calm" — one pastel colour identity per module
// ═══════════════════════════════════════════════════════════════════════
//  Hues are IDENTITY only (docs/DESIGN-SYSTEM.md): tints for chips and
//  backgrounds, the deep tone for small icons, numbers and titles. Never a
//  saturated gradient band. Each module slug maps to a hue name. The CSS for every hue lives in
//  globals.css as `.ftp-hue-<name>` and sets --hue / --hue-deep /
//  --hue-pop / --hue-tint. A page (or any element) opts in by adding
//  `hueClass(slug)` to its className; kit components then colour
//  themselves from those variables. Emoji + label come from the sidebar
//  registry so there is still only one list of modules.

import { SIDEBAR_MODULES, type SidebarModule } from "@/lib/constants/sidebar-modules";

export type Hue =
  | "blue" | "sky" | "cyan" | "teal" | "green" | "lime" | "yellow"
  | "amber" | "orange" | "rose" | "pink" | "violet" | "indigo" | "slate";

/**
 * Solid accent per hue, for places that cannot read CSS variables (SVG maps,
 * canvas, OG images). MUST match the `.ftp-hue-<name>` classes in
 * globals.css (v5 "Calm" pastel palette):
 *   hue   calm mid tone, ≥ 4.5:1 on white (icons, bars, primary buttons)
 *   deep  ≥ 6.5:1 on white and on tint (numbers, titles, text on a tint)
 *   pop   pastel (second series, light fills)
 *   tint  very light background
 */
export const HUE_HEX: Record<Hue, { hue: string; deep: string; pop: string; tint: string }> = {
  blue:   { hue: "#3B68D9", deep: "#1E40AF", pop: "#BFD3FB", tint: "#EEF4FF" },
  sky:    { hue: "#2F77AE", deep: "#0B5A85", pop: "#B5DDF2", tint: "#EAF6FC" },
  cyan:   { hue: "#237A8C", deep: "#155E6E", pop: "#AEE0E8", tint: "#E8F7F9" },
  teal:   { hue: "#277A70", deep: "#115E55", pop: "#A9DDD3", tint: "#E7F6F3" },
  green:  { hue: "#2F7D4C", deep: "#1B6437", pop: "#B5DEC2", tint: "#EAF6EE" },
  lime:   { hue: "#56752A", deep: "#3F5A12", pop: "#CFE3A8", tint: "#F1F7E6" },
  yellow: { hue: "#8A6A16", deep: "#6B4F08", pop: "#F3DE9A", tint: "#FDF8E4" },
  amber:  { hue: "#A2621F", deep: "#7F430C", pop: "#F3D3A2", tint: "#FDF4E7" },
  orange: { hue: "#B45530", deep: "#8F3712", pop: "#F5C6AA", tint: "#FDF0E9" },
  rose:   { hue: "#BA3F63", deep: "#9B1D43", pop: "#F4BFCD", tint: "#FDEEF2" },
  pink:   { hue: "#AE4679", deep: "#8C2257", pop: "#F1C0DA", tint: "#FCEFF6" },
  violet: { hue: "#7152C9", deep: "#5328A8", pop: "#D3C4F6", tint: "#F4F0FD" },
  indigo: { hue: "#5256C9", deep: "#3730A3", pop: "#C7C9F6", tint: "#EFF0FD" },
  slate:  { hue: "#5A6A80", deep: "#334155", pop: "#C9D2DE", tint: "#F1F4F8" },
};

/** Module slug → hue. Anything not listed (overview, unknown) is brand blue. */
export const MODULE_HUE: Record<string, Hue> = {
  // Grouped as in the sidebar (docs/MODULE-MAP.md). Pairs that link to each
  // other ("See also") have different hues so the two tiles look different.
  // 🏠 Start here
  overview: "blue", news: "blue", alerts: "rose", weather: "sky",
  // 🙋 You can help
  responsibility: "green", "citizen-corner": "pink", "file-rti": "amber", rti: "indigo",
  // 👥 Who runs it
  leadership: "indigo", elections: "violet", "gram-panchayat": "teal", courts: "violet", police: "blue",
  // 💰 Money & projects
  finance: "amber", infrastructure: "orange", tenders: "indigo", industries: "slate",
  // 🤲 Help for you
  schemes: "violet", housing: "orange", services: "teal", offices: "slate", exams: "violet",
  // 🚰 Daily needs
  jjm: "sky", water: "cyan", power: "yellow", transport: "indigo", health: "rose", schools: "violet",
  // 🌾 Farming
  crops: "green", farm: "lime",
  // 📚 Know your district
  population: "teal", map: "green", "famous-personalities": "amber", contributors: "pink",
  // 🔍 Check our work
  "data-sources": "slate", "update-log": "slate",
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

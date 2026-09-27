/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Design tokens specific to /[locale]/india.
 *
 * Tricolor sprinkle — accent only. Page bg stays #FAFAF8, cards stay
 * white, borders stay #E8E8E4. Tricolor appears as 4px section-header
 * underlines, 8%-opacity category chip tints, and per-section icon
 * colors. NEVER as full backgrounds, NEVER as the flag itself, NEVER
 * with the Ashoka chakra or any government emblem (file 31 §4).
 */

import type { IndiaModuleCategory } from "./india-modules";

export const INDIA_TRICOLOR = {
  saffron: "#FF9933",
  saffronSoft: "#FFF4E6", // background tint, never main fill
  white: "#FFFFFF",
  green: "#138808",
  greenSoft: "#ECFDF3", // background tint
  navy: "#000080", // Ashoka chakra navy — for accents only
} as const;

/**
 * Per-category accent color for section header underlines + icon chips.
 * Keyed by IndiaModuleCategory so a one-line registry edit is enough
 * to add a new category.
 */
export const CATEGORY_ACCENT: Record<IndiaModuleCategory, string> = {
  snapshot: INDIA_TRICOLOR.navy, // national identity
  demographics: INDIA_TRICOLOR.navy,
  economy: "#2563EB", // existing accent-blue
  budget: "#2563EB",
  agriculture: INDIA_TRICOLOR.green, // green = agri / nature
  livestock: INDIA_TRICOLOR.green,
  wildlife: INDIA_TRICOLOR.green,
  infrastructure: INDIA_TRICOLOR.saffron, // saffron = infra / build
  energy: INDIA_TRICOLOR.saffron,
  health: "#DC2626", // medical red
  education: "#7C3AED", // education purple
  defence: INDIA_TRICOLOR.navy, // defence navy
  justice: "#4B5563", // neutral grey
  elections: INDIA_TRICOLOR.navy,
  science: "#0891B2", // science cyan
  trade: "#2563EB",
  tourism: INDIA_TRICOLOR.saffron,
  sports: INDIA_TRICOLOR.green,
  custom: "#6B7280",
};

/**
 * Lighter background tint of the category accent — for chip backgrounds
 * etc. Use sparingly; always paired with a 1px border in the same hue.
 */
export function categoryTint(category: IndiaModuleCategory): string {
  // Translate the accent color to an 8%-opacity background.
  // Hard-coded a few common ones for design polish; everything else
  // computes via rgba() at the point of use.
  switch (category) {
    case "snapshot":
    case "demographics":
    case "defence":
    case "elections":
      return "#EEF0F8"; // navy soft
    case "agriculture":
    case "livestock":
    case "wildlife":
    case "sports":
      return INDIA_TRICOLOR.greenSoft;
    case "infrastructure":
    case "energy":
    case "tourism":
      return INDIA_TRICOLOR.saffronSoft;
    case "health":
      return "#FEF2F2";
    case "education":
      return "#F5F3FF";
    case "science":
      return "#ECFEFF";
    case "justice":
      return "#F3F4F6";
    case "economy":
    case "budget":
    case "trade":
      return "#EFF6FF";
    default:
      return "#F8FAFC";
  }
}

/**
 * Page-level shared tokens. Inline-style consumers reference these so
 * changes flow through every India component in one place.
 */
export const INDIA_DESIGN = {
  bgPage: "#FAFAF8",
  bgCard: "#FFFFFF",
  bgMuted: "#F8FAFC",
  border: "#E8E8E4",
  textPrimary: "#1A1A1A",
  textSecondary: "#4B4B4B",
  textMuted: "#6B6B6B",
  textFaint: "#9B9B9B",
  accentBlue: "#2563EB",
  accentAmber: "#D97706",
  amberStrip: "#FEF3C7",
  amberStripBorder: "#FDE68A",
  fontMono: "var(--font-mono, ui-monospace, monospace)",
  // Design v4: headings and big numbers use the display face (Bricolage).
  fontDisplay: "var(--ftp-font-display)",
  sectionMaxWidth: 1200,
  cardRadius: 14,
  headerOffsetPx: 56, // sticky nav sits this far below header
} as const;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  One colour per support plan (Design v5.1 "Warm Calm")
// ═══════════════════════════════════════════════════════════════════════
//
//    one-time gift      rose   (the support colour)
//    District Champion  blue   (the brand)
//    State Champion     teal
//    All-India Patron   violet
//    Founding Builder   gold   (the yellow hue + the gold accents in look.module.css)
//
//  The plan cards, the checkout popup, the supporters wall and the
//  /contributors cards all colour themselves from this one table, so a
//  supporter's avatar matches the plan card they came from. Pastel only:
//  each hue class sets --hue / --hue-deep / --hue-pop / --hue-tint.

import type { Hue } from "@/lib/design/hues";
import { isFoundingBuilder, placementLevel, type PlacedSupporter } from "./placement";

export type TierKey = "custom" | "district" | "state" | "patron" | "founder";

export const TIER_HUE: Record<TierKey, Hue> = {
  custom: "rose",
  district: "blue",
  state: "teal",
  patron: "violet",
  founder: "yellow",
};

/** Any stored tier string ("chai", "custom", "district", …) → a plan key. Unknown → one-time. */
export function tierKeyOf(tier: string | null | undefined): TierKey {
  switch (tier) {
    case "district":
    case "state":
    case "patron":
    case "founder":
      return tier;
    default:
      return "custom";
  }
}

/** `ftp-hue-<name>` class for a plan. */
export function tierHueClass(tier: string | null | undefined): string {
  return `ftp-hue-${TIER_HUE[tierKeyOf(tier)]}`;
}

/**
 * The plan a supporter's colour should follow. Founder- and All-India-level
 * gifts follow the same rule that decides where the name appears (a one-time
 * ₹50,000 gift is a Founding Builder, ₹9,999 and up is All-India); everyone
 * else follows their stored tier, like the badge line under their name.
 */
export function supporterTierKey(s: PlacedSupporter): TierKey {
  if (isFoundingBuilder(s)) return "founder";
  if (placementLevel(s) === "india") return "patron";
  return tierKeyOf(s.tier);
}

/**
 * English wall label from /api/payment/contributors ("☕ Chai Supporter",
 * "🏛️ District Supporter", …, chosen there by amount) → plan key.
 */
export function tierKeyFromWallLabel(label: string): TierKey {
  if (label.endsWith("Founding Builder")) return "founder";
  if (label.endsWith("All-India Patron")) return "patron";
  if (label.endsWith("State Supporter")) return "state";
  if (label.endsWith("District Supporter")) return "district";
  return "custom";
}

/**
 * Up to two initials for an avatar: the first letter of the first and last
 * words. Works for Indic names too (the first character, with its vowel
 * sign dropped). Returns "" for "Anonymous"-style names (the avatar then
 * shows a plain person shape).
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = (w: string) => Array.from(w).find((ch) => /\p{L}/u.test(ch)) ?? "";
  const picked = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  return picked.map(first).join("").toUpperCase();
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  DistrictBadges — the "tagline chips" on a district identity card
//  (Design v3 "Civic Ledger", CONCEPT-v3 §5).
// ═══════════════════════════════════════════════════════════
//
//  The district registry (src/lib/constants/districts.ts) stores each
//  badge as { emoji, label }, e.g. { emoji: <factory emoji>, label: "Sugar Capital" }.
//  Design v3 does not allow emoji in the page chrome, so this component
//  swaps each registry emoji for a matching Lucide icon and renders the
//  label inside a kit <Pill>. Unknown emoji fall back to a neutral icon,
//  so adding a new badge in the registry never breaks the page.
//
//  The emoji keys below are written as \u{…} escapes (not the glyphs
//  themselves) so the source file stays emoji-free.

import type { LucideIcon } from "lucide-react";
import {
  Banknote, Bike, Building2, Car, Castle, Clapperboard, Dna, Drama, Factory,
  Flag, Gem, GraduationCap, Hospital, Landmark, Laptop, Microscope, Music,
  PartyPopper, PawPrint, Rocket, Scissors, Sparkles, Tent, TrainFront,
  TreePalm, TreePine, Trophy, UtensilsCrossed, Waves, Wheat,
} from "lucide-react";
import { Pill, type Tone } from "@/components/district/ui";
import type { DistrictBadge } from "@/lib/constants/districts";

/** Registry emoji (as a Unicode code-point string) → Lucide icon. */
const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  "\u{1F1EE}\u{1F1F3}": Flag,          // Indian flag
  "\u{1F30A}": Waves,                  // water wave
  "\u{1F333}": TreePine,               // tree
  "\u{1F33E}": Wheat,                  // sheaf of rice
  "\u{1F357}": UtensilsCrossed,        // food
  "\u{1F362}": UtensilsCrossed,        // food
  "\u{1F38A}": PartyPopper,            // festival
  "\u{1F393}": GraduationCap,          // education
  "\u{1F3AA}": Tent,                   // festival tent
  "\u{1F3AC}": Clapperboard,           // film
  "\u{1F3AD}": Drama,                  // culture / theatre
  "\u{1F3B5}": Music,                  // music
  "\u{1F3C6}": Trophy,                 // award
  "\u{1F3CD}\u{FE0F}": Bike,           // motorcycle
  "\u{1F3CD}": Bike,
  "\u{1F3D6}\u{FE0F}": TreePalm,       // beach
  "\u{1F3D6}": TreePalm,
  "\u{1F3D7}\u{FE0F}": Building2,      // construction / architecture
  "\u{1F3D7}": Building2,
  "\u{1F3DB}\u{FE0F}": Landmark,       // classical building
  "\u{1F3DB}": Landmark,
  "\u{1F3E5}": Hospital,               // hospital
  "\u{1F3ED}": Factory,                // factory
  "\u{1F3F0}": Castle,                 // castle
  "\u{1F418}": PawPrint,               // wildlife
  "\u{1F48E}": Gem,                    // pearls / gems
  "\u{1F4B0}": Banknote,               // finance
  "\u{1F4BB}": Laptop,                 // IT
  "\u{1F52C}": Microscope,             // science
  "\u{1F680}": Rocket,                 // space / startups
  "\u{1F682}": TrainFront,             // rail
  "\u{1F697}": Car,                    // automobiles
  "\u{1F9EC}": Dna,                    // biotech
  "\u{1F9F5}": Scissors,               // textiles / embroidery
};

/** Look up the Lucide icon for a registry emoji (falls back to Sparkles). */
export function badgeIcon(emoji: string | undefined): LucideIcon {
  if (!emoji) return Sparkles;
  return EMOJI_TO_ICON[emoji] ?? EMOJI_TO_ICON[emoji.replace(/\u{FE0F}/gu, "")] ?? Sparkles;
}

interface Props {
  badges?: DistrictBadge[];
  /** Kept for backwards compatibility (the v2 palette varied by district). Unused. */
  districtSlug?: string;
  /** The district tagline, shown as the first (brand-tinted) chip. */
  tagline?: string;
  /** Pill tone for the badges (default neutral). */
  tone?: Tone;
}

/**
 * A wrapping row of Pills: tagline first (brand tint), then each badge
 * with its Lucide icon. Renders nothing when there is nothing to show.
 */
export default function DistrictBadges({ badges, tagline, tone = "neutral" }: Props) {
  const list = badges ?? [];
  if (!tagline && list.length === 0) return null;

  return (
    <ul
      aria-label="What this district is known for"
      style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", padding: 0, margin: 0 }}
    >
      {tagline && (
        <li>
          <Pill tone="brand" icon={Sparkles}>{tagline}</Pill>
        </li>
      )}
      {list.map((b) => (
        <li key={b.label}>
          <Pill tone={tone} icon={badgeIcon(b.emoji)}>{b.label}</Pill>
        </li>
      ))}
    </ul>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { DistrictBadge } from "@/lib/constants/districts";

// Badge color palette — assign based on index, avoiding the district's palette family
const BADGE_COLORS = [
  { bg: "rgba(225,245,238,0.85)", text: "#0f6e56", border: "rgba(15,110,86,0.15)" },  // teal
  { bg: "rgba(238,237,254,0.85)", text: "#534ab7", border: "rgba(83,74,183,0.15)" },  // purple
  { bg: "rgba(250,236,231,0.85)", text: "#993c1d", border: "rgba(153,60,29,0.15)" },  // coral
  { bg: "rgba(230,241,251,0.85)", text: "#185fa5", border: "rgba(24,95,165,0.15)" },  // blue
  { bg: "rgba(234,243,222,0.85)", text: "#3b6d11", border: "rgba(59,109,17,0.15)" },  // green
  { bg: "rgba(251,234,240,0.85)", text: "#993556", border: "rgba(153,53,86,0.15)" },  // pink
  { bg: "rgba(250,238,218,0.85)", text: "#854f0b", border: "rgba(133,79,11,0.15)" },  // amber
];

// Which color families to avoid per district palette
const AVOID_MAP: Record<string, number[]> = {
  mandya: [4, 6],         // avoid green, amber (sage green palette)
  mysuru: [6],             // avoid amber (gold palette)
  "bengaluru-urban": [0, 3], // avoid teal, blue (cool teal palette)
  hyderabad: [2, 6],       // avoid coral, amber (terracotta palette)
  chennai: [0],            // avoid teal (ocean teal palette)
  "new-delhi": [6],        // avoid amber (sandstone palette)
  mumbai: [3],             // avoid blue (steel blue palette)
  kolkata: [6],            // avoid amber (ochre palette)
  lucknow: [5, 1],         // avoid pink, purple (mauve palette)
  "dima-hasao": [4],       // avoid green (green forest/hills palette)
  guwahati: [3],           // avoid blue (river blue palette)
};


function getBadgeColors(districtSlug: string, count: number) {
  const avoid = new Set(AVOID_MAP[districtSlug] ?? []);
  const available = BADGE_COLORS.map((c, i) => ({ ...c, idx: i })).filter((c) => !avoid.has(c.idx));
  return Array.from({ length: count }, (_, i) => available[i % available.length]);
}

interface Props {
  badges: DistrictBadge[];
  districtSlug: string;
}

export default function DistrictBadges({ badges, districtSlug }: Props) {
  if (!badges || badges.length === 0) return null;

  const colors = getBadgeColors(districtSlug, badges.length);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {badges.map((b, i) => {
        const c = colors[i];
        return (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {b.emoji} {b.label}
          </span>
        );
      })}
    </div>
  );
}

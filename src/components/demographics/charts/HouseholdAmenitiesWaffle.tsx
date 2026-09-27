"use client";

// Household amenities (electricity, tap water, toilet, clean cooking fuel)
// as 10 × 10 "waffles": each square is 1 % of households. Every waffle has
// its own label and emoji, so colour is not needed to tell them apart —
// filled squares use the page hue (Design v4), empty squares a soft tint.
// The grid wraps on phones so nothing scrolls sideways.
import {
  isNonEmptyObject,
  type HouseholdAmenitiesData,
  type ProfileLike,
} from "../types";
import { ChartEmpty } from "../chartKit";

interface Props {
  amenities: HouseholdAmenitiesData | null | undefined;
}

/** The four amenities we draw, in order (also used by the page's table view). */
export const AMENITIES: {
  key: keyof HouseholdAmenitiesData;
  label: string;
  emoji: string;
}[] = [
  { key: "electricityPct", label: "Electricity", emoji: "💡" },
  { key: "tapWaterPct", label: "Tap water", emoji: "🚰" },
  { key: "toiletPct", label: "Toilet", emoji: "🚽" },
  { key: "lpgCleanFuelPct", label: "Clean cooking fuel", emoji: "🔥" },
];

export function canRenderHouseholdAmenitiesWaffle(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.householdAmenities);
}

function Waffle({ pct, emoji, label }: { pct: number; emoji: string; label: string }) {
  const filled = Math.round(Math.max(0, Math.min(100, pct)));
  return (
    <div style={{ textAlign: "center" }}>
      <div className="ftp-emoji" aria-hidden style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div
        role="img"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 2,
          width: 120,
          margin: "0 auto",
        }}
        aria-label={`${label}: ${pct.toFixed(1)} percent of households`}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              background: i < filled ? "var(--hue)" : "var(--hue-tint)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div className="ftp-bignum" style={{ marginTop: 8, fontSize: 20, lineHeight: "26px", color: "var(--hue-deep)" }}>
        {pct.toFixed(1)}%
      </div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</div>
    </div>
  );
}

export default function HouseholdAmenitiesWaffle({ amenities }: Props) {
  if (!amenities) {
    return <ChartEmpty message="Household amenities are not available for this district yet." />;
  }
  const available = AMENITIES.filter((a) => typeof amenities[a.key] === "number");
  if (available.length === 0) {
    return <ChartEmpty message="Household amenities are not available for this district yet." />;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 20,
        padding: "12px 0",
      }}
    >
      {available.map((a) => (
        <Waffle
          key={a.key as string}
          pct={amenities[a.key] as number}
          emoji={a.emoji}
          label={a.label}
        />
      ))}
    </div>
  );
}

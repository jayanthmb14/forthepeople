"use client";

// Household amenities (electricity, tap water, toilet, clean cooking fuel)
// as 10 × 10 "waffles": each square is 1 % of households. Filled squares use
// the colour-blind-safe Okabe-Ito palette (../types); empty squares and text
// use design tokens. The grid wraps on phones so nothing scrolls sideways.
import {
  OKABE_ITO,
  isNonEmptyObject,
  type HouseholdAmenitiesData,
  type ProfileLike,
} from "../types";
import { ChartEmpty } from "../chartKit";

interface Props {
  amenities: HouseholdAmenitiesData | null | undefined;
}

const AMENITIES: {
  key: keyof HouseholdAmenitiesData;
  label: string;
  color: string;
}[] = [
  { key: "electricityPct", label: "Electricity", color: OKABE_ITO.yellow },
  { key: "tapWaterPct", label: "Tap Water", color: OKABE_ITO.skyBlue },
  { key: "toiletPct", label: "Toilet", color: OKABE_ITO.bluishGreen },
  { key: "lpgCleanFuelPct", label: "Clean Cooking Fuel", color: OKABE_ITO.orange },
];

export function canRenderHouseholdAmenitiesWaffle(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.householdAmenities);
}

function Waffle({ pct, color, label }: { pct: number; color: string; label: string }) {
  const filled = Math.round(Math.max(0, Math.min(100, pct)));
  return (
    <div style={{ textAlign: "center" }}>
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
              background: i < filled ? color : "var(--ftp-surface-2)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div className="ftp-num" style={{ marginTop: 8, fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
        {pct.toFixed(1)}%
      </div>
      <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</div>
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
          color={a.color}
          label={a.label}
        />
      ))}
    </div>
  );
}

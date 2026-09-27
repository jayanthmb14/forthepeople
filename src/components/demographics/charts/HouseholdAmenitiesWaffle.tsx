"use client";

// Household amenities (electricity, tap water, toilet, clean cooking fuel)
// as 10 × 10 "waffles": each square is 1 % of households. Every waffle has
// its own label and emoji, so colour is not needed to tell them apart —
// filled squares use the page hue (Design v4), empty squares a soft tint.
// The grid wraps on phones so nothing scrolls sideways.
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import {
  isNonEmptyObject,
  type HouseholdAmenitiesData,
  type ProfileLike,
} from "../types";
import { ChartEmpty } from "../chartKit";

interface Props {
  amenities: HouseholdAmenitiesData | null | undefined;
}

/** The four amenities we draw, in order (also used by the page's table view).
 *  `label` is the English fallback; the shown name is page_population.amenities.<key>. */
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
  const t = useTranslations("page_population");
  const f = useFormat();
  const pctText = f.number(pct / 100, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
        aria-label={t("amenityAria", { label, pct: pctText })}
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
        {pctText}
      </div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</div>
    </div>
  );
}

export default function HouseholdAmenitiesWaffle({ amenities }: Props) {
  const t = useTranslations("page_population");
  if (!amenities) {
    return <ChartEmpty message={t("amenitiesEmpty")} />;
  }
  const available = AMENITIES.filter((a) => typeof amenities[a.key] === "number");
  if (available.length === 0) {
    return <ChartEmpty message={t("amenitiesEmpty")} />;
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
          label={t(`amenities.${a.key}`)}
        />
      ))}
    </div>
  );
}

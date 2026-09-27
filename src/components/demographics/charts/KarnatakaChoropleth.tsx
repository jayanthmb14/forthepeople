"use client";

// District choropleth for Karnataka. Each district is shaded on a five-step
// single-hue ramp built from the brand token (light → dark), so the scale
// follows light / dark mode and stays readable for colour-blind readers
// (single-hue sequential ramps only vary in lightness). Districts without a
// value use the "locked" map token.
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { ChartEmpty } from "../chartKit";

export interface DistrictValue {
  districtId?: string;
  slug: string;
  value: number | null;
}

interface Props {
  values: DistrictValue[];
  metric?: string;
  colorScale?: (v: number | null, min: number, max: number) => string;
}

// Five-step sequential ramp: brand mixed into the surface at 15 → 100 %.
const DEFAULT_PALETTE = [15, 35, 55, 75, 100].map(
  (p) => `color-mix(in srgb, var(--ftp-map-live) ${p}%, var(--ftp-surface))`,
);

function defaultColorScale(v: number | null, min: number, max: number): string {
  if (v == null || !isFinite(v)) return "var(--ftp-map-locked)";
  const span = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (v - min) / span));
  const idx = Math.min(DEFAULT_PALETTE.length - 1, Math.floor(ratio * DEFAULT_PALETTE.length));
  return DEFAULT_PALETTE[idx];
}

export function canRenderKarnatakaChoropleth(
  values: DistrictValue[] | null | undefined,
): boolean {
  return Array.isArray(values) && values.length > 0;
}

type GeoFeature = {
  rsmKey: string;
  properties: { name?: string; slug?: string; [k: string]: unknown };
};

export default function KarnatakaChoropleth({
  values,
  metric = "value",
  colorScale = defaultColorScale,
}: Props) {
  const [hovered, setHovered] = useState<{ name: string; v: number | null } | null>(null);

  if (!Array.isArray(values) || values.length === 0) {
    return <ChartEmpty message="District-level data is not loaded yet for the Karnataka map." />;
  }

  const bySlug = new Map(values.map((v) => [v.slug, v.value]));
  const nums = values
    .map((v) => v.value)
    .filter((n): n is number => typeof n === "number" && isFinite(n));
  const min = nums.length ? Math.min(...nums) : 0;
  const max = nums.length ? Math.max(...nums) : 1;

  return (
    <div>
      <div style={{ width: "100%" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 4200, center: [76.5, 14.7] }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography="/geo/karnataka-districts.json">
            {({ geographies }: { geographies: GeoFeature[] }) =>
              geographies.map((geo) => {
                const slug = String(geo.properties.slug ?? "");
                const v = bySlug.get(slug) ?? null;
                const fill = colorScale(v, min, max);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="var(--ftp-surface)"
                    strokeWidth={0.5}
                    onMouseEnter={() =>
                      setHovered({ name: String(geo.properties.name ?? slug), v })
                    }
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", stroke: "var(--ftp-text)", strokeWidth: 1 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", marginTop: 6, minHeight: 20 }}>
        {hovered ? (
          <>
            <span style={{ fontWeight: 500 }}>{hovered.name}</span>:{" "}
            {hovered.v != null ? (
              <><span className="ftp-num">{hovered.v.toFixed(2)}</span> {metric}</>
            ) : (
              "data not available"
            )}
          </>
        ) : (
          <span style={{ color: "var(--ftp-text-2)" }}>Hover a district to see its {metric}.</span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 6,
          fontSize: 11,
          color: "var(--ftp-text-2)",
        }}
      >
        <span>Low</span>
        {DEFAULT_PALETTE.map((c) => (
          <span key={c} aria-hidden style={{ width: 20, height: 10, background: c, display: "inline-block" }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

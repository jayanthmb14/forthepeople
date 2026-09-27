/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Annotation } from "react-simple-maps";
import { MapTooltip, tint } from "@/components/map/mapTheme";

// Projection centers per district
const DISTRICT_PROJECTION: Record<string, { center: [number, number]; scale: number }> = {
  "mandya":          { center: [76.77, 12.55], scale: 16000 },
  "bengaluru-urban": { center: [77.65, 12.95], scale: 22000 },
  "mysuru":          { center: [76.60, 12.30], scale: 7500  },
  "new-delhi":       { center: [77.21, 28.61], scale: 80000 },
  "mumbai":          { center: [72.87, 19.08], scale: 14000 },
  "chennai":         { center: [80.22, 13.05], scale: 22000 },
  "kolkata":         { center: [88.37, 22.55], scale: 25000 },
  "lucknow":         { center: [80.90, 26.85], scale: 10000 },
  "pune":            { center: [73.86, 18.52], scale: 6000  },
};
const DEFAULT_PROJECTION = { center: [76.77, 12.55] as [number, number], scale: 16000 };

// Taluk colours — each neighbouring taluk gets a different hue so the
// boundaries are easy to tell apart. The hues are the accent ramps already
// declared on :root (`--accent-<name>-700`), so there is no hex here and
// they follow dark mode. Fill = the hue at 22 % over transparent.
type TalukHue = "blue" | "forest-green" | "amber" | "coral" | "purple" | "pink" | "teal";
const TALUK_HUE: Record<string, TalukHue> = {
  "mandya": "blue", "maddur": "forest-green", "malavalli": "amber", "srirangapatna": "coral",
  "nagamangala": "purple", "kr-pete": "pink", "pandavapura": "teal",
  "bengaluru-north": "blue", "bengaluru-south": "forest-green", "bengaluru-east": "purple", "anekal": "amber",
  "mysuru-taluk": "blue", "nanjangud": "forest-green", "t-narasipur": "amber", "hunsur": "coral",
  "hd-kote": "purple", "periyapatna": "pink", "kr-nagar": "teal",
  // New Delhi
  "connaught-place": "blue", "chanakyapuri": "forest-green", "lodhi-road": "amber",
  // Mumbai
  "south-mumbai": "blue", "western-suburbs": "forest-green", "eastern-suburbs": "amber",
  "navi-mumbai-zone": "purple", "north-mumbai": "pink",
  // Chennai
  "chennai-north": "blue", "chennai-south": "forest-green", "chennai-central": "amber", "chennai-west": "purple",
  // Kolkata
  "kolkata-north": "blue", "kolkata-south": "forest-green", "kolkata-central": "amber", "kolkata-east": "purple",
  // Lucknow
  "lucknow-city": "blue", "mohanlalganj": "forest-green", "malihabad": "amber", "bakshi-ka-talab": "purple",
};

/** Fill + stroke for a taluk (unknown taluks fall back to the map's live blue). */
function talukColors(slug: string): { fill: string; hover: string; pressed: string; stroke: string } {
  const hue = TALUK_HUE[slug];
  const stroke = hue ? `var(--accent-${hue}-700)` : "var(--ftp-map-live)";
  return { fill: tint(stroke, hue ? 22 : 18), hover: tint(stroke, 35), pressed: tint(stroke, 50), stroke };
}

// GeoJSON name → taluk slug
const NAME_TO_SLUG: Record<string, string> = {
  "Mandya": "mandya", "Maddur": "maddur", "Malavalli": "malavalli",
  "Srirangapatna": "srirangapatna", "Srirangapattana": "srirangapatna",
  "Nagamangala": "nagamangala", "K R Pete": "kr-pete", "Krishnarajapete": "kr-pete",
  "Pandavapura": "pandavapura",
  "Bengaluru North": "bengaluru-north", "Bengaluru South": "bengaluru-south",
  "Bengaluru East": "bengaluru-east", "Anekal": "anekal",
  "Mysuru": "mysuru-taluk", "Nanjangud": "nanjangud", "T. Narasipura": "t-narasipur",
  "Hunsur": "hunsur", "H.D. Kote": "hd-kote", "Periyapatna": "periyapatna",
  "K.R. Nagar": "kr-nagar",
  // New Delhi
  "Connaught Place": "connaught-place", "Chanakyapuri": "chanakyapuri", "Lodhi Road": "lodhi-road",
  // Mumbai
  "South Mumbai": "south-mumbai", "Western Suburbs": "western-suburbs",
  "Eastern Suburbs": "eastern-suburbs", "Harbour Zone": "navi-mumbai-zone", "North Mumbai": "north-mumbai",
  // Chennai
  "Chennai North": "chennai-north", "Chennai South": "chennai-south",
  "Chennai Central": "chennai-central", "Chennai West": "chennai-west",
  // Kolkata
  "North Kolkata": "kolkata-north", "South Kolkata": "kolkata-south",
  "Central Kolkata": "kolkata-central", "East Kolkata": "kolkata-east",
  // Lucknow
  "Lucknow City": "lucknow-city", "Mohanlalganj": "mohanlalganj",
  "Malihabad": "malihabad", "Bakshi Ka Talab": "bakshi-ka-talab",
};

interface TalukMapProps {
  locale: string;
  state: string;
  district: string;
  taluks?: Array<{ slug: string; name: string; population?: number; villageCount?: number }>;
}

// Compute centroid of a coordinate ring for label placement
function ringCentroid(ring: number[][]): [number, number] {
  let x = 0, y = 0;
  for (const [cx, cy] of ring) { x += cx; y += cy; }
  return [x / ring.length, y / ring.length];
}

export default function TalukMap({ locale, state, district, taluks = [] }: TalukMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  const proj = DISTRICT_PROJECTION[district] ?? DEFAULT_PROJECTION;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 300 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: proj.center, scale: proj.scale }}
        style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
      >
        <Geographies geography={`/geo/${district}-taluks.json`}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }> }) =>
            geographies.map((geo) => {
              const geoName = geo.properties?.name as string ?? "";
              const slug =
                NAME_TO_SLUG[geoName] ??
                (geo.properties?.slug as string) ??
                geoName.toLowerCase().replace(/\s+/g, "-");
              const colors = talukColors(slug);
              const dbTaluk = taluks.find((t) => t.slug === slug);
              const displayName = dbTaluk?.name ?? geoName;

              // Label position from polygon centroid
              let labelAt: [number, number] | null = null;
              try {
                const coords = geo.geometry.type === "MultiPolygon"
                  ? (geo.geometry.coordinates as number[][][][])[0][0]
                  : (geo.geometry.coordinates as number[][][])[0];
                labelAt = ringCentroid(coords);
              } catch { /* no label */ }

              return (
                <React.Fragment key={geo.rsmKey}>
                  <Geography
                    geography={geo}
                    onClick={() => router.push(`/${locale}/${state}/${district}/${slug}`)}
                    onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({ name: displayName, x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }
                    }}
                    onMouseMove={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) {
                        setTooltip((t) => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { fill: colors.fill, stroke: colors.stroke, strokeWidth: 1.5, outline: "none", cursor: "pointer" },
                      hover:   { fill: colors.hover, stroke: colors.stroke, strokeWidth: 2.5, outline: "none", cursor: "pointer" },
                      pressed: { fill: colors.pressed, outline: "none" },
                    }}
                  />
                  {labelAt && (
                    <Annotation subject={labelAt} dx={0} dy={0} connectorProps={{ stroke: "none" }}>
                      <text
                        textAnchor="middle"
                        style={{
                          fontSize: 9,
                          fill: "var(--ftp-text)",
                          fontFamily: "var(--ftp-font-sans)",
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {displayName}
                      </text>
                    </Annotation>
                  )}
                </React.Fragment>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <MapTooltip name={tooltip.name} active x={tooltip.x} y={tooltip.y} maxLeft={240} />
      )}

      {/* Hint */}
      <div
        style={{
          position: "absolute", bottom: 6, right: 8,
          background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-tile)", padding: "3px 8px", fontSize: 11, lineHeight: "16px",
          color: "var(--ftp-text-2)",
          pointerEvents: "none",
        }}
      >
        Click taluk to explore
      </div>
    </div>
  );
}

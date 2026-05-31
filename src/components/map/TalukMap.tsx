/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Annotation } from "react-simple-maps";

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
  "dima-hasao":      { center: [93.02, 25.18], scale: 11000 },
  "guwahati":        { center: [91.75, 26.15], scale: 18000 },
};
const DEFAULT_PROJECTION = { center: [76.77, 12.55] as [number, number], scale: 16000 };

// Taluk colors
const TALUK_COLORS: Record<string, { fill: string; stroke: string }> = {
  "mandya":           { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "maddur":           { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "malavalli":        { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "srirangapatna":    { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
  "nagamangala":      { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  "kr-pete":          { fill: "rgba(236,72,153,0.22)",  stroke: "#DB2777" },
  "pandavapura":      { fill: "rgba(20,184,166,0.22)",  stroke: "#0D9488" },
  "bengaluru-north":  { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "bengaluru-south":  { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "bengaluru-east":   { fill: "rgba(124,58,237,0.22)",  stroke: "#7C3AED" },
  "anekal":           { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "mysuru-taluk":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "nanjangud":        { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "t-narasipur":      { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "hunsur":           { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
  "hd-kote":          { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  "periyapatna":      { fill: "rgba(236,72,153,0.22)",  stroke: "#DB2777" },
  "kr-nagar":         { fill: "rgba(20,184,166,0.22)",  stroke: "#0D9488" },
  // New Delhi
  "connaught-place":  { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "chanakyapuri":     { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "lodhi-road":       { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  // Mumbai
  "south-mumbai":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "western-suburbs":  { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "eastern-suburbs":  { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "navi-mumbai-zone": { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  "north-mumbai":     { fill: "rgba(236,72,153,0.22)",  stroke: "#DB2777" },
  // Chennai
  "chennai-north":    { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "chennai-south":    { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "chennai-central":  { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "chennai-west":     { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  // Kolkata
  "kolkata-north":    { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "kolkata-south":    { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "kolkata-central":  { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "kolkata-east":     { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  // Lucknow
  "lucknow-city":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "mohanlalganj":     { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "malihabad":        { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "bakshi-ka-talab":  { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  // Dima Hasao
  "haflong":          { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "mahur":            { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "maibong":          { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "umrangso":         { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
  // Kamrup Metro
  "dispur":           { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
  "guwahati-taluk":   { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
  "sonapur":          { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
  "azara":            { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
  "chandrapur":       { fill: "rgba(236,72,153,0.22)",  stroke: "#DB2777" },
};
const DEFAULT_COLOR = { fill: "rgba(37,99,235,0.18)", stroke: "#2563EB" };

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
  // Dima Hasao
  "Haflong": "haflong", "Mahur": "mahur", "Maibong": "maibong", "Umrangso": "umrangso",
  // Kamrup Metro
  "Dispur": "dispur", "Guwahati": "guwahati-taluk", "Sonapur": "sonapur", "Azara": "azara", "Chandrapur": "chandrapur",
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
              const colors = TALUK_COLORS[slug] ?? DEFAULT_COLOR;
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
                      hover:   { fill: colors.stroke, fillOpacity: 0.35, stroke: colors.stroke, strokeWidth: 2.5, outline: "none", cursor: "pointer" },
                      pressed: { fill: colors.stroke, fillOpacity: 0.5, outline: "none" },
                    }}
                  />
                  {labelAt && (
                    <Annotation subject={labelAt} dx={0} dy={0} connectorProps={{ stroke: "none" }}>
                      <text
                        textAnchor="middle"
                        style={{
                          fontSize: 9,
                          fill: "#1A1A1A",
                          fontFamily: "var(--font-sans, sans-serif)",
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
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 10, 240),
            top: Math.max(tooltip.y - 36, 4),
            background: "#1A1A1A", color: "#FFFFFF",
            padding: "4px 10px", borderRadius: 6,
            fontSize: 12, fontWeight: 500,
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
          }}
        >
          {tooltip.name}
          <span style={{ color: "#93C5FD", marginLeft: 6 }}>→ Explore</span>
        </div>
      )}

      {/* Hint */}
      <div
        style={{
          position: "absolute", bottom: 6, right: 8,
          background: "rgba(255,255,255,0.9)", border: "1px solid #E8E8E4",
          borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#6B6B6B",
          pointerEvents: "none",
        }}
      >
        Click taluk to explore
      </div>
    </div>
  );
}

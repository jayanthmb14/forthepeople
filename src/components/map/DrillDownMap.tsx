/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Lock } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";

// Maps GeoJSON `name` property → our state slugs
const GEO_NAME_TO_SLUG: Record<string, string> = {
  "Andaman & Nicobar Island": "andaman-nicobar",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  "Assam": "assam",
  "Bihar": "bihar",
  "Chandigarh": "chandigarh",
  "Chhattisgarh": "chhattisgarh",
  "Dadra and Nagar Haveli": "dadra-nagar-haveli",
  "Daman and Diu": "dadra-nagar-haveli",
  "NCT of Delhi": "delhi",
  "Delhi": "delhi",
  "Goa": "goa",
  "Gujarat": "gujarat",
  "Haryana": "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu & Kashmir": "jammu-kashmir",
  "Jharkhand": "jharkhand",
  "Karnataka": "karnataka",
  "Kerala": "kerala",
  "Ladakh": "ladakh",
  "Lakshadweep": "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  "Maharashtra": "maharashtra",
  "Manipur": "manipur",
  "Meghalaya": "meghalaya",
  "Mizoram": "mizoram",
  "Nagaland": "nagaland",
  "Odisha": "odisha",
  "Puducherry": "puducherry",
  "Punjab": "punjab",
  "Rajasthan": "rajasthan",
  "Sikkim": "sikkim",
  "Tamil Nadu": "tamil-nadu",
  "Telangana": "telangana",
  "Tripura": "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  "Uttarakhand": "uttarakhand",
  "West Bengal": "west-bengal",
};

interface DrillDownMapProps {
  locale: string;
}

export default function DrillDownMap({ locale }: DrillDownMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; active: boolean; x: number; y: number } | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 420, background: "#DDEEFF", borderRadius: 8 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82.5, 23.0], scale: 900 }}
        width={800}
        height={900}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={4}>
          <Geographies geography="/geo/india-states.json?v=4">
            {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, string> }> }) =>
              [...geographies].sort((a, b) => {
                const aSlug = GEO_NAME_TO_SLUG[a.properties?.name ?? a.properties?.NAME_1 ?? ""];
                const bSlug = GEO_NAME_TO_SLUG[b.properties?.name ?? b.properties?.NAME_1 ?? ""];
                const aActive = !!(aSlug && INDIA_STATES.find((s) => s.slug === aSlug)?.active);
                const bActive = !!(bSlug && INDIA_STATES.find((s) => s.slug === bSlug)?.active);
                return (aActive ? 1 : 0) - (bActive ? 1 : 0);
              }).map((geo) => {
                const geoName: string = geo.properties?.name ?? geo.properties?.NAME_1 ?? "";
                const slug = GEO_NAME_TO_SLUG[geoName];
                const state = slug ? INDIA_STATES.find((s) => s.slug === slug) : undefined;
                const isActive = !!state?.active;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={isActive ? "ftp-geo-active" : "ftp-geo-locked"}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => {
                      if (isActive && state) {
                        router.push(`/${locale}/${state.slug}`);
                      }
                    }}
                    onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({ name: geoName, active: isActive, x: e.clientX - rect.left, y: e.clientY - rect.top });
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
                      default: {
                        fill: isActive ? "#4A90D9" : "#B8C4CE",
                        stroke: "#FFFFFF",
                        strokeWidth: isActive ? 1.5 : 0.8,
                        outline: "none",
                        cursor: isActive ? "pointer" : "default",
                        transition: "fill 200ms",
                      },
                      hover: {
                        fill: isActive ? "#2563EB" : "#9AA5AF",
                        stroke: "#FFFFFF",
                        strokeWidth: isActive ? 2 : 0.8,
                        outline: "none",
                        cursor: isActive ? "pointer" : "not-allowed",
                      },
                      pressed: {
                        fill: isActive ? "#1D4ED8" : "#9AA5AF",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 10, 240),
            top: Math.max(tooltip.y - 36, 4),
            background: "#1A1A1A",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {!tooltip.active && <Lock size={10} style={{ opacity: 0.7 }} />}
          {tooltip.name}
          {tooltip.active && <span style={{ color: "#93C5FD", marginLeft: 4 }}>→ Explore</span>}
          {!tooltip.active && <span style={{ color: "#9B9B9B", marginLeft: 4 }}>Coming soon</span>}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute", bottom: 8, right: 8,
          display: "flex", flexDirection: "column", gap: 4,
          background: "rgba(255,255,255,0.92)", border: "1px solid #E8E8E4",
          borderRadius: 8, padding: "5px 9px", fontSize: 10, color: "#6B6B6B",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 8, background: "#4A90D9", border: "1px solid #FFFFFF", borderRadius: 2 }} />
          Active
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 8, background: "#B8C4CE", border: "1px solid #FFFFFF", borderRadius: 2 }} />
          Coming Soon
        </div>
      </div>
    </div>
  );
}

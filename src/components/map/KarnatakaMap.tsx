/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Lock } from "lucide-react";

interface KarnatakaMapProps {
  locale: string;
  activeDistricts: Set<string>; // set of active district slugs
}

export default function KarnatakaMap({ locale, activeDistricts }: KarnatakaMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; active: boolean; x: number; y: number } | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [76.5, 15.3], scale: 3200 }}
        width={500}
        height={450}
        style={{ width: "100%", height: "auto", maxHeight: "100%", display: "block" }}
      >
        <Geographies geography="/geo/karnataka-districts.json">
          {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, string | boolean> }> }) =>
            geographies.map((geo) => {
              const slug = geo.properties?.slug as string ?? "";
              const name = geo.properties?.name as string ?? "";
              const isActive = activeDistricts.has(slug);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (isActive) {
                      router.push(`/${locale}/karnataka/${slug}`);
                    }
                  }}
                  onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                    const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({ name, active: isActive, x: e.clientX - rect.left, y: e.clientY - rect.top });
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
                      fill: isActive ? "rgba(37,99,235,0.18)" : "#E8E8E4",
                      stroke: isActive ? "#2563EB" : "#FFFFFF",
                      strokeWidth: isActive ? 1.5 : 0.8,
                      outline: "none",
                      cursor: isActive ? "pointer" : "default",
                      transition: "fill 150ms",
                    },
                    hover: {
                      fill: isActive ? "#EFF6FF" : "#D4D4D0",
                      stroke: isActive ? "#1D4ED8" : "#FFFFFF",
                      strokeWidth: isActive ? 2 : 0.8,
                      outline: "none",
                      cursor: isActive ? "pointer" : "not-allowed",
                    },
                    pressed: {
                      fill: isActive ? "rgba(37,99,235,0.45)" : "#D4D4D0",
                      outline: "none",
                    },
                  }}
                />
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
            left: Math.min(tooltip.x + 10, 260),
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
          <div style={{ width: 12, height: 8, background: "rgba(37,99,235,0.18)", border: "1px solid #2563EB", borderRadius: 2 }} />
          Active
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 8, background: "#E8E8E4", border: "1px solid #CCCCCC", borderRadius: 2 }} />
          Coming Soon
        </div>
      </div>
    </div>
  );
}

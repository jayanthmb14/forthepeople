/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoStyle, MapLegend, MapTooltip } from "@/components/map/mapTheme";

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
                  // Colours come from the shared map theme (design tokens).
                  style={geoStyle(isActive)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <MapTooltip name={tooltip.name} active={tooltip.active} x={tooltip.x} y={tooltip.y} maxLeft={260} />
      )}

      {/* Legend */}
      <MapLegend liveLabel="Active" lockedLabel="Coming soon" />
    </div>
  );
}

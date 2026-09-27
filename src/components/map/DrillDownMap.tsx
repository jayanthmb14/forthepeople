/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { geoStyle, MapLegend, MapTooltip } from "@/components/map/mapTheme";
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
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 420, background: "var(--ftp-surface-2)", borderRadius: "var(--ftp-radius-tile)" }}>
      <ComposableMap
        projection="geoMercator"
        // Centre and scale chosen so mainland India plus the Andaman & Nicobar
        // Islands fill ~86% of the 800 × 900 viewBox (Mercator bounds
        // 68.1–97.4°E, 6.7–37.1°N). The old scale (900) left ~40% empty,
        // which is why the homepage used to add a CSS zoom that cropped it.
        projectionConfig={{ center: [82.75, 22.7], scale: 1350 }}
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
                    // v3: no glow pulse on active states (the old
                    // .ftp-geo-active class animated a drop-shadow), so no
                    // class here — colour alone marks an active state.
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
                    // Solid fills on the India map (states are small at this
                    // scale). Colours come from the shared map theme.
                    style={geoStyle(isActive, true)}
                  />
                );
              })
            }
          </Geographies>

          {/* v4: a saffron pin with a soft pulse on every LIVE district.
              Clicking a pin opens that district. */}
          {INDIA_STATES.flatMap((st) =>
            st.districts
              .filter((d) => d.active && DISTRICT_CENTROIDS[`${st.slug}/${d.slug}`])
              .map((d) => {
                const c = DISTRICT_CENTROIDS[`${st.slug}/${d.slug}`];
                return (
                  <Marker
                    key={`${st.slug}/${d.slug}`}
                    coordinates={[c.lng, c.lat]}
                    onClick={() => router.push(`/${locale}/${st.slug}/${d.slug}`)}
                    style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: { cursor: "pointer" } }}
                  >
                    <title>{`${d.name}, ${st.name}: open dashboard`}</title>
                    <circle r={9} fill="#F97316" opacity={0.35} className="ftp-map-ping" />
                    <circle r={5} fill="#F97316" stroke="#fff" strokeWidth={2} />
                  </Marker>
                );
              }),
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <MapTooltip name={tooltip.name} active={tooltip.active} x={tooltip.x} y={tooltip.y} maxLeft={240} />
      )}

      {/* Legend */}
      <MapLegend solid liveLabel="Active" lockedLabel="Coming soon" />
    </div>
  );
}

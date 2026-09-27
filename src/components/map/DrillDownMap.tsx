/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from "react-simple-maps";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { getDistrictIcon } from "@/components/district/icons";
import { HUE_HEX, getDistrictHue } from "@/lib/design/hues";
import { geoStyle, MapLegend, MapTooltip } from "@/components/map/mapTheme";
import { INDIA_STATES } from "@/lib/constants/districts";
import { INDIA_STATE_NAME_TO_SLUG } from "@/lib/geo/aliases";

// Maps GeoJSON `name` property → our state slugs
const GEO_NAME_TO_SLUG = INDIA_STATE_NAME_TO_SLUG;

/** One live-district pin, with its badge position fanned out if crowded. */
interface Pin {
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  lat: number;
  lng: number;
  pinLat: number;
  pinLng: number;
  moved: boolean;
  color: string;
  Icon: ReturnType<typeof getDistrictIcon>;
}

/** Degrees within which two pins are "crowded", and the ring radius they fan out to. */
const CROWD_DEG = 1.6;
const RING_DEG = 1.75;

function buildPins(): Pin[] {
  const pins: Pin[] = [];
  for (const st of INDIA_STATES) {
    for (const d of st.districts) {
      const c = d.active ? DISTRICT_CENTROIDS[`${st.slug}/${d.slug}`] : undefined;
      if (!c) continue;
      pins.push({
        slug: d.slug, name: d.name, stateSlug: st.slug, stateName: st.name,
        lat: c.lat, lng: c.lng, pinLat: c.lat, pinLng: c.lng, moved: false,
        color: HUE_HEX[getDistrictHue(d.slug)].hue, Icon: getDistrictIcon(d.slug),
      });
    }
  }
  // Greedy clusters, then spread each crowded cluster around its centre.
  const seen = new Set<number>();
  for (let i = 0; i < pins.length; i++) {
    if (seen.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < pins.length; j++) {
      if (seen.has(j)) continue;
      if (group.some((g) => Math.hypot(pins[g].lat - pins[j].lat, pins[g].lng - pins[j].lng) < CROWD_DEG)) group.push(j);
    }
    group.forEach((g) => seen.add(g));
    if (group.length < 2) continue;
    const cLat = group.reduce((s, g) => s + pins[g].lat, 0) / group.length;
    const cLng = group.reduce((s, g) => s + pins[g].lng, 0) / group.length;
    group.forEach((g, k) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / group.length;
      pins[g].pinLat = cLat + RING_DEG * Math.sin(a);
      pins[g].pinLng = cLng + RING_DEG * Math.cos(a);
      pins[g].moved = true;
    });
  }
  return pins;
}

const LIVE_PINS = buildPins();

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

          {/* v4: illustrated pins. Districts that sit close together (e.g.
              Mandya, Mysuru, Bengaluru) fan out into a ring; a thin leader
              line and a dot keep each badge tied to its real location. */}
          {LIVE_PINS.map((pin) => (
            <g key={`${pin.stateSlug}/${pin.slug}`}>
              {pin.moved && (
                <>
                  <Line from={[pin.lng, pin.lat]} to={[pin.pinLng, pin.pinLat]} stroke={pin.color} strokeWidth={1.5} strokeLinecap="round" />
                  <Marker coordinates={[pin.lng, pin.lat]}>
                    <circle r={3} fill={pin.color} stroke="#fff" strokeWidth={1} />
                  </Marker>
                </>
              )}
              <Marker
                coordinates={[pin.pinLng, pin.pinLat]}
                onClick={() => router.push(`/${locale}/${pin.stateSlug}/${pin.slug}`)}
                style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: { cursor: "pointer" } }}
              >
                <title>{`${pin.name}, ${pin.stateName}`}</title>
                <circle r={21} fill={pin.color} opacity={0.25} className="ftp-map-ping" />
                <circle r={18} fill="#fff" stroke={pin.color} strokeWidth={3} />
                {pin.Icon ? (
                  <g transform="translate(-12,-12)">
                    <pin.Icon size={24} />
                  </g>
                ) : (
                  <circle r={5} fill={pin.color} />
                )}
              </Marker>
            </g>
          ))}
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

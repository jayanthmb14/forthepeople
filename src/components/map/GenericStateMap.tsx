/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoStyle, MapLegend, MapTooltip } from "@/components/map/mapTheme";

interface GenericStateMapProps {
  locale: string;
  stateSlug: string;
  activeDistricts: Set<string>;
}

function computeCenter(geojson: { features: Array<{ geometry: { coordinates: number[][][][] | number[][][] | number[][] } }> }): [number, number] {
  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
  for (const f of geojson.features) {
    const coords = f.geometry.coordinates;
    const flatten = (c: unknown[]): void => {
      if (typeof c[0] === "number") {
        const [lng, lat] = c as number[];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        for (const sub of c) flatten(sub as unknown[]);
      }
    };
    flatten(coords as unknown[]);
  }
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

function computeScale(geojson: { features: Array<{ geometry: { coordinates: number[][][][] | number[][][] | number[][] } }> }): number {
  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
  for (const f of geojson.features) {
    const coords = f.geometry.coordinates;
    const flatten = (c: unknown[]): void => {
      if (typeof c[0] === "number") {
        const [lng, lat] = c as number[];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        for (const sub of c) flatten(sub as unknown[]);
      }
    };
    flatten(coords as unknown[]);
  }
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const span = Math.max(lngSpan, latSpan);
  if (span < 1) return 8000;
  if (span < 3) return 4000;
  if (span < 5) return 3000;
  if (span < 8) return 2000;
  if (span < 12) return 1400;
  return 1000;
}

export default function GenericStateMap({ locale, stateSlug, activeDistricts }: GenericStateMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; active: boolean; x: number; y: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/geo/${stateSlug}-districts.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setGeoData)
      .catch(() => setFailed(true));
  }, [stateSlug]);

  const center = useMemo(() => geoData ? computeCenter(geoData) : [78, 22] as [number, number], [geoData]);
  const scale = useMemo(() => geoData ? computeScale(geoData) : 2000, [geoData]);

  if (failed || !geoData) return null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: center as [number, number], scale }}
        width={500}
        height={450}
        // Fill the frame; the SVG viewBox keeps the aspect ratio and centres
        // the state (default preserveAspectRatio "xMidYMid meet").
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <ZoomableGroup>
          <Geographies geography={geoData}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, string> }> }) =>
              geographies.map((geo) => {
                const slug = geo.properties?.slug ?? "";
                const name = geo.properties?.name ?? "";
                const isActive = activeDistricts.has(slug);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      router.push(`/${locale}/${stateSlug}/${slug}`);
                    }}
                    onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) setTooltip({ name, active: isActive, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) setTooltip((t) => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    // Colours from the shared map theme; locked districts still
                    // open a preview page, so they keep a pointer cursor.
                    style={geoStyle(isActive, false, true)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <MapTooltip name={tooltip.name} active={tooltip.active} x={tooltip.x} y={tooltip.y} maxLeft={260} lockedHint="Preview" />
      )}

      <MapLegend liveLabel="Active" lockedLabel="Coming soon" />
    </div>
  );
}

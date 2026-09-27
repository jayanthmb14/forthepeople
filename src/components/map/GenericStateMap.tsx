/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useTranslations } from "next-intl";
import { geoStyle, MapLegend, MapTooltip } from "@/components/map/mapTheme";
import { getState } from "@/lib/constants/districts";
import { fitMercator, pinPoint, type GeoFeature } from "@/lib/geo/fit";
import { geoToRegistrySlug, stateGeoUrl } from "@/lib/geo/aliases";

interface GenericStateMapProps {
  locale: string;
  stateSlug: string;
  activeDistricts: Set<string>;
}

export default function GenericStateMap({ locale, stateSlug, activeDistricts }: GenericStateMapProps) {
  const router = useRouter();
  const t = useTranslations("map");
  // Districts that have a page (live or preview). Shapes outside the
  // registry are shown but not clickable — they used to open a 404.
  const registered = useMemo(
    () => new Set(getState(stateSlug)?.districts.map((d) => d.slug) ?? []),
    [stateSlug],
  );
  const [tooltip, setTooltip] = useState<{ name: string; active: boolean; hint: string; x: number; y: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(stateGeoUrl(stateSlug))
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setGeoData)
      .catch(() => setFailed(true));
  }, [stateSlug]);

  // Fit the state to the frame (every state fills its card the same way).
  const { center, scale } = useMemo(
    () => (geoData ? fitMercator(geoData, 500, 450, 18) : { center: [78, 22] as [number, number], scale: 1000 }),
    [geoData],
  );
  // One pin per live district, so small ones (Hyderabad, Chennai) are easy to spot.
  const pins = useMemo(() => {
    if (!geoData) return [] as { slug: string; at: [number, number] }[];
    const seen = new Set<string>();
    const out: { slug: string; at: [number, number] }[] = [];
    for (const f of geoData.features as GeoFeature[]) {
      const slug = geoToRegistrySlug(stateSlug, String(f.properties?.slug ?? ""));
      const at = activeDistricts.has(slug) && !seen.has(slug) ? pinPoint(f) : null;
      if (at) { seen.add(slug); out.push({ slug, at }); }
    }
    return out;
  }, [geoData, stateSlug, activeDistricts]);

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
                // Map shapes use 2011 names; the registry uses current ones.
                const slug = geoToRegistrySlug(stateSlug, geo.properties?.slug ?? "");
                const name = geo.properties?.name ?? "";
                const isActive = activeDistricts.has(slug);
                const hasPage = registered.has(slug);
                const hint = hasPage ? t("preview") : t("notYet");

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (hasPage) router.push(`/${locale}/${stateSlug}/${slug}`);
                    }}
                    onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) setTooltip({ name, active: isActive, hint, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e: React.MouseEvent<SVGPathElement>) => {
                      const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                      if (rect) setTooltip((t) => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    // Colours from the shared map theme. Locked districts with
                    // a preview page keep a pointer cursor; the rest don't.
                    style={geoStyle(isActive, false, hasPage)}
                  />
                );
              })
            }
          </Geographies>
          {pins.map((p) => (
            <Marker key={p.slug} coordinates={p.at} style={{ default: { pointerEvents: "none" } }}>
              <circle r={11} className="ftp-map-ping" fill="var(--ftp-map-live)" opacity={0.35} />
              <circle r={6} fill="var(--ftp-map-live)" stroke="#fff" strokeWidth={2} />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <MapTooltip name={tooltip.name} active={tooltip.active} x={tooltip.x} y={tooltip.y} maxLeft={260} lockedHint={tooltip.hint} />
      )}

      <MapLegend />
    </div>
  );
}

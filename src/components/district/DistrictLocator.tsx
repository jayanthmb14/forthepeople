/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// DistrictLocator — "Where is Mandya?" (Design v4 overview picture).
//
// The state's district map with THIS district filled in its own colour and
// its landmark badge on top, plus one plain sentence: "Mandya is in the
// south of Karnataka." Built from the same /geo/<state>-districts.json the
// state page uses. Renders nothing if the shape file or the district is
// missing (never a wrong highlight).
"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useTranslations } from "next-intl";
import { Card } from "@/components/district/ui";
import { computeCenter, computeScale } from "@/components/map/GenericStateMap";
import { DISTRICT_ICONS } from "@/components/district/icons";
import { HUE_HEX, getDistrictHue } from "@/lib/design/hues";
import { getDistrictCentroid } from "@/lib/geo/district-centroids";

type Geo = { type: string; features: Array<{ properties: Record<string, unknown>; geometry: { coordinates: number[][][][] | number[][][] | number[][] } }> };

/** Compass word ("north", "south-east", "centre") from the offset to the state centre. */
function direction(dLat: number, dLng: number): string {
  const ns = dLat > 0.6 ? "north" : dLat < -0.6 ? "south" : "";
  const ew = dLng > 0.6 ? "east" : dLng < -0.6 ? "west" : "";
  if (!ns && !ew) return "centre";
  return ns && ew ? `${ns}-${ew}` : ns || ew;
}

export default function DistrictLocator({
  stateSlug,
  districtSlug,
  districtName,
  stateName,
}: {
  stateSlug: string;
  districtSlug: string;
  districtName: string;
  stateName: string;
}) {
  const t = useTranslations("locator");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/geo/${stateSlug}-districts.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((g: Geo) => {
        if (!cancelled) setGeo(g);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [stateSlug]);

  const center = useMemo(() => (geo ? computeCenter(geo) : ([78, 22] as [number, number])), [geo]);
  const scale = useMemo(() => (geo ? computeScale(geo) : 2000), [geo]);
  const found = useMemo(() => Boolean(geo?.features.some((f) => f.properties?.slug === districtSlug)), [geo, districtSlug]);

  if (failed || (geo && !found)) return null;

  const hue = HUE_HEX[getDistrictHue(districtSlug)];
  const c = getDistrictCentroid(stateSlug, districtSlug);
  const dir = c ? direction(c.lat - center[1], c.lng - center[0]) : null;

  return (
    <Card as="section" padding={16} aria-label={t("title", { name: districtName })} className="ftp-hue-green" tinted>
      <h3 className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>
        <span className="ftp-emoji" aria-hidden>🧭 </span>
        {t("title", { name: districtName })}
      </h3>
      {dir && (
        <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>
          {t(`sentence.${dir}`, { name: districtName, state: stateName })}
        </p>
      )}
      <div style={{ height: 280, marginTop: 8 }}>
        {geo ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center, scale: scale * 1.5 }}
            width={500}
            height={320}
            style={{ width: "100%", height: "100%" }}
            aria-hidden
          >
            <Geographies geography={geo}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, unknown> }> }) =>
                geographies.map((g) => {
                  const mine = g.properties?.slug === districtSlug;
                  return (
                    <Geography
                      key={g.rsmKey}
                      geography={g}
                      style={{
                        default: { fill: mine ? hue.hue : "#E4E2DA", stroke: "#fff", strokeWidth: 0.8, outline: "none" },
                        hover: { fill: mine ? hue.hue : "#E4E2DA", stroke: "#fff", strokeWidth: 0.8, outline: "none" },
                        pressed: { fill: mine ? hue.hue : "#E4E2DA", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
            {c && (
              <Marker coordinates={[c.lng, c.lat]} style={{ default: { transform: "translateY(-18px)" } }}>
                <circle r={16} fill={hue.hue} opacity={0.22} className="ftp-map-ping" />
                <circle r={13} fill="#fff" stroke={hue.hue} strokeWidth={2.5} />
                <Landmark slug={districtSlug} fallback={hue.hue} />
              </Marker>
            )}
          </ComposableMap>
        ) : (
          <div className="ftp-skeleton" style={{ height: "100%", borderRadius: 12 }} aria-hidden />
        )}
      </div>
    </Card>
  );
}

/** The district's landmark icon (26 px), or a plain dot when it has none. */
function Landmark({ slug, fallback }: { slug: string; fallback: string }) {
  const Icon = DISTRICT_ICONS[slug];
  if (!Icon) return <circle r={6} fill={fallback} />;
  return (
    <g transform="translate(-9,-9)">
      <Icon size={18} />
    </g>
  );
}

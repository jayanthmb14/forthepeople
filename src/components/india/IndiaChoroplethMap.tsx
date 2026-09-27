/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * India choropleth that recolors by the active metric. Reuses the
 * existing public/geo/india-states.json (sourced from datameet/maps,
 * CC-BY-SA — same as DrillDownMap on the homepage; do NOT re-fetch).
 *
 * Color scale = light grey → CATEGORY_ACCENT for the active metric's
 * category, computed in src/lib/india/mock-state-data.ts. Hover shows
 * a tooltip with state name + value + rank. Click selects a state.
 *
 * MOCK DATA — replace in Session C1 (the mock generator stays here
 * until IndiaStateBreakdown rows exist; component contract is final).
 */

"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import {
  type StateMetricValue,
  getMockMetric,
  getStateValuesForMetric,
  mockColorScale,
} from "@/lib/india/mock-state-data";

// Map GeoJSON `name` properties → our state slugs. Same map as
// DrillDownMap.tsx — names that the india-states.json file uses.
const GEO_NAME_TO_SLUG: Record<string, string> = {
  "Andaman & Nicobar Island": "andaman-nicobar",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  Assam: "assam",
  Bihar: "bihar",
  Chandigarh: "chandigarh",
  Chhattisgarh: "chhattisgarh",
  "Dadra and Nagar Haveli": "dadra-nagar-haveli",
  "Daman and Diu": "dadra-nagar-haveli",
  "NCT of Delhi": "delhi",
  Delhi: "delhi",
  Goa: "goa",
  Gujarat: "gujarat",
  Haryana: "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu & Kashmir": "jammu-kashmir",
  Jharkhand: "jharkhand",
  Karnataka: "karnataka",
  Kerala: "kerala",
  Ladakh: "ladakh",
  Lakshadweep: "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  Maharashtra: "maharashtra",
  Manipur: "manipur",
  Meghalaya: "meghalaya",
  Mizoram: "mizoram",
  Nagaland: "nagaland",
  Odisha: "odisha",
  Puducherry: "puducherry",
  Punjab: "punjab",
  Rajasthan: "rajasthan",
  Sikkim: "sikkim",
  "Tamil Nadu": "tamil-nadu",
  Telangana: "telangana",
  Tripura: "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  Uttarakhand: "uttarakhand",
  "West Bengal": "west-bengal",
};

interface Props {
  metricKey: string;
  selectedStateSlug?: string | null;
  onSelect?: (slug: string | null) => void;
}

export default function IndiaChoroplethMap({
  metricKey,
  selectedStateSlug,
  onSelect,
}: Props) {
  const metric = getMockMetric(metricKey);
  const values = getStateValuesForMetric(metricKey);
  const min = values.length ? Math.min(...values.map((v) => v.value)) : 0;
  const max = values.length ? Math.max(...values.map((v) => v.value)) : 1;
  const valueBySlug = new Map<string, StateMetricValue & { rank: number }>();
  values.forEach((v, idx) =>
    valueBySlug.set(v.stateSlug, { ...v, rank: idx + 1 }),
  );

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    valueText: string;
    rank: number;
  } | null>(null);

  return (
    <div
      className="india-choropleth-frame"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        background: INDIA_DESIGN.bgCard,
        border: `1px solid ${INDIA_DESIGN.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <style>{`
        .india-choropleth-frame { max-height: 60vh; }
        .india-choropleth-frame > svg { max-height: 60vh; height: 60vh !important; }
        @media (max-width: 768px) {
          .india-choropleth-frame { max-height: 50vh; }
          .india-choropleth-frame > svg { max-height: 50vh; height: 50vh !important; }
        }
      `}</style>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82.5, 23.0], scale: 950 }}
        width={800}
        height={900}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={4}>
          <Geographies geography="/geo/india-states.json?v=4">
            {({
              geographies,
            }: {
              geographies: Array<{
                rsmKey: string;
                properties: Record<string, string>;
              }>;
            }) =>
              geographies.map((geo) => {
                const propName =
                  (geo.properties?.name as string | undefined) ??
                  (geo.properties?.NAME_1 as string | undefined) ??
                  "";
                const slug = GEO_NAME_TO_SLUG[propName];
                const entry = slug ? valueBySlug.get(slug) : undefined;
                const fill = entry
                  ? mockColorScale(entry.value, metricKey, min, max)
                  : "#F8FAFC";
                const isSelected = !!slug && slug === selectedStateSlug;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) => {
                      if (!entry) return;
                      const rect = (
                        e.currentTarget as SVGPathElement
                      ).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        name: entry.stateName,
                        valueText:
                          entry.value.toLocaleString("en-IN") +
                          (metric?.unit ? ` ${metric.unit}` : ""),
                        rank: entry.rank,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => slug && onSelect?.(isSelected ? null : slug)}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected
                          ? INDIA_DESIGN.textPrimary
                          : "#FFFFFF",
                        strokeWidth: isSelected ? 1.4 : 0.6,
                        outline: "none",
                        cursor: entry ? "pointer" : "default",
                      },
                      hover: {
                        fill,
                        stroke: INDIA_DESIGN.textPrimary,
                        strokeWidth: 1.2,
                        outline: "none",
                        cursor: entry ? "pointer" : "default",
                      },
                      pressed: {
                        fill,
                        stroke: INDIA_DESIGN.textPrimary,
                        strokeWidth: 1.4,
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

      {/* Color legend */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          background: "rgba(255,255,255,0.95)",
          border: `1px solid ${INDIA_DESIGN.border}`,
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 11,
          color: INDIA_DESIGN.textMuted,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 600, color: INDIA_DESIGN.textSecondary }}>
          {metric?.label ?? metricKey}
          {metric?.unit ? (
            <span style={{ color: INDIA_DESIGN.textFaint, marginLeft: 4 }}>
              ({metric.unit})
            </span>
          ) : null}
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, #F1F5F9, ${
              metric ? mockColorScale(max, metricKey, min, max) : "#2563EB"
            })`,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
          <span>{min.toLocaleString("en-IN")}</span>
          <span>{max.toLocaleString("en-IN")}</span>
        </div>
        {metric && !metric.higherIsBetter ? (
          <div style={{ fontSize: 10, color: INDIA_DESIGN.textFaint, fontStyle: "italic" }}>
            (Lower = better — scale inverted)
          </div>
        ) : null}
      </div>

      {/* Tooltip — fixed-position so it floats above the map */}
      {tooltip ? (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: Math.max(0, tooltip.y - 64),
            transform: "translate(-50%, 0)",
            background: "#1A1A1A",
            color: "#FFFFFF",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.name}</div>
          <div
            style={{
              fontFamily: "var(--ftp-font-sans)",
              fontVariantNumeric: "tabular-nums",
              color: "#9CA3AF",
              display: "flex",
              gap: 8,
            }}
          >
            <span>{tooltip.valueText}</span>
            <span>·</span>
            <span>#{tooltip.rank}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

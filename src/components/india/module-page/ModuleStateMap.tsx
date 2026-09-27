/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * State-level choropleth for the module deep-dive page. Wraps the
 * shared IndiaChoroplethMap with the module's primaryMetric.
 *
 * MOCK DATA — replace in Session C1 (state values still synthesised
 * from mock-state-data; component contract is final).
 */

"use client";

import { useState } from "react";
import IndiaChoroplethMap from "../IndiaChoroplethMap";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import { IndiaSectionTitle } from "./v4";

interface Props {
  metricKey: string;
  metricLabel: string;
}

export default function ModuleStateMap({ metricKey, metricLabel }: Props) {
  const [, setSelected] = useState<string | null>(null);

  return (
    <section
      style={{
        padding: "28px 16px",
        background: INDIA_DESIGN.bgPage,
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <IndiaSectionTitle emoji="🗺️">{metricLabel} by state</IndiaSectionTitle>
        <p
          style={{
            fontSize: 13,
            color: INDIA_DESIGN.textMuted,
            margin: "0 0 14px",
            maxWidth: 640,
          }}
        >
          Each state coloured by its value for this module&apos;s headline
          metric. Hover for value + rank, click to drill in.
        </p>
        <IndiaChoroplethMap
          metricKey={metricKey}
          onSelect={setSelected}
        />
      </div>
    </section>
  );
}


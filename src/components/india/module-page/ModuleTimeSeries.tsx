/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Time-series chart on the module deep-dive page. Uses the shared
 * IndiaTimeSeriesChart wrapped with mock data so the layout exists
 * before real IndiaTimeSeries rows land.
 *
 * MOCK DATA — replace in Session C1 (10 mock points generated from
 * a string-hash so re-renders are stable).
 */

import IndiaTimeSeriesChart, {
  type TimeSeriesPoint,
} from "../IndiaTimeSeriesChart";
import { INDIA_DESIGN, CATEGORY_ACCENT } from "@/lib/india/india-design";
import type { IndiaModuleCategory } from "@/lib/india/india-modules";

interface Props {
  metricKey: string;
  metricLabel: string;
  unit?: string;
  category: IndiaModuleCategory;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) / 0x7fffffff;
}

function buildMockSeries(metricKey: string): TimeSeriesPoint[] {
  // 10 points, FY16 → FY25, with a gentle upward trend and per-year noise.
  const out: TimeSeriesPoint[] = [];
  for (let i = 0; i < 10; i++) {
    const year = 2016 + i;
    const t = i / 9;
    const seasonal = Math.sin((i / 9) * Math.PI * 2) * 0.05;
    const noise = (hash(`${metricKey}|${year}`) - 0.5) * 0.1;
    const value = Math.max(0, 50 + 50 * t + seasonal * 100 + noise * 100);
    out.push({
      date: String(year),
      value: Math.round(value * 10) / 10,
    });
  }
  return out;
}

export default function ModuleTimeSeries({
  metricKey,
  metricLabel,
  unit,
  category,
}: Props) {
  const series = buildMockSeries(metricKey);
  const accent = CATEGORY_ACCENT[category];

  return (
    <section
      style={{
        padding: "28px 16px",
        borderBottom: `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: INDIA_DESIGN.textFaint,
            }}
          >
            Trend — {metricLabel}
          </div>
          <span
            style={{
              fontSize: 10,
              color: INDIA_DESIGN.textFaint,
              fontStyle: "italic",
            }}
          >
            Mock 10-year window — replaced when IndiaTimeSeries lands
          </span>
        </div>
        <IndiaTimeSeriesChart series={series} unit={unit} color={accent} />
      </div>
    </section>
  );
}

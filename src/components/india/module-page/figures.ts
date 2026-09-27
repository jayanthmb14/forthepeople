/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * IndicatorRow → FigureDetail (the data a tappable figure tile and its
 * DetailSheet need), formatted on the server in the page language.
 * The change is only given when the row stores a previous value; nothing
 * is worked out that the row does not hold.
 */

import type { FigureDetail } from "../FigureSheet";
import { fmtDecimal, formatIndicator } from "../format";
import type { Tr } from "../i18n";
import type { IndicatorRow } from "./data";
import { isStandingFact } from "@/lib/india/figure-dates";

export function toFigure(
  row: IndicatorRow,
  opts: { tp: Tr; locale: string; label: string; labelLang?: string; emoji: string },
): FigureDetail {
  const { tp, locale } = opts;
  const f = formatIndicator(tp, locale, row.value ?? 0, row.unit);
  const prev = row.previousValue;
  const delta = row.value !== null && prev !== null && prev !== 0 ? ((row.value - prev) / Math.abs(prev)) * 100 : null;
  const dir: "up" | "down" | "same" | null = delta === null ? null : delta > 0.1 ? "up" : delta < -0.1 ? "down" : "same";
  const prevText = prev !== null ? formatIndicator(tp, locale, prev, row.unit) : null;
  return {
    key: `${row.moduleSlug}:${row.metricKey}`,
    label: opts.label,
    labelLang: opts.labelLang,
    value: f.value,
    unit: f.unit || undefined,
    emoji: opts.emoji,
    asOf: row.asOf,
    // A standing fact (seats, states, a policy target) stores the day it
    // was last checked, so its tile says "checked", not "as of".
    checked: isStandingFact(row.metricKey),
    source: { label: row.source, href: row.sourceUrl || undefined },
    previous: prevText ? { value: prevText.unit ? `${prevText.value} ${prevText.unit}` : prevText.value, asOf: row.previousAsOf } : null,
    change:
      dir && delta !== null
        ? {
            dir,
            pct: `${fmtDecimal(locale, Math.abs(delta), 1)}%`,
            year: row.previousAsOf ? String(new Date(row.previousAsOf).getUTCFullYear()) : undefined,
          }
        : null,
    quality: row.quality,
    methodologyUrl: row.methodologyUrl,
    recordedAt: row.fetchedAt,
  };
}

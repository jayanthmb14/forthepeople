/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Water & Dams — small v4 pictures used only by the water page
// ═══════════════════════════════════════════════════════════════════════
//
//    FlowBars   one row per dam: how much water is flowing in and how much
//               is being let out (cusecs), as two bars on one shared scale,
//               with a "filling" / "emptying" / "steady" chip
//
//  Colours come from the page hue: inflow wears --hue, outflow the lighter
//  --hue-pop. Words come from the "page_water" messages; numbers from
//  useFormat().
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";

export interface FlowRow {
  key: string;
  name: string;
  nameLang?: string;
  inflow: number;
  outflow: number;
}

export const FLOW_IN_FILL = "linear-gradient(90deg, color-mix(in srgb, var(--hue) 70%, #fff), var(--hue))";
export const FLOW_OUT_FILL = "linear-gradient(90deg, color-mix(in srgb, var(--hue-pop) 55%, #fff), var(--hue-pop))";

/** One inflow or outflow bar with its label and value. */
function FlowBar({ label, value, max, fill, i }: { label: string; value: number; max: number; fill: string; i: number }) {
  const f = useFormat();
  const pct = max > 0 ? Math.max(value > 0 ? 1.5 : 0, (value / max) * 100) : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(44px, auto) 1fr auto", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{label}</span>
      <span aria-hidden dir="ltr" style={{ display: "block", height: 10, borderRadius: "var(--ftp-radius-pill)", background: "var(--hue-tint)", overflow: "hidden" }}>
        <span
          className="ftp-grow-x"
          style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: "var(--ftp-radius-pill)", background: fill, ["--i" as string]: i }}
        />
      </span>
      <span className="ftp-num" style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text)", minWidth: 48, textAlign: "end" }}>
        {f.number(Math.round(value))}
      </span>
    </div>
  );
}

/**
 * FlowBars — inflow and outflow per dam on one scale (the largest flow on
 * the page fills a bar). The chip says whether the dam is filling, emptying
 * or steady, in words as well as colour.
 */
export function FlowBars({ rows }: { rows: FlowRow[] }) {
  const t = useTranslations("page_water");
  const max = Math.max(0, ...rows.flatMap((r) => [r.inflow, r.outflow]));
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((r, i) => {
        const state = r.inflow > r.outflow ? "filling" : r.inflow < r.outflow ? "emptying" : "steady";
        return (
          <li key={r.key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span lang={r.nameLang} style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>
                  {r.name}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    minHeight: 22,
                    padding: "0 8px",
                    borderRadius: "var(--ftp-radius-pill)",
                    fontSize: 12,
                    lineHeight: "16px",
                    fontWeight: 600,
                    background: state === "filling" ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                    color: state === "filling" ? "var(--hue-deep)" : "var(--ftp-text-2)",
                  }}
                >
                  <span aria-hidden>{state === "filling" ? "▲" : state === "emptying" ? "▼" : "="}</span>
                  {t(`flowState.${state}`)}
                </span>
              </div>
              <FlowBar label={t("flowIn")} value={r.inflow} max={max} fill={FLOW_IN_FILL} i={i * 2} />
              <FlowBar label={t("flowOut")} value={r.outflow} max={max} fill={FLOW_OUT_FILL} i={i * 2 + 1} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

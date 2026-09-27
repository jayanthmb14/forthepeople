/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PriceCard — one price on /prices
// ═══════════════════════════════════════════════════════════════════════
//
//   Gold, 24 carat
//   Rupees for 1 gram of pure gold (999).
//   ₹15,211 per gram
//   Up ₹133 (0.9%) since 24 Sep
//   [amber note when the value is old]
//   Gold, 24 carat is ₹15,211 per gram on 25 Sep, down 6.1% in a month.
//   ─── 3-month line ───
//   1 week ago (18 Sep)    ₹15,373 → ₹15,211   down 1.1%
//   1 month ago (25 Aug)   ₹16,204 → ₹15,211   down 6.1%
//   3 months ago (25 Jun)  ₹13,987 → ₹15,211   up 8.7%
//   Source: IBJA · Evening rate of 25 Sep 2026 · Check it ↗
//
//  Presentational only: the page builds every string (translated and
//  formatted) and passes a view model, so this works as a server component
//  with no client JavaScript.

import { AlertTriangle, ExternalLink } from "lucide-react";
import type { PricePoint } from "@/lib/markets/compute";
import PriceChart from "./PriceChart";

export type Direction = "up" | "down" | "flat";

export interface PriceCardView {
  id: string;
  name: string;
  about: string;
  /** Present when the source answered. */
  data?: {
    value: string;
    unit: string;
    /** "Up ₹133 (0.9%) since 24 Sep", or null with a single value. */
    sincePrevious: { text: string; direction: Direction } | null;
    line: string | null;
    /** Amber notice ("This is 9 days old…") or null when fresh. */
    stale: string | null;
    chart: {
      points: PricePoint[];
      label: string;
      startLabel: string;
      endLabel: string;
      highLabel: string;
      lowLabel: string;
    } | null;
    rows: Array<{ label: string; before: string; now: string; change: string; direction: Direction }>;
    source: string;
    asOf: string;
    sourceUrl: string;
    checkLabel: string;
  };
  /** Shown instead of `data` when the source failed. */
  missing?: string;
}

const DIR_COLOR: Record<Direction, string> = {
  up: "var(--ftp-live-text)",
  down: "var(--ftp-danger)",
  flat: "var(--ftp-text-2)",
};

export default function PriceCard({ view }: { view: PriceCardView }) {
  const d = view.data;
  return (
    <article
      aria-labelledby={`price-${view.id}`}
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        padding: 16,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <h3 id={`price-${view.id}`} style={{ margin: 0, fontSize: 17, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)" }}>
          {view.name}
        </h3>
        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{view.about}</p>
      </div>

      {!d ? (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{view.missing}</p>
      ) : (
        <>
          <div>
            <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
              <span className="ftp-num" style={{ fontSize: 30, lineHeight: "36px", fontWeight: 700, color: "var(--ftp-text)" }}>{d.value}</span>
              <span style={{ fontSize: 14, color: "var(--ftp-text-2)" }}>{d.unit}</span>
            </p>
            {d.sincePrevious && (
              <p className="ftp-num" style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.5, fontWeight: 500, color: DIR_COLOR[d.sincePrevious.direction] }}>
                {d.sincePrevious.text}
              </p>
            )}
          </div>

          {d.stale && (
            <p
              role="note"
              style={{
                margin: 0,
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--ftp-warn-tint)",
                color: "var(--ftp-warn)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{d.stale}</span>
            </p>
          )}

          {d.line && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ftp-text)" }}>{d.line}</p>}

          {d.chart && <PriceChart {...d.chart} />}

          {d.rows.length > 0 && (
            <dl style={{ margin: 0, display: "grid", gap: 6 }}>
              {d.rows.map((r) => (
                <div
                  key={r.label}
                  style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2px 12px", paddingTop: 6, borderTop: "1px solid var(--ftp-border)" }}
                >
                  <dt style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{r.label}</dt>
                  <dd className="ftp-num" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text)", fontWeight: 500 }}>
                    {r.before} → {r.now}{" "}
                    <span style={{ color: DIR_COLOR[r.direction] }}>{r.change}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div style={{ marginTop: "auto", paddingTop: 4 }}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
              {d.source} · {d.asOf}
            </p>
            <a
              href={d.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ftp-brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, fontSize: 13, fontWeight: 600 }}
            >
              {d.checkLabel}
              <ExternalLink size={13} aria-hidden />
            </a>
          </div>
        </>
      )}
    </article>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PriceChart — a small, calm 3-month line for one price
// ═══════════════════════════════════════════════════════════════════════
//
//   ╭──────────────────────────────╮  High ₹16,480
//   │      ╱╲    ╱╲                │
//   │ ╱╲__╱  ╲__╱  ╲___╱╲___       │
//   ╰──────────────────────────────╯  Low ₹13,987
//    25 Jun                   25 Sep
//
//  Plain SVG (no chart library, no client JavaScript), drawn server-side.
//  One line in the brand blue with a soft fill under it; the words (dates,
//  high, low) are HTML so they never stretch. The SVG has a text alternative
//  (`label`) that says the same thing in a sentence.

import type { PricePoint } from "@/lib/markets/compute";

const W = 320;
const H = 88;
const PAD = 4;

export default function PriceChart({
  points,
  label,
  startLabel,
  endLabel,
  highLabel,
  lowLabel,
}: {
  points: PricePoint[];
  /** One sentence for screen readers: from, to, high, low. */
  label: string;
  startLabel: string;
  endLabel: string;
  highLabel: string;
  lowLabel: string;
}) {
  // Never draw a chart from one point (docs/DESIGN-SYSTEM.md §4).
  if (points.length < 2) return null;
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  const small: React.CSSProperties = { fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" };

  return (
    <figure style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: H, display: "block", overflow: "visible" }}
        >
          <path d={area} fill="var(--ftp-brand-tint)" stroke="none" />
          <path d={line} fill="none" stroke="var(--ftp-brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <figcaption aria-hidden style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, ...small }}>
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </figcaption>
      </div>
      <div aria-hidden style={{ height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "end", flexShrink: 0 }}>
        <span className="ftp-num" style={{ ...small, fontWeight: 500 }}>{highLabel}</span>
        <span className="ftp-num" style={{ ...small, fontWeight: 500 }}>{lowLabel}</span>
      </div>
    </figure>
  );
}

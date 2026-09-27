/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeGlyphs — small crafted pictures for the home page's prices
// ═══════════════════════════════════════════════════════════════════════
//
//  A gold coin, a silver bar, a rising chart (Sensex, Nifty), a money note
//  (US dollar) and a fuel pump (petrol, diesel; drawn in its parent's hue,
//  .ftp-hue-<name>); and
//  four step pictures for "How we get and check the data" (collect, check,
//  compare, show), drawn in the hue of their parent (.ftp-hue-<name>).
//  Drawn on a 24 × 24 grid, flat pastel fills, colours from
//  glyphs.module.css (never hex here). Decorative: the price's name is
//  always written next to the picture, so every glyph is aria-hidden.
//
//  Page-local on purpose: shared site graphics live in
//  src/components/graphics/ (owned by the module visuals).
import styles from "./glyphs.module.css";
import type { MarketKey } from "./home-types";

export type GlyphKind = "gold" | "silver" | "chart" | "note" | "fuel";

interface GlyphProps {
  size?: number;
  className?: string;
}

function Svg({ size = 20, className, children }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className ? `${styles.glyph} ${className}` : styles.glyph}
    >
      {children}
    </svg>
  );
}

/** A gold coin with a rupee mark. */
export function GoldCoin(p: GlyphProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" className={styles.goldRim} />
      <circle cx="12" cy="12" r="7.2" className={styles.goldFace} />
      {/* ₹: two bars and the curve down to the leg */}
      <path d="M9.2 8.6h5.6M9.2 11h5.6M10.2 8.6c2.6 0 3.4 1 3.4 2.4s-1.2 2.3-3.6 2.3l3.9 3.6" className={styles.goldMark} />
      <path d="M6.4 9.2a6.2 6.2 0 0 1 3.2-3.3" className={styles.shine} />
    </Svg>
  );
}

/** A silver bar, seen from the side. */
export function SilverBar(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M3 17.5 6 11h12l3 6.5z" className={styles.silverSide} />
      <path d="M6 11 7.8 7h8.4l1.8 4z" className={styles.silverTop} />
      <path d="M8.6 9.2h3.2" className={styles.shine} />
    </Svg>
  );
}

/** A small rising line chart on a tile (share indices). */
export function RisingChart(p: GlyphProps) {
  return (
    <Svg {...p}>
      <rect x="2" y="3" width="20" height="18" rx="5" className={styles.chartTile} />
      <path d="M6 17.5h12" className={styles.chartBase} />
      <path d="M6 14.5 9.5 11l3 2.2L18 7.5" className={styles.chartLine} />
      <circle cx="18" cy="7.5" r="1.7" className={styles.chartDot} />
    </Svg>
  );
}

/** A money note (the rupee–dollar rate). */
export function MoneyNote(p: GlyphProps) {
  return (
    <Svg {...p}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" className={styles.note} />
      <circle cx="12" cy="12" r="3" className={styles.noteMark} />
      <path d="M5.5 9v6M18.5 9v6" className={styles.noteMark} />
    </Svg>
  );
}

/** A fuel pump with its hose (petrol and diesel). Colour: the parent's hue. */
export function FuelPump(p: GlyphProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="3" width="11" height="17.5" rx="2.4" className={styles.pumpBody} />
      <rect x="5.8" y="5.4" width="6.4" height="4.6" rx="1.2" className={styles.pumpWindow} />
      <path d="M2.5 20.8h13" className={styles.pumpBase} />
      <path d="M14.5 8.2h1.9a1.7 1.7 0 0 1 1.7 1.7v6.4a1.6 1.6 0 0 0 3.2 0V9.4l-2.4-2.6" className={styles.pumpHose} />
    </Svg>
  );
}

/** The picture for a market price. */
export function glyphFor(key: MarketKey): GlyphKind {
  switch (key) {
    case "gold24":
    case "gold22":
      return "gold";
    case "silver":
      return "silver";
    case "usdInr":
      return "note";
    default:
      return "chart";
  }
}

export function Glyph({ kind, ...p }: GlyphProps & { kind: GlyphKind }) {
  switch (kind) {
    case "gold":
      return <GoldCoin {...p} />;
    case "silver":
      return <SilverBar {...p} />;
    case "note":
      return <MoneyNote {...p} />;
    case "fuel":
      return <FuelPump {...p} />;
    default:
      return <RisingChart {...p} />;
  }
}

// ── "How we get and check the data" — four step pictures (48 × 48) ─────

function Step({ size = 48, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={styles.glyph}>
      <rect x="1" y="1" width="46" height="46" rx="14" className={styles.stepTile} />
      {children}
    </svg>
  );
}

/** Collect: a portal window with a building, and an arrow into our tray. */
export function StepCollect({ size }: { size?: number }) {
  return (
    <Step size={size}>
      <rect x="9" y="9" width="30" height="21" rx="4" className={styles.stepPaper} />
      <path d="M9 14h30" className={styles.stepLine} />
      <circle cx="12.5" cy="11.6" r="1" className={styles.stepInk} />
      <circle cx="15.5" cy="11.6" r="1" className={styles.stepInk} />
      <path d="M17 26v-6M21.5 26v-6M26 26v-6M30.5 26v-6M15 26.5h18M15 19.5l9-3.5 9 3.5" className={styles.stepLine} />
      <path d="M24 31v7m-3.5-3.5L24 38l3.5-3.5" className={styles.stepAccent} />
      <path d="M15 40h18" className={styles.stepLine} />
    </Step>
  );
}

/** An even gear outline: `teeth` teeth between radius rIn and rOut. */
function gearPath(cx: number, cy: number, rOut: number, rIn: number, teeth: number): string {
  const step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const parts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    parts.push(`${i === 0 ? "M" : "L"}${at(rIn, a - step * 0.3)}`, `L${at(rOut, a - step * 0.17)}`, `L${at(rOut, a + step * 0.17)}`, `L${at(rIn, a + step * 0.3)}`);
  }
  return `${parts.join(" ")} Z`;
}
const GEAR = gearPath(24, 24, 14, 11, 9);

/** Check automatically: a gear with a tick. */
export function StepCheck({ size }: { size?: number }) {
  return (
    <Step size={size}>
      <path d={GEAR} className={styles.stepPaper} />
      <circle cx="24" cy="24" r="6.5" className={styles.stepFill} />
      <path d="M20.8 24.2l2.2 2.2 4.3-4.6" className={styles.stepTick} />
    </Step>
  );
}

/** Double-check: two papers side by side with an "equals" between them. */
export function StepCompare({ size }: { size?: number }) {
  return (
    <Step size={size}>
      <rect x="7" y="12" width="15" height="21" rx="3" className={styles.stepPaper} />
      <rect x="26" y="15" width="15" height="21" rx="3" className={styles.stepPaper} />
      <path d="M10.5 17.5h8M10.5 21.5h8M10.5 25.5h5M29.5 20.5h8M29.5 24.5h8M29.5 28.5h5" className={styles.stepLine} />
      <circle cx="24" cy="36" r="5.5" className={styles.stepFill} />
      <path d="M21.6 34.8h4.8M21.6 37.2h4.8" className={styles.stepTick} />
    </Step>
  );
}

/** Show with date and source: a card with a calendar and a link tag. */
export function StepShow({ size }: { size?: number }) {
  return (
    <Step size={size}>
      <rect x="8" y="10" width="32" height="26" rx="4" className={styles.stepPaper} />
      <path d="M13 17h13M13 21.5h9" className={styles.stepLine} />
      <rect x="29" y="15" width="7" height="7" rx="1.5" className={styles.stepFill} />
      <path d="M13 29.5h22" className={styles.stepLine} />
      <rect x="12" y="33.5" width="15" height="7" rx="3.5" className={styles.stepFill} />
      <path d="M15.5 37h8" className={styles.stepTick} />
    </Step>
  );
}

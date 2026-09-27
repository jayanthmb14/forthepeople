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
//  (US dollar), an oil drop (crude) and a sprout (mandi crop prices).
//  Drawn on a 24 × 24 grid, flat pastel fills, colours from
//  glyphs.module.css (never hex here). Decorative: the price's name is
//  always written next to the picture, so every glyph is aria-hidden.
//
//  Page-local on purpose: shared site graphics live in
//  src/components/graphics/ (owned by the module visuals).
import styles from "./glyphs.module.css";
import type { MarketKey } from "./home-types";

export type GlyphKind = "gold" | "silver" | "chart" | "note" | "oil" | "sprout";

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

/** A drop of crude oil. */
export function OilDrop(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.8c3.4 4.4 6.2 7.9 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-3.3 2.8-6.8 6.2-11.2z" className={styles.oil} />
      <path d="M9 14.6a3.1 3.1 0 0 0 2.2 2.9" className={styles.oilShine} />
    </Svg>
  );
}

/** A young crop plant (mandi prices). */
export function Sprout(p: GlyphProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="20" rx="7.5" ry="2" className={styles.soil} />
      <path d="M12 19.5V10.5" className={styles.stem} />
      <path d="M12 12.5C8.5 12.8 5.8 10.8 5.2 7 8.9 6.8 11.6 8.6 12 12.5z" className={styles.leaf} />
      <path d="M12 10.8c.6-3.6 3.2-5.6 6.9-5.5-.4 3.7-3.1 5.8-6.9 5.5z" className={styles.leafLight} />
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
    case "crude":
      return "oil";
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
    case "oil":
      return <OilDrop {...p} />;
    case "sprout":
      return <Sprout {...p} />;
    default:
      return <RisingChart {...p} />;
  }
}

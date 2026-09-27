/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Hand-drawn SVG pictures for the courts page (page-local, no emoji):
//   BalanceScale    "came in" vs "decided": the heavier pan sinks
//   CourtsLoading   the same scale, gently weighing, while figures load
//   HourglassMark   a small mark for "how long"
//   CourthouseMark  a small pillared court building
// Colours are hue variables only; the page hue (violet) is the frame,
// "decided" is the page hue, "came in" is the quiet grey of the charts.
"use client";

import type React from "react";
import styles from "../courts.module.css";

/** Beam tilt in degrees: + (right pan down) when more were decided than came in. */
export function tiltDegrees(filed: number, disposed: number): number {
  const max = Math.max(filed, disposed);
  if (max <= 0) return 0;
  const raw = ((disposed - filed) / max) * 45;
  return Math.max(-14, Math.min(14, raw));
}

/** 1–3 case files on a pan, by its share of the bigger side. */
function filesFor(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(1, Math.min(3, Math.round((value / max) * 3)));
}

function Pan({ x, files, tone, className, tilt }: { x: number; files: number; tone: "in" | "out"; className: string; tilt: number }) {
  const bowlFill = tone === "out" ? "var(--hue-pop)" : "var(--ftp-surface-2)";
  const bowlStroke = tone === "out" ? "var(--hue)" : "var(--ftp-border-strong)";
  const fileFill = tone === "out" ? "var(--hue)" : "var(--ftp-text-2)";
  return (
    <g className={className} style={{ transformOrigin: `${x}px 46px`, transform: `rotate(${-tilt}deg)` }}>
      <path d={`M${x} 48 L${x - 24} 100 M${x} 48 L${x + 24} 100`} stroke="var(--hue-deep)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
      {Array.from({ length: files }, (_, i) => (
        <rect key={i} x={x - 12 + (i % 2 === 0 ? 0 : 3)} y={92 - i * 7} width="22" height="6" rx="2" fill={fileFill} opacity={0.55 + i * 0.15} />
      ))}
      <path d={`M${x - 30} 100 Q${x} 128 ${x + 30} 100 Z`} fill={bowlFill} stroke={bowlStroke} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* base and pillar */}
      <path d="M92 168 L168 168 L156 154 L104 154 Z" fill="var(--hue-pop)" stroke="var(--hue)" strokeWidth="2" strokeLinejoin="round" />
      <rect x="125" y="46" width="10" height="110" rx="4" fill="var(--hue)" />
      {children}
      {/* the pivot sits on top */}
      <circle cx="130" cy="46" r="9" fill="var(--hue-deep)" />
      <circle cx="130" cy="46" r="3.5" fill="var(--ftp-surface)" />
    </>
  );
}

/**
 * A balance with "came in" on the left and "decided" on the right. The
 * side with more cases sinks (at most 14°); the beam settles once on load.
 */
export function BalanceScale({
  filed,
  disposed,
  inLabel,
  outLabel,
  inValue,
  outValue,
  ariaLabel,
}: {
  filed: number;
  disposed: number;
  inLabel: string;
  outLabel: string;
  inValue: string;
  outValue: string;
  ariaLabel: string;
}) {
  const tilt = tiltDegrees(filed, disposed);
  const max = Math.max(filed, disposed);
  return (
    <svg viewBox="0 22 260 190" role="img" aria-label={ariaLabel} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
      <Frame>
        <g className={styles.beam} style={{ transform: `rotate(${tilt}deg)` }}>
          <rect x="36" y="42" width="188" height="8" rx="4" fill="var(--hue-deep)" />
          <circle cx="40" cy="46" r="4" fill="var(--hue-deep)" />
          <circle cx="220" cy="46" r="4" fill="var(--hue-deep)" />
          <Pan x={40} files={filesFor(filed, max)} tone="in" className={styles.pan} tilt={tilt} />
          <Pan x={220} files={filesFor(disposed, max)} tone="out" className={styles.pan} tilt={tilt} />
        </g>
      </Frame>
      <g fontFamily="var(--ftp-font-sans)" textAnchor="middle">
        <text x="40" y="186" fontSize="12" fill="var(--ftp-text-2)">{inLabel}</text>
        <text x="40" y="204" fontSize="15" fontWeight="700" fill="var(--ftp-text)">{inValue}</text>
        <text x="220" y="186" fontSize="12" fill="var(--ftp-text-2)">{outLabel}</text>
        <text x="220" y="204" fontSize="15" fontWeight="700" fill="var(--hue-deep)">{outValue}</text>
      </g>
    </svg>
  );
}

/** The loading picture: the same scale, gently weighing, with one line of text. */
export function CourtsLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 0 6px" }}>
      <svg viewBox="0 0 260 176" aria-hidden style={{ width: 180, height: "auto" }}>
        <Frame>
          <g className={styles.sway}>
            <rect x="36" y="42" width="188" height="8" rx="4" fill="var(--hue-deep)" />
            <g className={styles.swayPanLeft}>
              <path d="M40 48 L16 100 M40 48 L64 100" stroke="var(--hue-deep)" strokeWidth="1.5" fill="none" opacity="0.7" />
              <path d="M10 100 Q40 128 70 100 Z" fill="var(--ftp-surface-2)" stroke="var(--ftp-border-strong)" strokeWidth="2" />
            </g>
            <g className={styles.swayPanRight}>
              <path d="M220 48 L196 100 M220 48 L244 100" stroke="var(--hue-deep)" strokeWidth="1.5" fill="none" opacity="0.7" />
              <path d="M190 100 Q220 128 250 100 Z" fill="var(--hue-pop)" stroke="var(--hue)" strokeWidth="2" />
            </g>
          </g>
        </Frame>
      </svg>
      <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{label}</p>
    </div>
  );
}

/** A small hourglass: sand mostly run through. */
export function HourglassMark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--hue-tint)" />
      <path d="M9 6h14M9 26h14" stroke="var(--hue-deep)" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 7c0 5 4.2 6.6 5.5 9c1.3-2.4 5.5-4 5.5-9z" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10.5 25c0-5 4.2-6.6 5.5-9c1.3 2.4 5.5 4 5.5 9z" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13.4 9.2h5.2c-.6 1.6-2 2.4-2.6 3.4c-.6-1-2-1.8-2.6-3.4z" fill="var(--hue-pop)" />
      <path d="M11.8 24.4c.4-2.6 2.6-3.6 4.2-5.4c1.6 1.8 3.8 2.8 4.2 5.4z" fill="var(--hue)" />
      <path d="M16 13v5" stroke="var(--hue)" strokeWidth="1" strokeDasharray="1 1.4" />
    </svg>
  );
}

/** A small pillared court building. */
export function CourthouseMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 56" width={size} height={(size * 56) / 64} aria-hidden style={{ flexShrink: 0 }}>
      <path d="M32 3 L5 17 H59 Z" fill="var(--hue-pop)" stroke="var(--hue-deep)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="12" r="2.6" fill="var(--hue-deep)" />
      <rect x="8" y="18" width="48" height="5" rx="1.5" fill="var(--hue)" />
      {[12, 23, 35, 46].map((x) => (
        <rect key={x} x={x} y="24" width="6" height="20" rx="1.5" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.6" />
      ))}
      <rect x="6" y="45" width="52" height="4" rx="1.5" fill="var(--hue)" />
      <rect x="3" y="50" width="58" height="4" rx="1.5" fill="var(--hue-deep)" />
    </svg>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Overview art — small hand-drawn SVG marks for the district overview
// ═══════════════════════════════════════════════════════════════════════
//
//  v5.1 "Warm Calm": the overview's number tiles and its four summary
//  cards (leaders, people, projects, money) each carry a crafted picture
//  instead of an emoji, so a child can tell them apart at a glance:
//
//    LeadersMark   a pillared public hall (no emblem, no seal)
//    PeopleMark    two grown-ups and a child
//    ProjectsMark  a crane lifting a block onto a half-built building
//    MoneyMark     a stack of gold coins with a rupee coin in front
//    ElectionMark  a ballot box with a ticked paper going in
//    HeroLandscape sun, hills, trees and houses — the hero picture for a
//                  district that has no landmark drawing of its own
//
//  Page-local (used only by the district shell and overview snippets).
//  Colours come from the surrounding hue (var(--hue*), set by a
//  .ftp-hue-<name> class) and the gold accent (--ov-gold*, defined in
//  district-shell.css). All marks are decorative: aria-hidden, the text
//  beside them says what they mean.

import type { SVGProps } from "react";

type MarkProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "children">;

function Frame({ size = 40, children, ...rest }: MarkProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export function LeadersMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <path d="M7 18.5 24 9l17 9.5Z" fill="var(--hue-pop)" stroke="var(--hue-deep)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="24" cy="15" r="2" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.2" />
      <rect x="9" y="18.5" width="30" height="3" rx="1" fill="var(--hue)" />
      {[12, 19, 26, 33].map((x) => (
        <rect key={x} x={x} y="21.5" width="3.2" height="12" rx="1" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.2" />
      ))}
      <rect x="8.5" y="33.5" width="31" height="3" rx="1" fill="var(--hue-deep)" />
      <rect x="6" y="36.5" width="36" height="3.2" rx="1.4" fill="var(--hue)" />
    </Frame>
  );
}

export function PeopleMark(props: MarkProps) {
  return (
    <Frame {...props}>
      {/* grown-up, left */}
      <circle cx="14.5" cy="14" r="4.4" fill="var(--hue-deep)" />
      <path d="M6.5 38v-9.5a8 8 0 0 1 16 0V38Z" fill="var(--hue)" />
      {/* grown-up, right */}
      <circle cx="33.5" cy="14" r="4.4" fill="var(--hue-deep)" />
      <path d="M25.5 38v-9.5a8 8 0 0 1 16 0V38Z" fill="var(--hue-pop)" stroke="var(--hue-deep)" strokeWidth="1.2" />
      {/* child, in front */}
      <circle cx="24" cy="23" r="3.4" fill="var(--hue-deep)" />
      <path d="M18 40v-6.5a6 6 0 0 1 12 0V40Z" fill="var(--ov-gold-pop)" stroke="var(--ov-gold-deep)" strokeWidth="1.2" />
      <rect x="4" y="39.5" width="40" height="2.6" rx="1.3" fill="var(--hue-pop)" />
    </Frame>
  );
}

export function ProjectsMark(props: MarkProps) {
  return (
    <Frame {...props}>
      {/* crane tower with lattice */}
      <rect x="10" y="10" width="4.5" height="30" fill="var(--hue-deep)" />
      <path d="M10 16l4.5 5M14.5 16 10 21M10 26l4.5 5M14.5 26 10 31" stroke="var(--hue-pop)" strokeWidth="1" />
      {/* jib and counterweight */}
      <rect x="6" y="8" width="35" height="3" rx="1" fill="var(--hue)" />
      <rect x="5" y="11" width="6" height="4" rx="1" fill="var(--hue-deep)" />
      <path d="M12.2 8 16 4.5 20 8" stroke="var(--hue-deep)" strokeWidth="1.2" />
      {/* cable + block */}
      <path d="M35 11v9" stroke="var(--hue-deep)" strokeWidth="1.2" />
      <rect x="31.5" y="20" width="7" height="5" rx="1" fill="var(--ov-gold)" stroke="var(--ov-gold-deep)" strokeWidth="1" />
      {/* half-built building */}
      <rect x="21" y="28" width="20" height="12" rx="1" fill="var(--hue-pop)" stroke="var(--hue-deep)" strokeWidth="1.2" />
      <rect x="24" y="31" width="4" height="3.5" rx=".6" fill="var(--ftp-surface)" />
      <rect x="31" y="31" width="4" height="3.5" rx=".6" fill="var(--ftp-surface)" />
      <path d="M21 28v-3h6" stroke="var(--hue-deep)" strokeWidth="1.2" strokeDasharray="2 1.6" />
      <rect x="4" y="40" width="40" height="2.6" rx="1.3" fill="var(--hue)" />
    </Frame>
  );
}

export function MoneyMark(props: MarkProps) {
  return (
    <Frame {...props}>
      {/* coin stack */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="6" y={34 - i * 5} width="20" height="5" rx="2.4" fill="var(--ov-gold)" stroke="var(--ov-gold-deep)" strokeWidth="1" />
          <ellipse cx="16" cy={34 - i * 5} rx="10" ry="2.2" fill="var(--ov-gold-pop)" stroke="var(--ov-gold-deep)" strokeWidth="1" />
        </g>
      ))}
      {/* rupee coin in front */}
      <circle cx="31" cy="29" r="11" fill="var(--ov-gold)" stroke="var(--ov-gold-deep)" strokeWidth="1.6" />
      <circle cx="31" cy="29" r="8" fill="var(--ov-gold-pop)" stroke="var(--ov-gold-deep)" strokeWidth="1" strokeOpacity=".55" />
      <path
        d="M27.4 23.6h7.4M27.4 26.6h7.4M28.6 23.6c2.8 0 4 1.3 4 3s-1.4 3-4.2 3h-1l5.6 5.8"
        stroke="var(--ov-gold-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* sparkle */}
      <path d="M40.5 7.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1Z" fill="var(--ov-gold)" />
    </Frame>
  );
}

export function ElectionMark(props: MarkProps) {
  return (
    <Frame {...props}>
      <g transform="rotate(-8 24 16)">
        <rect x="18.5" y="6" width="11" height="15" rx="1.6" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="1.3" />
        <path d="m21 14 2.2 2.2 4-4.6" stroke="var(--hue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="8" y="21" width="32" height="19" rx="3" fill="var(--hue-pop)" stroke="var(--hue-deep)" strokeWidth="1.5" />
      <rect x="17" y="20" width="14" height="2.6" rx="1.3" fill="var(--hue-deep)" />
      <rect x="15" y="29" width="18" height="5.5" rx="2" fill="var(--ftp-surface)" opacity=".85" />
      <rect x="5" y="40" width="38" height="2.6" rx="1.3" fill="var(--hue)" />
    </Frame>
  );
}

/**
 * The hero picture for a district without its own landmark drawing:
 * a sun, two rows of hills, trees and a few houses, in the district's hue.
 * Same 400 × 300 frame as DistrictSVG so it sits in the same slot.
 */
export function HeroLandscape() {
  return (
    <svg viewBox="0 0 400 300" fill="none" aria-hidden focusable="false" style={{ width: "100%", height: "100%" }}>
      <circle cx="300" cy="92" r="38" fill="var(--ov-gold-pop)" opacity=".9" />
      <circle cx="300" cy="92" r="54" fill="var(--ov-gold-pop)" opacity=".25" />
      <path d="M0 230c60-46 120-60 190-40s120 10 210-40v150H0Z" fill="var(--hue-pop)" opacity=".7" />
      <path d="M0 262c80-30 150-34 220-16s110 8 180-18v72H0Z" fill="var(--hue)" opacity=".35" />
      {[70, 110, 330].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y={206 - i * 4} width="6" height="26" rx="2" fill="var(--hue-deep)" opacity=".7" />
          <circle cx={x} cy={196 - i * 4} r="18" fill="var(--hue)" opacity=".75" />
        </g>
      ))}
      {[180, 222].map((x, i) => (
        <g key={x}>
          <rect x={x} y={214 - i * 6} width="30" height="26" rx="2" fill="var(--ftp-surface)" stroke="var(--hue-deep)" strokeWidth="2" />
          <path d={`M${x - 4} ${216 - i * 6} L${x + 15} ${198 - i * 6} L${x + 34} ${216 - i * 6} Z`} fill="var(--ov-gold)" stroke="var(--ov-gold-deep)" strokeWidth="2" strokeLinejoin="round" />
          <rect x={x + 11} y={226 - i * 6} width="8" height="14" rx="1" fill="var(--hue-pop)" />
        </g>
      ))}
    </svg>
  );
}

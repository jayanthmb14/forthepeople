/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  TierArt — a small drawn picture for each support plan (no emoji)
// ═══════════════════════════════════════════════════════════════════════
//
//    one-time gift      a glass of chai, its steam curling into a heart
//    District Champion  a map pin with a little house, on its patch of land
//    State Champion     three pins joined across one state
//    All-India Patron   a star medal in a ring of many districts
//    Founding Builder   foundation bricks under a gold star
//
//  Inline SVG painted only from the plan hue (--hue, --hue-deep, --hue-pop,
//  --hue-tint) and the gold family in look.module.css, so the same picture
//  works in every plan colour. Decorative: always aria-hidden, the plan
//  name next to it says what it is. Works in server and client components
//  (no hooks). Wrap it in the plan's hue class (tier-look.ts) — or pass
//  `hue` to have this component add it.

import { tierHueClass, type TierKey } from "./tier-look";
import look from "./look.module.css";

function Chai() {
  return (
    <>
      <ellipse cx="32" cy="54.5" rx="15" ry="3" className={look.fPop} />
      <path d="M20.5 26h23l-2.9 24.4a3 3 0 0 1-3 2.6H26.4a3 3 0 0 1-3-2.6z" className={look.fWhite} />
      <path d="M21.45 34h21.1l-1.95 16.4a3 3 0 0 1-3 2.6H26.4a3 3 0 0 1-3-2.6z" className={look.fPop} />
      <path d="M21.45 34h21.1" className={look.sHue} />
      <path d="M27 28.5v3M32 28.5v3M37 28.5v3" className={`${look.sPop} ${look.thin}`} />
      <path d="M20.5 26h23l-2.9 24.4a3 3 0 0 1-3 2.6H26.4a3 3 0 0 1-3-2.6z" className={look.sDeep} />
      <path d="M27.5 22.5c-2-2.2 2-3.4 0-5.6" className={look.sHue} />
      <path d="M36.5 22.5c-2-2.2 2-3.4 0-5.6" className={look.sHue} />
      <path
        d="M32 15.6c-3.6-2.3-4.6-4.1-4.6-5.6 0-1.5 1.1-2.4 2.3-2.4 1 0 1.8.5 2.3 1.4.5-.9 1.3-1.4 2.3-1.4 1.2 0 2.3.9 2.3 2.4 0 1.5-1 3.3-4.6 5.6z"
        className={look.fHue}
      />
    </>
  );
}

function DistrictPin() {
  return (
    <>
      <ellipse cx="32" cy="50" rx="19" ry="5.5" className={look.fPop} />
      <ellipse cx="32" cy="50" rx="7.5" ry="2" className={look.fHue} opacity={0.3} />
      <path d="M32 49c-6.5-7.2-11.5-13.4-11.5-19.5a11.5 11.5 0 0 1 23 0C43.5 35.6 38.5 41.8 32 49z" className={look.fHue} />
      <circle cx="32" cy="29.5" r="7" className={look.fWhite} />
      <path d="M28.4 30.4 32 27.1l3.6 3.3" className={`${look.sDeep} ${look.thin}`} />
      <path d="M29.5 29.6v4h5v-4" className={`${look.sDeep} ${look.thin}`} />
      <circle cx="13.5" cy="22" r="1.8" className={look.fHue} opacity={0.45} />
      <circle cx="51" cy="16.5" r="2.2" className={look.fHue} opacity={0.35} />
      <path d="M50 30v3.6M48.2 31.8h3.6" className={`${look.sHue} ${look.thin}`} />
    </>
  );
}

function StatePins() {
  const pin = (x: number, tip: number, s: number) =>
    `M${x} ${tip}c${-3.2 * s} ${-3.6 * s} ${-5.6 * s} ${-6.6 * s} ${-5.6 * s} ${-9.6 * s}a${5.6 * s} ${5.6 * s} 0 0 1 ${11.2 * s} 0c0 ${3 * s} ${-2.4 * s} ${6 * s} ${-5.6 * s} ${9.6 * s}z`;
  return (
    <>
      <path
        d="M11 42c-2.4-7 3.6-13.2 11-12.4 5-5.6 16.4-6 21.6 1 6.8 1.2 10.4 7.4 8.2 13.4-2 5.2-8.4 7.4-15 7.6-8.4.4-23.4-.6-25.8-9.6z"
        className={look.fPop}
      />
      <path d="M20 42.5 32 35l13 7.5" className={`${look.sDeep} ${look.dash} ${look.thin}`} />
      <path d={pin(20, 42.5, 1)} className={look.fHue} />
      <circle cx="20" cy="32.9" r="2.2" className={look.fWhite} />
      <path d={pin(45, 42.5, 1)} className={look.fHue} />
      <circle cx="45" cy="32.9" r="2.2" className={look.fWhite} />
      <path d={pin(32, 35, 1.3)} className={look.fDeep} />
      <circle cx="32" cy="22.5" r="2.9" className={look.fWhite} />
    </>
  );
}

function PatronStar() {
  const dots: Array<[number, number]> = [
    [53, 32], [46.8, 46.8], [32, 53], [17.2, 46.8], [11, 32], [17.2, 17.2], [32, 11], [46.8, 17.2],
  ];
  return (
    <>
      <circle cx="32" cy="32" r="21" className={`${look.sHue} ${look.dash} ${look.thin}`} opacity={0.55} />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.9 : 2.5} className={i % 2 ? look.fHue : look.fDeep} />
      ))}
      <circle cx="32" cy="32" r="13.5" className={look.fWhite} />
      <path d="M32 21l2.6 7.4 7.9.2-6.2 4.8 2.2 7.5L32 36.5l-6.5 4.4 2.2-7.5-6.2-4.8 7.9-.2z" className={look.fHue} />
      <path d="M32 25.2l1.2 3.4" className={`${look.sPop} ${look.thin}`} />
    </>
  );
}

function FounderBricks() {
  return (
    <>
      <ellipse cx="32" cy="54.6" rx="21" ry="2.6" className={look.fGold} opacity={0.35} />
      <rect x="12" y="43" width="19.4" height="9.4" rx="2.2" className={look.fWhite} />
      <rect x="12" y="43" width="19.4" height="9.4" rx="2.2" className={look.sGold} />
      <rect x="32.6" y="43" width="19.4" height="9.4" rx="2.2" className={look.fWhite} />
      <rect x="32.6" y="43" width="19.4" height="9.4" rx="2.2" className={look.sGold} />
      <rect x="20" y="32.6" width="24" height="9.4" rx="2.2" className={look.fGoldSoft} />
      <rect x="20" y="32.6" width="24" height="9.4" rx="2.2" className={look.sGold} />
      <path d="M32 11l2.2 5.9 6.4.3-5 4 1.7 6.1L32 23.8l-5.3 3.5 1.7-6.1-5-4 6.4-.3z" className={look.fGold} />
      <path d="M32 11l2.2 5.9 6.4.3-5 4 1.7 6.1L32 23.8l-5.3 3.5 1.7-6.1-5-4 6.4-.3z" className={look.sGold} />
      <path d="M49 9.5l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2z" className={look.fGold} />
      <path d="M15 19.8l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8z" className={look.fGold} />
    </>
  );
}

const DRAWINGS: Record<TierKey, () => React.ReactElement> = {
  custom: Chai,
  district: DistrictPin,
  state: StatePins,
  patron: PatronStar,
  founder: FounderBricks,
};

export default function TierArt({
  tier,
  size = 64,
  hue = false,
  className,
}: {
  tier: TierKey;
  /** Tile size in px (the drawing fills 80 % of it). */
  size?: number;
  /** Add the plan's hue class here (when the parent does not set it). */
  hue?: boolean;
  className?: string;
}) {
  const Drawing = DRAWINGS[tier];
  const classes = [look.art, look.metal, hue ? tierHueClass(tier) : null, className].filter(Boolean).join(" ");
  return (
    <span aria-hidden className={classes} data-tier={tier} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" focusable="false">
        <Drawing />
      </svg>
    </span>
  );
}

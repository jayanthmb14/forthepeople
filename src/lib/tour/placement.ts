/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Where the tour draws things (pure maths, viewport coordinates in CSS px;
// tests/tour.test.ts):
//
//   spotlightRect  the rounded cut-out: the target plus 8 px, clipped to
//                  the screen
//   placeCard      the step card: below the target, else above, else to
//                  the right, else to the left; if none fits, docked at the
//                  bottom. Phones (< 640 px) always dock the card — at the
//                  bottom, or at the top when the target sits down there
//                  (the "Report a problem" flag).
//   scrollDelta    how far to scroll so the target sits in the free part
//                  of the screen (under the sticky header / district bar,
//                  above a docked card). 0 when it is already in view.

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type CardPlacement = "below" | "above" | "right" | "left" | "dock-bottom" | "dock-top";

export interface CardPosition {
  placement: CardPlacement;
  top: number;
  left: number;
  /** Set when the card must take this width (docked on phones). */
  width?: number;
}

export const PHONE_MAX_WIDTH = 639;
export const SPOTLIGHT_PAD = 8;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, hi < lo ? lo : n));
const bottomOf = (r: Rect) => r.top + r.height;
const rightOf = (r: Rect) => r.left + r.width;

/** The target plus `pad` on every side, clipped to the viewport; null when nothing of it is on screen. */
export function spotlightRect(target: Rect, viewport: Size, pad = SPOTLIGHT_PAD): Rect | null {
  const top = Math.max(0, target.top - pad);
  const left = Math.max(0, target.left - pad);
  const bottom = Math.min(viewport.height, bottomOf(target) + pad);
  const right = Math.min(viewport.width, rightOf(target) + pad);
  if (bottom - top < 1 || right - left < 1) return null;
  return { top, left, width: right - left, height: bottom - top };
}

export interface PlaceOptions {
  /** Space between the spotlight and the card. */
  gap?: number;
  /** Space kept from the screen edges. */
  margin?: number;
  /** Widths up to this are phones: the card is docked. */
  phoneMax?: number;
}

/** Where the step card goes, given the spotlight (null = no target: docked). */
export function placeCard(spot: Rect | null, card: Size, viewport: Size, opts: PlaceOptions = {}): CardPosition {
  const gap = opts.gap ?? 12;
  const margin = opts.margin ?? 12;
  const phoneMax = opts.phoneMax ?? PHONE_MAX_WIDTH;
  const vw = viewport.width;
  const vh = viewport.height;

  if (vw <= phoneMax) {
    const width = Math.max(0, vw - 2 * margin);
    const bottomTop = vh - card.height - margin;
    const topTop = margin;
    if (spot) {
      const hitsBottom = bottomOf(spot) + gap > bottomTop;
      const hitsTop = spot.top - gap < topTop + card.height;
      if (hitsBottom && !hitsTop) return { placement: "dock-top", top: topTop, left: margin, width };
    }
    return { placement: "dock-bottom", top: Math.max(margin, bottomTop), left: margin, width };
  }

  const centredLeft = (vw - card.width) / 2;
  if (!spot) {
    return { placement: "dock-bottom", top: Math.max(margin, vh - card.height - margin), left: clamp(centredLeft, margin, vw - card.width - margin) };
  }

  const alignedLeft = clamp(spot.left + spot.width / 2 - card.width / 2, margin, vw - card.width - margin);
  const alignedTop = clamp(spot.top + spot.height / 2 - card.height / 2, margin, vh - card.height - margin);

  const below = bottomOf(spot) + gap;
  if (below + card.height <= vh - margin) return { placement: "below", top: below, left: alignedLeft };

  const above = spot.top - gap - card.height;
  if (above >= margin) return { placement: "above", top: above, left: alignedLeft };

  const right = rightOf(spot) + gap;
  if (right + card.width <= vw - margin) return { placement: "right", top: alignedTop, left: right };

  const left = spot.left - gap - card.width;
  if (left >= margin) return { placement: "left", top: alignedTop, left };

  return { placement: "dock-bottom", top: Math.max(margin, vh - card.height - margin), left: clamp(centredLeft, margin, vw - card.width - margin) };
}

/**
 * Pixels to scroll (positive = down) so `target` sits in the free band
 * between `topReserve` (sticky bars) and `viewportHeight - bottomReserve`
 * (a docked card). Already fully inside → 0. Fits → centred in the band.
 * Taller than the band → its top lands just under the sticky bars.
 */
export function scrollDelta(target: Rect, viewportHeight: number, topReserve: number, bottomReserve: number, pad = SPOTLIGHT_PAD): number {
  const bandTop = topReserve;
  const bandBottom = viewportHeight - bottomReserve;
  const top = target.top - pad;
  const bottom = bottomOf(target) + pad;
  if (top >= bandTop && bottom <= bandBottom) return 0;
  if (bottom - top <= bandBottom - bandTop) {
    return Math.round((top + bottom) / 2 - (bandTop + bandBottom) / 2);
  }
  return Math.round(top - bandTop);
}

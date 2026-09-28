/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  The tour's contract with other pop-ups (browser only, no React)
// ═══════════════════════════════════════════════════════════════════════
//
//  Other cards that appear by themselves (the "support nudge", any future
//  prompt) must not pile up on a first-time visitor. The tour tells them:
//
//   1. <html data-ftp-tour="active">
//        present while the "New here?" card OR a tour is on screen,
//        removed right after. CSS can react to it too:
//        html[data-ftp-tour="active"] .my-card { display: none }
//
//   2. sessionStorage["ftp.tour.firstSession"] = "1"
//        set in the browser session where a tour offer was first shown.
//        A nudge should wait for a later session.
//
//   isTourActive()  → (1) only
//   isTourBusy()    → (1) or (2): "do not show your card now"
//
//  Starting a tour from anywhere (footer link, phone menu):
//    requestTour()  fires the window event TOUR_START_EVENT; TourMount
//                   (mounted once in the locale layout) starts the tour
//                   that fits the current page, whatever was stored.
import { TOUR_FIRST_SESSION_KEY, readSessionFlag } from "./memory";

export const TOUR_ACTIVE_ATTR = "data-ftp-tour";
export const TOUR_START_EVENT = "ftp:tour-start";

function root(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

/** A tour or its offer card is on screen right now. */
export function isTourActive(): boolean {
  return root()?.getAttribute(TOUR_ACTIVE_ATTR) === "active";
}

/** Another self-opening card should stay away: the tour is on screen, or was offered in this session. */
export function isTourBusy(): boolean {
  if (isTourActive()) return true;
  if (typeof window === "undefined") return false;
  let storage: Storage | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    return false;
  }
  return readSessionFlag(storage, TOUR_FIRST_SESSION_KEY);
}

/** Sets or clears <html data-ftp-tour="active">. */
export function markTourActive(on: boolean): void {
  const el = root();
  if (!el) return;
  if (on) el.setAttribute(TOUR_ACTIVE_ATTR, "active");
  else el.removeAttribute(TOUR_ACTIVE_ATTR);
}

/** Start the tour for the current page (home or district), even if it was done or skipped. */
export function requestTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_START_EVENT));
}

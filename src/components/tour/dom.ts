/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Small browser-only helpers for the tour (the maths is in src/lib/tour).
import { TOUR_STEPS, availableSteps, tourSelector, type TourStep } from "@/lib/tour/steps";
import type { TourKind } from "@/lib/tour/memory";

/** On screen and not hidden by CSS (display, visibility, opacity, zero size). */
export function isShown(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const cs = window.getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0;
}

/** The first visible element for a step target, or null. */
export function findTarget(target: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(tourSelector(target));
  for (const el of Array.from(all)) if (isShown(el)) return el;
  return null;
}

/** The steps of a tour whose target is on this page right now. */
export function stepsOnPage(kind: TourKind): TourStep[] {
  return availableSteps(TOUR_STEPS[kind], (t) => findTarget(t) !== null);
}

/** The element (or a parent) stays put while the page scrolls: scrolling cannot bring it into view. */
export function isPinned(el: HTMLElement): boolean {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    const p = window.getComputedStyle(n).position;
    if (p === "fixed" || p === "sticky") return true;
  }
  return false;
}

/** Bottom edge of the sticky header and district bar, plus a little air. */
export function stickyTop(): number {
  let bottom = 0;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('header[role="banner"], .ftp-dbar'))) {
    const p = window.getComputedStyle(el).position;
    if (p !== "sticky" && p !== "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return Math.round(bottom) + 8;
}

/**
 * Something else has the visitor's attention: the home intro is playing,
 * a dialog or sheet is open, the page scroll is locked, or the tab is in
 * the background. The offer waits (it never covers another pop-up).
 */
export function pageIsBusy(): boolean {
  const d = document;
  if (d.visibilityState !== "visible") return true;
  if (d.documentElement.hasAttribute("data-ftp-intro")) return true;
  if (d.body.style.overflow === "hidden") return true;
  return d.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"], .ftp-sheet-root') !== null;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** localStorage / sessionStorage, or null when the browser blocks them. */
export function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

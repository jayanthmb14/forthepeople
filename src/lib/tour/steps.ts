/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The two tours, as data. Each step points at an element by its
// `data-tour="<target>"` attribute (added to the element itself, nothing
// else changed) and takes its title and text from the page_tour messages:
//   page_tour.<kind>.<id>.title / .body
//
// Several elements may carry the same target (the header's Support link
// and the home page's support band; the PC sidebar and the phone "Topics"
// button). The first one that is VISIBLE is used, so each width gets the
// right one. A step whose target is missing or hidden — a section that was
// moved, the overview cards on a module page — is left out silently.
import type { TourKind } from "./memory";

export interface TourStep {
  /** Message key under page_tour.<kind>. */
  id: string;
  /** Value of the data-tour attribute to point at. */
  target: string;
}

export const HOME_STEPS: readonly TourStep[] = [
  { id: "search", target: "home-search" },
  { id: "stats", target: "home-stats" },
  { id: "map", target: "home-map" },
  { id: "india", target: "home-india" },
  { id: "language", target: "language" },
  { id: "support", target: "support" },
];

export const DISTRICT_STEPS: readonly TourStep[] = [
  { id: "bar", target: "district-bar" },
  { id: "topics", target: "district-topics" },
  { id: "overview", target: "district-overview" },
  { id: "verify", target: "district-verify" },
  { id: "report", target: "report" },
];

export const TOUR_STEPS: Record<TourKind, readonly TourStep[]> = {
  home: HOME_STEPS,
  district: DISTRICT_STEPS,
};

/** A tour with fewer steps than this on the page is not offered at all. */
export const MIN_TOUR_STEPS = 2;

/** CSS selector for a step's candidates. */
export function tourSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/**
 * The steps whose target can be shown right now. `isAvailable` answers
 * for one target (the browser checks that a matching element is visible).
 * Order is kept; duplicate step ids are dropped.
 */
export function availableSteps(steps: readonly TourStep[], isAvailable: (target: string) => boolean): TourStep[] {
  const seen = new Set<string>();
  const out: TourStep[] = [];
  for (const s of steps) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    if (isAvailable(s.target)) out.push(s);
  }
  return out;
}

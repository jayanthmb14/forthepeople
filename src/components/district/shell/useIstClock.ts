/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// useMinuteClock — one shared clock for the district bar, ticking once a
// minute (on the minute), not every second: the bar shows "9:42 pm IST",
// never seconds, so it re-renders 60× less than the old status strip did.
//
//  • Server render and the first client render return null (no time), so
//    hydration never mismatches; the time appears right after mount.
//  • One timer for the whole page, however many components read it.
//  • When the tab comes back into view the time catches up at once
//    (background tabs throttle timers).
// IST minutes line up with UTC minutes (+5:30), so "on the minute" in UTC
// is on the minute in IST too.
"use client";

import { useSyncExternalStore } from "react";

let now: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function schedule() {
  const wait = 60_000 - (Date.now() % 60_000) + 50;
  timer = setTimeout(() => {
    emit();
    schedule();
  }, wait);
}

function onVisible() {
  if (document.visibilityState === "visible") emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** The current time (ms), updated on every minute; null during SSR and hydration. */
export function useMinuteClock(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}

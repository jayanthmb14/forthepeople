/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// useMinute() — the current minute (ms since epoch, floored to the minute)
// on the client, and null during the server render and hydration. Lets the
// home page show "today", the IST clock and "updated 12 minutes ago" without
// a hydration mismatch: the server HTML shows the date-free fallback, the
// browser fills in the live value right after hydration.
"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 20_000);
  return () => window.clearInterval(id);
}
const snapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverSnapshot = () => null;

export function useMinute(): number | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

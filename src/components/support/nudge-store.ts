/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Browser storage for the support nudge (rules in nudge-logic.ts). Every
// access is wrapped: when storage is blocked (private mode, a full quota,
// cookies off) reads return null and the nudge simply never shows.

import {
  NUDGE_SESSION_KEY,
  NUDGE_STORAGE_KEY,
  onPaid,
  parseNudgeSession,
  parseNudgeState,
  type NudgeSession,
  type NudgeState,
} from "./nudge-logic";

export function readNudgeState(): NudgeState | null {
  try {
    return parseNudgeState(window.localStorage.getItem(NUDGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Returns false when the write failed (the caller then stops for good). */
export function writeNudgeState(state: NudgeState): boolean {
  try {
    window.localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function readNudgeSession(): NudgeSession | null {
  try {
    return parseNudgeSession(window.sessionStorage.getItem(NUDGE_SESSION_KEY));
  } catch {
    return null;
  }
}

export function writeNudgeSession(session: NudgeSession): boolean {
  try {
    window.sessionStorage.setItem(NUDGE_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/** Called after a verified payment (SupportCheckout): never ask again. */
export function markSupporterPaid(): void {
  const state = readNudgeState();
  if (state) writeNudgeState(onPaid(state));
}

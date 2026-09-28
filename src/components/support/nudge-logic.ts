/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Support nudge — the pure decision rules (no DOM, no storage)
// ═══════════════════════════════════════════════════════════════════════
//
//  A small "Sorry to interrupt" card that asks, once, for support after a
//  visitor has spent a while on the site. It must never get in the way,
//  so every rule below says when NOT to show it. SupportNudge.tsx reads
//  the browser (storage, route, open dialogs, the tour) and asks
//  decideNudge(); tests/support-nudge.test.ts covers every rule.
//
//    shows after   NUDGE_ACTIVE_MS of ACTIVE time (tab visible), summed
//                  across pages and visits
//    never on      /support, /admin*, /admin-recover, /contribute, and any
//                  path with checkout / payment / thank-you in it
//    never         for someone who paid on this browser; while another
//                  dialog, sheet or the first-visit tour is open, or in the
//                  session the tour was first offered; in the first 20 s of
//                  the first page of a visit; twice in one session
//    after it      shows or is closed → quiet for 7 days (and the counter
//                  starts again); "Support the project" → quiet for 30 days

/** Active (visible-tab) time before the card may appear. The one knob. */
export const NUDGE_ACTIVE_MS = 90_000;
/** Never on the first page view of a visit until this long after arrival. */
export const NUDGE_MIN_ARRIVAL_MS = 20_000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Quiet time after the card was shown, closed or "Maybe later". */
export const NUDGE_SNOOZE_MS = 7 * DAY_MS;
/** Quiet time after "Support the project". */
export const NUDGE_SUPPORT_SNOOZE_MS = 30 * DAY_MS;

/** localStorage: { activeMs, snoozeUntil, paid } (see NudgeState). */
export const NUDGE_STORAGE_KEY = "ftp.supportNudge.v1";
/** sessionStorage: { arrivedAt, shown } for this visit. */
export const NUDGE_SESSION_KEY = "ftp.supportNudge.session";

export interface NudgeState {
  /** Active milliseconds counted since the last time the card was shown. */
  activeMs: number;
  /** Epoch ms; nothing shows before this. 0 = no snooze. */
  snoozeUntil: number;
  /** True once a payment succeeded on this browser. Never shown again. */
  paid: boolean;
}

export interface NudgeSession {
  /** Epoch ms of the first page view in this browser session. */
  arrivedAt: number;
  /** True once the card was shown in this session. */
  shown: boolean;
}

export const EMPTY_NUDGE_STATE: NudgeState = { activeMs: 0, snoozeUntil: 0, paid: false };

/** Parse a stored state; anything odd becomes the empty state. */
export function parseNudgeState(raw: string | null): NudgeState {
  if (!raw) return { ...EMPTY_NUDGE_STATE };
  try {
    const v = JSON.parse(raw) as Partial<NudgeState>;
    return {
      activeMs: Number.isFinite(v.activeMs) && (v.activeMs as number) > 0 ? (v.activeMs as number) : 0,
      snoozeUntil: Number.isFinite(v.snoozeUntil) && (v.snoozeUntil as number) > 0 ? (v.snoozeUntil as number) : 0,
      paid: v.paid === true,
    };
  } catch {
    return { ...EMPTY_NUDGE_STATE };
  }
}

/** Parse the per-session record; null when missing or broken. */
export function parseNudgeSession(raw: string | null): NudgeSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<NudgeSession>;
    if (!Number.isFinite(v.arrivedAt)) return null;
    return { arrivedAt: v.arrivedAt as number, shown: v.shown === true };
  } catch {
    return null;
  }
}

const BLOCKED_SECTIONS = new Set(["support", "admin", "admin-recover", "contribute"]);
const PAYMENT_WORDS = /(checkout|payment|thank-?you|thanks)/i;

/**
 * True for a route where the card must never appear. `pathname` is the
 * browser path with its locale (`/en/support`); a path without a locale
 * (`/support`) is read the same way.
 */
export function isNudgeRouteBlocked(pathname: string, locales: readonly string[] = ["en", "hi", "kn"]): boolean {
  const parts = pathname.split(/[?#]/)[0].split("/").filter(Boolean);
  const rest = parts.length > 0 && locales.includes(parts[0]) ? parts.slice(1) : parts;
  if (rest.length > 0 && BLOCKED_SECTIONS.has(rest[0].toLowerCase())) return true;
  if (rest.some((p) => p.toLowerCase().startsWith("admin"))) return true;
  return rest.some((p) => PAYMENT_WORDS.test(p));
}

export type NudgeReason =
  | "show"
  | "storage"
  | "paid"
  | "route"
  | "shown-this-session"
  | "snoozed"
  | "too-early"
  | "not-enough-time"
  | "dialog-open"
  | "tour";

export interface NudgeInput {
  /** null when localStorage could not be read — then it never shows. */
  state: NudgeState | null;
  /** null when sessionStorage could not be read — then it never shows. */
  session: NudgeSession | null;
  now: number;
  pathname: string;
  /** True while the visitor is still on the first page of this visit. */
  firstPageView: boolean;
  /** Another dialog, sheet or pop-up is open. */
  otherDialogOpen: boolean;
  /** The first-visit tour (or its offer) is on screen, or was offered this session. */
  tourBusy: boolean;
  thresholdMs?: number;
}

/** Should the card appear now? `reason` names the rule that decided. */
export function decideNudge(input: NudgeInput): { show: boolean; reason: NudgeReason } {
  const no = (reason: NudgeReason) => ({ show: false, reason });
  const { state, session, now } = input;
  if (!state || !session) return no("storage");
  if (state.paid) return no("paid");
  if (isNudgeRouteBlocked(input.pathname)) return no("route");
  if (session.shown) return no("shown-this-session");
  if (state.snoozeUntil > now) return no("snoozed");
  if (input.firstPageView && now - session.arrivedAt < NUDGE_MIN_ARRIVAL_MS) return no("too-early");
  if (state.activeMs < (input.thresholdMs ?? NUDGE_ACTIVE_MS)) return no("not-enough-time");
  if (input.tourBusy) return no("tour");
  if (input.otherDialogOpen) return no("dialog-open");
  return { show: true, reason: "show" };
}

/** Add active time; stops counting once the threshold is reached. */
export function addActiveTime(state: NudgeState, deltaMs: number, thresholdMs = NUDGE_ACTIVE_MS): NudgeState {
  if (!(deltaMs > 0)) return state;
  // Ignore big gaps (sleep, a frozen tab): at most one minute per tick.
  const step = Math.min(deltaMs, 60_000);
  return { ...state, activeMs: Math.min(state.activeMs + step, thresholdMs) };
}

/** The card appeared: quiet for 7 days and the counter starts again. */
export function onNudgeShown(state: NudgeState, now: number): NudgeState {
  return { ...state, activeMs: 0, snoozeUntil: Math.max(state.snoozeUntil, now + NUDGE_SNOOZE_MS) };
}

/** "Maybe later", ✕ or Escape: quiet for 7 days. */
export function onNudgeDismissed(state: NudgeState, now: number): NudgeState {
  return { ...state, activeMs: 0, snoozeUntil: Math.max(state.snoozeUntil, now + NUDGE_SNOOZE_MS) };
}

/** "Support the project": quiet for 30 days. */
export function onNudgeSupportClicked(state: NudgeState, now: number): NudgeState {
  return { ...state, activeMs: 0, snoozeUntil: Math.max(state.snoozeUntil, now + NUDGE_SUPPORT_SNOOZE_MS) };
}

/** A payment succeeded: never ask this browser again. */
export function onPaid(state: NudgeState): NudgeState {
  return { ...state, paid: true };
}

/** The first-visit tour's attribute on <html> while it (or its offer) is on screen. */
export const TOUR_ACTIVE_VALUE = "active";
/** sessionStorage key the tour sets to "1" once it was offered this session. */
export const TOUR_FIRST_SESSION_KEY = "ftp.tour.firstSession";

/**
 * Is the first-visit tour busy? `htmlTour` is
 * `document.documentElement.dataset.ftpTour`, `firstSession` is
 * `sessionStorage[TOUR_FIRST_SESSION_KEY]`. Missing values mean "not busy".
 */
export function tourBusyFrom(htmlTour: string | null | undefined, firstSession: string | null | undefined): boolean {
  return htmlTour === TOUR_ACTIVE_VALUE || firstSession === "1";
}

/**
 * The smallest real prices, read from the plan table (TIER_CONFIG in
 * src/lib/constants/razorpay-plans.ts), never typed by hand: the cheapest
 * monthly plan and the lowest one-time amount.
 */
export function smallestAmounts(
  tiers: Record<string, { amount: number; minAmount: number; isRecurring: boolean }>,
): { monthly: number | null; once: number | null } {
  const list = Object.values(tiers);
  const monthly = list.filter((t) => t.isRecurring).map((t) => t.minAmount);
  const once = list.filter((t) => !t.isRecurring).map((t) => t.minAmount);
  return {
    monthly: monthly.length ? Math.min(...monthly) : null,
    once: once.length ? Math.min(...once) : null,
  };
}

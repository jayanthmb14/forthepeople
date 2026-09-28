/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The "Sorry to interrupt" support card: when it may and may not appear
 * (src/components/support/nudge-logic.ts). Pure helpers only.
 */
import { describe, expect, it } from "vitest";
import {
  addActiveTime,
  decideNudge,
  isNudgeRouteBlocked,
  NUDGE_ACTIVE_MS,
  NUDGE_MIN_ARRIVAL_MS,
  NUDGE_SNOOZE_MS,
  NUDGE_SUPPORT_SNOOZE_MS,
  onNudgeDismissed,
  onNudgeShown,
  onNudgeSupportClicked,
  onPaid,
  parseNudgeSession,
  parseNudgeState,
  smallestAmounts,
  tourBusyFrom,
  type NudgeInput,
} from "@/components/support/nudge-logic";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";

const NOW = 1_800_000_000_000;

function input(over: Partial<NudgeInput> = {}): NudgeInput {
  return {
    state: { activeMs: NUDGE_ACTIVE_MS, snoozeUntil: 0, paid: false },
    session: { arrivedAt: NOW - 10 * 60_000, shown: false },
    now: NOW,
    pathname: "/en/karnataka/mandya",
    firstPageView: false,
    otherDialogOpen: false,
    tourBusy: false,
    ...over,
  };
}

describe("decideNudge", () => {
  it("shows after enough active time on an ordinary page", () => {
    expect(decideNudge(input())).toEqual({ show: true, reason: "show" });
  });

  it("waits for the full active time (90 s by default)", () => {
    expect(NUDGE_ACTIVE_MS).toBe(90_000);
    expect(decideNudge(input({ state: { activeMs: NUDGE_ACTIVE_MS - 1, snoozeUntil: 0, paid: false } })).reason).toBe("not-enough-time");
  });

  it("never shows when storage cannot be read", () => {
    expect(decideNudge(input({ state: null })).reason).toBe("storage");
    expect(decideNudge(input({ session: null })).reason).toBe("storage");
  });

  it("never shows to someone who paid", () => {
    expect(decideNudge(input({ state: { activeMs: NUDGE_ACTIVE_MS, snoozeUntil: 0, paid: true } })).reason).toBe("paid");
  });

  it("never shows on support, admin, contribute or payment routes", () => {
    for (const p of ["/en/support", "/kn/support?tier=district", "/en/admin", "/hi/admin/supporters", "/en/admin-recover", "/en/contribute", "/en/checkout", "/en/payment/thank-you"]) {
      expect(decideNudge(input({ pathname: p })).reason, p).toBe("route");
    }
  });

  it("shows on district, home and India pages", () => {
    for (const p of ["/en", "/kn/karnataka/mandya/water", "/hi/india", "/en/contributors", "/en/about"]) {
      expect(decideNudge(input({ pathname: p })).show, p).toBe(true);
    }
  });

  it("at most once per session", () => {
    expect(decideNudge(input({ session: { arrivedAt: NOW - 600_000, shown: true } })).reason).toBe("shown-this-session");
  });

  it("respects a snooze until it ends", () => {
    expect(decideNudge(input({ state: { activeMs: NUDGE_ACTIVE_MS, snoozeUntil: NOW + 1, paid: false } })).reason).toBe("snoozed");
    expect(decideNudge(input({ state: { activeMs: NUDGE_ACTIVE_MS, snoozeUntil: NOW, paid: false } })).show).toBe(true);
  });

  it("never in the first 20 s of the first page of a visit", () => {
    const early = { arrivedAt: NOW - (NUDGE_MIN_ARRIVAL_MS - 1), shown: false };
    expect(decideNudge(input({ firstPageView: true, session: early })).reason).toBe("too-early");
    // The same moment on a later page of the visit is fine.
    expect(decideNudge(input({ firstPageView: false, session: early })).show).toBe(true);
    expect(decideNudge(input({ firstPageView: true, session: { arrivedAt: NOW - NUDGE_MIN_ARRIVAL_MS, shown: false } })).show).toBe(true);
  });

  it("waits while another dialog is open", () => {
    expect(decideNudge(input({ otherDialogOpen: true })).reason).toBe("dialog-open");
  });

  it("waits for the first-visit tour", () => {
    expect(decideNudge(input({ tourBusy: true })).reason).toBe("tour");
  });

  it("takes a custom threshold", () => {
    expect(decideNudge(input({ thresholdMs: 5_000, state: { activeMs: 5_000, snoozeUntil: 0, paid: false } })).show).toBe(true);
  });
});

describe("tourBusyFrom", () => {
  it("is busy while the tour is on screen or was offered this session", () => {
    expect(tourBusyFrom("active", null)).toBe(true);
    expect(tourBusyFrom(undefined, "1")).toBe(true);
  });
  it("missing or other values mean not busy", () => {
    expect(tourBusyFrom(undefined, null)).toBe(false);
    expect(tourBusyFrom("done", "0")).toBe(false);
    expect(tourBusyFrom("", "")).toBe(false);
  });
});

describe("isNudgeRouteBlocked", () => {
  it("reads paths with or without a locale", () => {
    expect(isNudgeRouteBlocked("/support")).toBe(true);
    expect(isNudgeRouteBlocked("/en/support#tiers")).toBe(true);
    expect(isNudgeRouteBlocked("/en/karnataka/mandya")).toBe(false);
    expect(isNudgeRouteBlocked("/")).toBe(false);
  });
});

describe("state changes", () => {
  const empty = { activeMs: 0, snoozeUntil: 0, paid: false };

  it("counts active time up to the threshold, ignoring odd deltas", () => {
    expect(addActiveTime(empty, 5_000).activeMs).toBe(5_000);
    expect(addActiveTime({ ...empty, activeMs: 88_000 }, 5_000).activeMs).toBe(NUDGE_ACTIVE_MS);
    expect(addActiveTime(empty, -10).activeMs).toBe(0);
    expect(addActiveTime(empty, Number.NaN).activeMs).toBe(0);
    // A sleeping laptop does not count as hours of reading.
    expect(addActiveTime(empty, 3_600_000, 10 * 60_000).activeMs).toBe(60_000);
  });

  it("showing or closing snoozes 7 days and restarts the counter", () => {
    const shown = onNudgeShown({ ...empty, activeMs: NUDGE_ACTIVE_MS }, NOW);
    expect(shown).toEqual({ activeMs: 0, snoozeUntil: NOW + NUDGE_SNOOZE_MS, paid: false });
    expect(onNudgeDismissed(empty, NOW).snoozeUntil).toBe(NOW + 7 * 24 * 3600 * 1000);
  });

  it("clicking Support snoozes 30 days", () => {
    expect(onNudgeSupportClicked(onNudgeShown(empty, NOW), NOW).snoozeUntil).toBe(NOW + NUDGE_SUPPORT_SNOOZE_MS);
    expect(NUDGE_SUPPORT_SNOOZE_MS).toBe(30 * 24 * 3600 * 1000);
  });

  it("a later dismiss never shortens a longer snooze", () => {
    const long = onNudgeSupportClicked(empty, NOW);
    expect(onNudgeDismissed(long, NOW).snoozeUntil).toBe(NOW + NUDGE_SUPPORT_SNOOZE_MS);
  });

  it("paid sticks", () => {
    expect(onPaid(empty).paid).toBe(true);
    expect(onNudgeDismissed(onPaid(empty), NOW).paid).toBe(true);
  });
});

describe("parsing stored values", () => {
  it("broken or missing state becomes empty", () => {
    expect(parseNudgeState(null)).toEqual({ activeMs: 0, snoozeUntil: 0, paid: false });
    expect(parseNudgeState("{not json")).toEqual({ activeMs: 0, snoozeUntil: 0, paid: false });
    expect(parseNudgeState('{"activeMs":-5,"snoozeUntil":"x","paid":"yes"}')).toEqual({ activeMs: 0, snoozeUntil: 0, paid: false });
    expect(parseNudgeState('{"activeMs":1000,"snoozeUntil":5,"paid":true}')).toEqual({ activeMs: 1000, snoozeUntil: 5, paid: true });
  });
  it("broken session is null", () => {
    expect(parseNudgeSession(null)).toBeNull();
    expect(parseNudgeSession("[]")).toBeNull();
    expect(parseNudgeSession('{"arrivedAt":10}')).toEqual({ arrivedAt: 10, shown: false });
  });
});

describe("smallestAmounts", () => {
  it("reads the real plan table", () => {
    const { monthly, once } = smallestAmounts(TIER_CONFIG);
    const recurring = Object.values(TIER_CONFIG).filter((t) => t.isRecurring);
    expect(monthly).toBe(Math.min(...recurring.map((t) => t.minAmount)));
    expect(monthly).toBe(TIER_CONFIG.district.minAmount);
    expect(once).toBe(TIER_CONFIG.custom.minAmount);
  });
  it("returns null when a kind is missing", () => {
    expect(smallestAmounts({})).toEqual({ monthly: null, once: null });
  });
});

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Only what Razorpay signed or the server checked may reach the public
// supporter wall (src/lib/supporter-payment.ts). Sept 2026 review: the
// browser could turn a ₹99 subscription into a ₹99,000 "founder", a ₹10
// payment into an "All-India Patron", and the webhook / sync button wrote
// never-expiring rows named after the payer's phone number.
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  capturedPaymentFromRazorpay,
  expiryOnCancel,
  oneTimeOrder,
  oneTimeSupporterData,
  oneTimeTierKey,
  RAZORPAY_NOTE_MAX,
  subscriptionFieldsFromNotes,
  subscriptionNotes,
  validRazorpaySignature,
  type CapturedPayment,
  type CheckoutAnswers,
} from "@/lib/supporter-payment";
import { MASKED_NAME } from "@/lib/supporter-name";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAID_AT = new Date("2026-09-01T10:00:00.000Z");

describe("validRazorpaySignature", () => {
  const secret = "test_secret";
  const sign = (s: string) => createHmac("sha256", secret).update(s).digest("hex");
  it("accepts Razorpay's HMAC of the payload", () => {
    expect(validRazorpaySignature("order_1|pay_1", sign("order_1|pay_1"), secret)).toBe(true);
  });
  it("refuses another payload, junk, non-strings and an empty secret without throwing", () => {
    expect(validRazorpaySignature("order_2|pay_1", sign("order_1|pay_1"), secret)).toBe(false);
    expect(validRazorpaySignature("order_1|pay_1", "zz".repeat(32), secret)).toBe(false);
    expect(validRazorpaySignature("order_1|pay_1", "abc", secret)).toBe(false);
    expect(validRazorpaySignature("order_1|pay_1", 42, secret)).toBe(false);
    expect(validRazorpaySignature("order_1|pay_1", sign("order_1|pay_1"), "")).toBe(false);
  });
});

describe("oneTimeOrder (create-order)", () => {
  it("stores monthly tiers and unknown names as custom", () => {
    expect(oneTimeOrder("patron", 10)).toEqual({ ok: true, tier: "custom" });
    expect(oneTimeOrder("founder", 500)).toEqual({ ok: true, tier: "custom" });
    expect(oneTimeOrder("x", 100)).toEqual({ ok: true, tier: "custom" });
    expect(oneTimeOrder("constructor", 100)).toEqual({ ok: true, tier: "custom" });
    expect(oneTimeOrder(undefined, 100)).toEqual({ ok: true, tier: "custom" });
    expect(oneTimeOrder("One-Time Contribution", 50)).toEqual({ ok: true, tier: "custom" });
  });
  it("applies the custom bounds to every one-time order", () => {
    expect(oneTimeOrder("custom", 10).ok).toBe(true);
    expect(oneTimeOrder("custom", 50000).ok).toBe(true);
    expect(oneTimeOrder("custom", 9).ok).toBe(false);
    expect(oneTimeOrder("custom", 50001).ok).toBe(false);
    expect(oneTimeOrder("x", 500000).ok).toBe(false);
    expect(oneTimeOrder("custom", 99.5).ok).toBe(false);
    expect(oneTimeOrder("custom", "100").ok).toBe(false);
  });
  it("keeps the tier key of a real one-time tier", () => {
    expect(oneTimeTierKey("custom")).toBe("custom");
    expect(oneTimeTierKey("district")).toBe("custom");
  });
});

const checkout = (over: Partial<CheckoutAnswers> = {}): CheckoutAnswers => ({
  name: "Preethaam",
  isPublic: true,
  message: "Keep going",
  tier: "custom",
  email: "typed@example.com",
  ...over,
});
const payment = (over: Partial<CapturedPayment> = {}): CapturedPayment => ({
  paymentId: "pay_1",
  orderId: "order_1",
  amountPaise: 50000,
  paidAt: PAID_AT,
  ...over,
});

describe("oneTimeSupporterData (verify, webhook and sync write the same row)", () => {
  it("uses the checkout's name, visibility, message and tier", () => {
    const d = oneTimeSupporterData(payment(), checkout());
    expect(d).toMatchObject({
      name: "Preethaam",
      isPublic: true,
      message: "Keep going",
      tier: "custom",
      amount: 500,
      currency: "INR",
      paymentId: "pay_1",
      orderId: "order_1",
      status: "success",
      isRecurring: false,
      email: "typed@example.com",
    });
  });
  it("never creates a row for a subscription debit", () => {
    expect(oneTimeSupporterData(payment({ invoiceId: "inv_1" }), checkout())).toBeNull();
  });
  it("never creates a row without a payment id or amount", () => {
    expect(oneTimeSupporterData(payment({ paymentId: "" }), checkout())).toBeNull();
    expect(oneTimeSupporterData(payment({ amountPaise: 0 }), checkout())).toBeNull();
  });
  it("masks a name that is contact details, and hides a payment with no checkout", () => {
    expect(oneTimeSupporterData(payment(), checkout({ name: "+91 98765 43210" }))!.name).toBe(MASKED_NAME);
    const orphan = oneTimeSupporterData(payment({ contact: "+919876543210", email: "payer@example.com" }), null)!;
    expect(orphan.name).toBe(MASKED_NAME);
    expect(orphan.isPublic).toBe(false);
    expect(orphan.phone).toBe("+919876543210");
    expect(orphan.email).toBe("payer@example.com");
  });
  it("keeps the anonymity choice made at checkout", () => {
    expect(oneTimeSupporterData(payment(), checkout({ isPublic: false }))!.isPublic).toBe(false);
  });
  it("never shows a one-time payment under a monthly tier", () => {
    expect(oneTimeSupporterData(payment(), checkout({ tier: "patron" }))!.tier).toBe("custom");
    expect(oneTimeSupporterData(payment(), checkout({ tier: null }))!.tier).toBe("custom");
  });
  it("always sets the expiry the amount earns, from the payment date", () => {
    expect(oneTimeSupporterData(payment({ amountPaise: 10000 }), checkout())!.expiresAt.getTime()).toBe(PAID_AT.getTime() + 30 * DAY_MS);
    expect(oneTimeSupporterData(payment({ amountPaise: 50000 }), checkout())!.expiresAt.getTime()).toBe(PAID_AT.getTime() + 60 * DAY_MS);
    expect(oneTimeSupporterData(payment({ amountPaise: 200000 }), checkout())!.expiresAt.getTime()).toBe(PAID_AT.getTime() + 90 * DAY_MS);
  });
});

describe("capturedPaymentFromRazorpay", () => {
  it("reads a Razorpay payment entity", () => {
    const p = capturedPaymentFromRazorpay({
      id: "pay_9", order_id: "order_9", invoice_id: null, amount: 20000, currency: "INR",
      email: "a@b.in", contact: "+919999999999", method: "upi", created_at: PAID_AT.getTime() / 1000,
    });
    expect(p).toMatchObject({ paymentId: "pay_9", orderId: "order_9", invoiceId: null, amountPaise: 20000, method: "upi" });
    expect(p.paidAt.getTime()).toBe(PAID_AT.getTime());
    expect(capturedPaymentFromRazorpay({ id: "pay_x", invoice_id: "inv_1" }).invoiceId).toBe("inv_1");
  });
});

describe("subscriptionFieldsFromNotes (verify-subscription reads Razorpay, not the browser)", () => {
  // Exactly what create-subscription writes as the subscription's notes.
  const notes = {
    name: "Preethaam", email: "", phone: "9876543210", tier: "district", amount: String(99),
    districtId: "dist_1", stateId: "state_1", socialLink: "", message: "", platform: "forthepeople.in",
  };
  it("accepts the notes create-subscription writes", () => {
    expect(subscriptionFieldsFromNotes(notes)).toEqual({
      ok: true,
      fields: { tier: "district", amount: 99, districtId: "dist_1", stateId: "state_1", badgeType: "champion" },
    });
    expect(subscriptionFieldsFromNotes({ ...notes, tier: "founder", amount: "50000", districtId: "", stateId: "" })).toMatchObject({
      ok: true,
      fields: { tier: "founder", amount: 50000, districtId: null, stateId: null, badgeType: "founder" },
    });
  });
  it("refuses unknown and one-time tiers", () => {
    expect(subscriptionFieldsFromNotes({ ...notes, tier: "emperor" }).ok).toBe(false);
    expect(subscriptionFieldsFromNotes({ ...notes, tier: "custom" }).ok).toBe(false);
    expect(subscriptionFieldsFromNotes({ ...notes, tier: "constructor" }).ok).toBe(false);
  });
  it("refuses amounts outside the plan's range", () => {
    expect(subscriptionFieldsFromNotes({ ...notes, amount: "98" }).ok).toBe(false);
    expect(subscriptionFieldsFromNotes({ ...notes, amount: "999" }).ok).toBe(false);
    expect(subscriptionFieldsFromNotes({ ...notes, amount: "abc" }).ok).toBe(false);
  });
  it("refuses a district plan without its district, and missing notes", () => {
    expect(subscriptionFieldsFromNotes({ ...notes, districtId: "" }).ok).toBe(false);
    expect(subscriptionFieldsFromNotes(null).ok).toBe(false);
    expect(subscriptionFieldsFromNotes([]).ok).toBe(false);
  });
});

describe("subscriptionNotes (create-subscription → Razorpay → verify-subscription)", () => {
  const base = { name: "Preethaam", email: " a@b.in ", phone: "9876543210", tier: "state", amount: 999, districtId: undefined, stateId: "state_1" };
  it("round-trips: verify-subscription accepts what create-subscription writes", () => {
    const notes = subscriptionNotes({ ...base, socialLink: "@handle", message: "Hello" });
    expect(notes).toMatchObject({ email: "a@b.in", tier: "state", amount: "999", districtId: "", stateId: "state_1", platform: "forthepeople.in" });
    expect(subscriptionFieldsFromNotes(notes)).toEqual({
      ok: true,
      fields: { tier: "state", amount: 999, districtId: null, stateId: "state_1", badgeType: "state" },
    });
  });
  it("keeps every value within Razorpay's 256 characters", () => {
    const notes = subscriptionNotes({ ...base, message: "m".repeat(280), socialLink: "https://example.com/" + "x".repeat(400), email: "e".repeat(300) });
    for (const [k, v] of Object.entries(notes)) expect(v.length, k).toBeLessThanOrEqual(RAZORPAY_NOTE_MAX);
    expect(notes.message).toHaveLength(RAZORPAY_NOTE_MAX);
    expect(subscriptionFieldsFromNotes(notes).ok).toBe(true);
  });
});

describe("expiryOnCancel (cancelled / halted monthly supporters stop being shown)", () => {
  const now = new Date("2026-09-28T00:00:00.000Z");
  const periodEnd = new Date("2026-10-15T00:00:00.000Z");
  it("uses the end of the period already paid for", () => {
    expect(expiryOnCancel(periodEnd.getTime() / 1000, null, now)).toEqual(periodEnd);
  });
  it("falls back to now without a period end", () => {
    expect(expiryOnCancel(undefined, null, now)).toEqual(now);
    expect(expiryOnCancel(0, null, now)).toEqual(now);
  });
  it("keeps an earlier expiry the row already has", () => {
    const earlier = new Date("2026-10-01T00:00:00.000Z");
    expect(expiryOnCancel(periodEnd.getTime() / 1000, earlier, now)).toEqual(earlier);
    const later = new Date("2026-12-01T00:00:00.000Z");
    expect(expiryOnCancel(periodEnd.getTime() / 1000, later, now)).toEqual(periodEnd);
  });
});

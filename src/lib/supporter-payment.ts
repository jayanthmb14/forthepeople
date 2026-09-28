/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The rules that turn a Razorpay payment into what the supporter wall shows.
// Pure: no database, no network. The routes (payment verify, the Razorpay
// webhook, the admin sync button) fetch what they need and ask here, so
// one rule decides a supporter's name, visibility, tier, amount and expiry
// wherever the payment is recorded (src/lib/record-supporter-payment.ts).
//
// Why (Sept 2026 review): the payer's browser sends the tier and amount,
// but only what Razorpay signed or what the server itself checked may reach
// the public wall. A ₹10 payment must never be shown as a ₹5,00,000
// "Founding Builder".

import { createHmac, timingSafeEqual } from "crypto";
import { TIER_CONFIG, type TierConfigItem } from "@/lib/constants/razorpay-plans";
import { calculateOneTimeExpiry } from "@/lib/contribution-expiry";
import { MASKED_NAME, looksLikeContactInfo } from "@/lib/supporter-name";

/** A TIER_CONFIG entry by key (own keys only: "constructor" is not a tier). */
function tierConfig(tier: unknown): TierConfigItem | null {
  return typeof tier === "string" && Object.hasOwn(TIER_CONFIG, tier) ? TIER_CONFIG[tier] : null;
}

/**
 * Razorpay's checkout signature: hex HMAC-SHA256 of `payload`
 * ("order_id|payment_id" or "payment_id|subscription_id") with the key
 * secret. Constant-time; false for anything that is not the exact hex.
 */
export function validRazorpaySignature(payload: string, signature: unknown, secret: string): boolean {
  if (typeof signature !== "string" || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── One-time payments ───────────────────────────────────────

/** The tier a one-time payment is stored under: a one-time tier key, else "custom". */
export function oneTimeTierKey(tier: unknown): string {
  const cfg = tierConfig(tier);
  return cfg && !cfg.isRecurring ? (tier as string) : "custom";
}

/**
 * Check a one-time order before it is created. Monthly tiers ("patron",
 * "founder" …) and unknown names are stored as "custom" and must fit the
 * custom bounds: the checkout already keeps amounts inside them.
 */
export function oneTimeOrder(tier: unknown, amount: unknown): { ok: true; tier: string } | { ok: false; error: string } {
  const key = oneTimeTierKey(tier);
  const cfg = TIER_CONFIG[key];
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < cfg.minAmount || amount > cfg.maxAmount) {
    return { ok: false, error: `Amount must be between ₹${cfg.minAmount} and ₹${cfg.maxAmount.toLocaleString("en-IN")}` };
  }
  return { ok: true, tier: key };
}

/** A captured payment, from the webhook, the sync button or the verify route. */
export interface CapturedPayment {
  paymentId: string;
  orderId: string | null;
  /** Set by Razorpay on every monthly subscription debit. */
  invoiceId?: string | null;
  amountPaise: number;
  currency?: string | null;
  email?: string | null;
  contact?: string | null;
  method?: string | null;
  /** When the payment was made (the expiry counts from here). */
  paidAt: Date;
  /** The Razorpay payment entity, kept on the row for the admin. */
  raw?: object | null;
}

/** What the supporter typed at checkout (the Contribution row of the order). */
export interface CheckoutAnswers {
  name: string | null;
  isPublic: boolean;
  message: string | null;
  tier: string | null;
  email: string | null;
}

/** A Razorpay payment entity (webhook payload or /v1/payments item) → CapturedPayment. */
export function capturedPaymentFromRazorpay(e: Record<string, unknown>): CapturedPayment {
  const createdAt = Number(e.created_at);
  return {
    paymentId: e.id ? String(e.id) : "",
    orderId: e.order_id ? String(e.order_id) : null,
    invoiceId: e.invoice_id ? String(e.invoice_id) : null,
    amountPaise: Number(e.amount ?? 0),
    currency: e.currency ? String(e.currency) : null,
    email: e.email ? String(e.email) : null,
    contact: e.contact ? String(e.contact) : null,
    method: e.method ? String(e.method) : null,
    paidAt: Number.isFinite(createdAt) && createdAt > 0 ? new Date(createdAt * 1000) : new Date(),
    raw: e,
  };
}

/** The Supporter row a one-time payment creates (Prisma create data, minus razorpayData). */
export interface OneTimeSupporterData {
  name: string;
  isPublic: boolean;
  message: string | null;
  email: string | null;
  phone: string | null;
  amount: number;
  currency: string;
  tier: string;
  paymentId: string;
  orderId: string | null;
  method: string | null;
  status: "success";
  isRecurring: false;
  expiresAt: Date;
}

/**
 * The Supporter row for a captured one-time payment, or null when no row may
 * be created: a monthly subscription debit (the subscription's own row
 * covers it; a second row would show it again as a one-time gift), no
 * payment id, or no amount.
 *
 * - name: what the supporter typed, never the payer's phone or e-mail
 *   ("Supporter" when there is no usable name);
 * - shown on the wall only if the checkout said so (no checkout → hidden);
 * - tier: the order's one-time tier, never a monthly one;
 * - expiry: 30 / 60 / 90 days from the payment, by amount.
 */
export function oneTimeSupporterData(p: CapturedPayment, checkout: CheckoutAnswers | null): OneTimeSupporterData | null {
  if (!p.paymentId || p.invoiceId) return null;
  const amount = p.amountPaise / 100;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const typed = checkout?.name?.trim() ?? "";
  return {
    name: typed && !looksLikeContactInfo(typed) ? typed : MASKED_NAME,
    isPublic: checkout ? checkout.isPublic : false,
    message: checkout?.message ?? null,
    email: p.email ?? checkout?.email ?? null,
    phone: p.contact ?? null,
    amount,
    currency: p.currency || "INR",
    tier: oneTimeTierKey(checkout?.tier),
    paymentId: p.paymentId,
    orderId: p.orderId,
    method: p.method ?? null,
    status: "success",
    isRecurring: false,
    expiresAt: calculateOneTimeExpiry(amount, p.paidAt),
  };
}

// ── Monthly subscriptions ───────────────────────────────────

export interface SubscriptionFields {
  tier: string;
  amount: number;
  districtId: string | null;
  stateId: string | null;
  badgeType: string | null;
}

/**
 * Tier, amount and place of a subscription, from the notes create-subscription
 * wrote on it after checking them (fetched from Razorpay, never from the
 * browser). Refuses anything create-subscription would have refused.
 */
export function subscriptionFieldsFromNotes(notes: unknown): { ok: true; fields: SubscriptionFields } | { ok: false; error: string } {
  if (!notes || typeof notes !== "object") return { ok: false, error: "Subscription has no plan details" };
  const n = notes as Record<string, unknown>;
  const cfg = tierConfig(n.tier);
  if (!cfg || !cfg.isRecurring) return { ok: false, error: "Not a monthly plan" };
  const amount = Number(n.amount);
  if (!Number.isFinite(amount) || amount < cfg.minAmount || amount > cfg.maxAmount) {
    return { ok: false, error: "Amount outside the plan's range" };
  }
  const districtId = typeof n.districtId === "string" && n.districtId ? n.districtId : null;
  const stateId = typeof n.stateId === "string" && n.stateId ? n.stateId : null;
  if (cfg.requiresDistrict && !districtId) return { ok: false, error: "Plan needs a district" };
  if (cfg.requiresState && !stateId) return { ok: false, error: "Plan needs a state" };
  return { ok: true, fields: { tier: n.tier as string, amount, districtId, stateId, badgeType: cfg.badgeType } };
}

/**
 * When a cancelled or halted subscription stops being shown: the end of the
 * period already paid for (Razorpay's `current_end`, Unix seconds), or now
 * when that is missing — but never later than an expiry the row already has.
 */
export function expiryOnCancel(currentEnd: unknown, existing: Date | null, now: Date = new Date()): Date {
  const end = Number(currentEnd);
  const candidate = Number.isFinite(end) && end > 0 ? new Date(end * 1000) : now;
  return existing && existing.getTime() < candidate.getTime() ? existing : candidate;
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The ONE writer of Supporter rows for one-time Razorpay payments, used by
// /api/payment/verify (the browser, right after paying), the Razorpay
// webhook (payment.captured, when the browser never came back) and the
// admin "Sync" button. The rules are pure and tested in
// src/lib/supporter-payment.ts; this file only reads the checkout and writes.

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { oneTimeSupporterData, type CapturedPayment, type CheckoutAnswers } from "@/lib/supporter-payment";

/** What the supporter typed at checkout for this order, or null. */
async function checkoutFor(orderId: string | null): Promise<CheckoutAnswers | null> {
  if (!orderId) return null;
  return prisma.contribution.findFirst({
    where: { razorpayOrderId: orderId },
    select: { name: true, isPublic: true, message: true, tier: true, email: true },
  });
}

/**
 * Record a captured one-time payment as its own Supporter row. Idempotent:
 * keyed by the payment id, so the verify route and the webhook can both run
 * (in either order) and an existing row only gets status "success" — it is
 * never overwritten. Returns false when no row may be written (a monthly
 * subscription debit, no payment id, no amount).
 *
 * `checkout` may be passed when the caller already has the order's
 * Contribution; otherwise it is looked up by order id.
 */
export async function recordOneTimePayment(payment: CapturedPayment, checkout?: CheckoutAnswers | null): Promise<boolean> {
  const answers = checkout !== undefined ? checkout : await checkoutFor(payment.orderId);
  const data = oneTimeSupporterData(payment, answers);
  if (!data) return false;
  await prisma.supporter.upsert({
    where: { paymentId: data.paymentId },
    update: { status: "success" },
    create: { ...data, ...(payment.raw ? { razorpayData: payment.raw as Prisma.InputJsonValue } : {}) },
  });
  return true;
}

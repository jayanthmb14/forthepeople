/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { CONTRIBUTOR_CACHE_KEYS as SUPPORTER_LIST_KEYS } from "@/lib/supporter-cache";
import { validRazorpaySignature } from "@/lib/supporter-payment";
import { recordOneTimePayment } from "@/lib/record-supporter-payment";

// All cache keys used by the supporter lists — must invalidate ALL on payment.
// The public supporter lists' Redis keys (one list, src/lib/supporter-cache.ts).
const CONTRIBUTOR_CACHE_KEYS = SUPPORTER_LIST_KEYS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, contributionId } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      contributionId: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !contributionId) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    // Razorpay signs order_id|payment_id only. A bad signature writes nothing
    // (it used to mark the given contribution "failed" — anyone's).
    if (!validRazorpaySignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature, keySecret)) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // The contribution must be the one this order was created for: the id
    // comes from the browser, and another (unpaid, bigger, "founder")
    // contribution must not ride on this payment.
    const order = await prisma.contribution.findFirst({
      where: { id: contributionId, razorpayOrderId: razorpay_order_id },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Unknown order" }, { status: 400 });
    }

    // Mark as paid
    const contribution = await prisma.contribution.update({
      where: { id: order.id },
      data: {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // The supporter wall row: one row per payment, from what was typed at
    // checkout (src/lib/record-supporter-payment.ts — the webhook and the
    // admin sync write the same row). It no longer looks for an older row
    // with the same e-mail: the e-mail is not verified, so a ₹10 payment
    // with someone else's address used to replace that person's public
    // amount, message and visibility.
    try {
      await recordOneTimePayment(
        {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amountPaise: contribution.amount,
          currency: contribution.currency,
          email: contribution.email,
          paidAt: contribution.paidAt ?? new Date(),
        },
        contribution,
      );
    } catch (supporterErr) {
      console.error("[verify] Supporter upsert failed:", supporterErr);
    }

    // Invalidate ALL contributor caches so walls refresh immediately
    await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));

    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

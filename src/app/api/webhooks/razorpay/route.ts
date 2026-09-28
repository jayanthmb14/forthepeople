/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { calculateBadgeLevel } from "@/lib/badge-level";
import { alertPaymentReceived } from "@/lib/admin-alerts";
import { capturedPaymentFromRazorpay, validRazorpaySignature } from "@/lib/supporter-payment";
import { recordOneTimePayment } from "@/lib/record-supporter-payment";
import { CONTRIBUTOR_CACHE_KEYS as SUPPORTER_LIST_KEYS } from "@/lib/supporter-cache";

// All contributor cache keys — bust after any payment event
// The public supporter lists' Redis keys (one list, src/lib/supporter-cache.ts).
const CONTRIBUTOR_CACHES = SUPPORTER_LIST_KEYS;

export async function POST(req: NextRequest) {
  // If Razorpay keys aren't configured yet, return 200 gracefully
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.log("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping");
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Verify signature (timing-safe)
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  if (!validRazorpaySignature(body, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event: string;
    payload: {
      payment?: { entity: Record<string, unknown> };
      subscription?: { entity: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const subscriptionEntity = payload.payload?.subscription?.entity;

  try {
    // ── Payment events (one-time) ─────────────────────────────
    if (event === "payment.captured" && paymentEntity) {
      const paymentId = String(paymentEntity.id ?? "");
      // A subscription recurring charge fires BOTH `payment.captured` AND
      // `subscription.charged`. The latter updates the existing supporter
      // (linked via razorpaySubscriptionId). The former would otherwise
      // CREATE a brand-new Supporter row with name=phone-number, producing
      // a duplicate per monthly debit. Detect subscription charges via
      // `invoice_id` (set by Razorpay on every recurring debit) and skip
      // the create-side. The subscription.charged handler refreshes
      // expiresAt + badgeLevel.
      const isSubscriptionCharge = !!paymentEntity.invoice_id;
      if (isSubscriptionCharge) {
        // Just update if the row already exists — never create.
        await prisma.supporter.updateMany({
          where: { paymentId },
          data: { status: "success" },
        });
      } else {
        // Same row as /api/payment/verify writes (whichever runs first
        // creates it): the name, visibility, message and tier typed at
        // checkout, never the payer's phone or e-mail as a name, and the
        // expiry the amount earns (src/lib/supporter-payment.ts).
        await recordOneTimePayment(capturedPaymentFromRazorpay(paymentEntity));
      }
    } else if (event === "payment.failed" && paymentEntity) {
      // Policy (2026-04-25): no successful payment = no DB row.
      // If a Supporter was somehow created for this payment (e.g. earlier
      // code path), delete it. Never create a new row on payment.failed.
      const paymentId = String(paymentEntity.id ?? "");
      if (paymentId) {
        const deleted = await prisma.supporter.deleteMany({
          where: { paymentId, status: { not: "success" } },
        });
        if (deleted.count > 0) {
          console.log(`[razorpay-webhook] payment.failed — deleted ${deleted.count} orphan Supporter row(s) for payment ${paymentId}`);
        }
      }

    // ── Subscription events ───────────────────────────────────
    } else if (
      (event === "subscription.activated" || event === "subscription.authenticated") &&
      subscriptionEntity
    ) {
      // E-mandate auth completed on Razorpay's side. The client-side
      // verify-subscription handler usually creates the Supporter row
      // first; if the user closed the browser before it ran, the row
      // is missing. Mark any existing row active; never invent a new
      // one here (we don't have name/email/social/etc. — those come
      // from the verify-subscription body or notes).
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: {
          subscriptionStatus: "active",
          status: "success",
          activatedAt: new Date(),
        },
      });
    } else if (event === "subscription.charged" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      const supporter = await prisma.supporter.findFirst({
        where: { razorpaySubscriptionId: subId },
      });
      if (supporter) {
        const badgeLevel = calculateBadgeLevel(supporter.activatedAt);
        await prisma.supporter.update({
          where: { id: supporter.id },
          data: {
            subscriptionStatus: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            badgeLevel,
            // Update amount if charge amount changed
            ...(subscriptionEntity.current_end
              ? {}
              : {}),
          },
        });
      }
    } else if (event === "subscription.halted" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "expired" },
      });
    } else if (event === "subscription.cancelled" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "cancelled" },
      });
    } else if (event === "subscription.paused" && subscriptionEntity) {
      const subId = String(subscriptionEntity.id);
      await prisma.supporter.updateMany({
        where: { razorpaySubscriptionId: subId },
        data: { subscriptionStatus: "paused" },
      });
    }

    // Alert on successful payment
    if (event === "payment.captured" && paymentEntity) {
      alertPaymentReceived(Number(paymentEntity.amount ?? 0), "One-time").catch(() => {});
    }

    // Bust all contributor caches so walls refresh immediately
    await Promise.all(CONTRIBUTOR_CACHES.map((k) => cacheSet(k, null, 1)));

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error("[razorpay-webhook]", event, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

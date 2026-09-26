/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { calculateOneTimeExpiry } from "@/lib/contribution-expiry";

// All cache keys used by /api/data/contributors — must invalidate ALL on payment.
// Includes the v3 versioned keys introduced when amount-based visibility shipped.
const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:v2",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
  "ftp:contributors:top-tier",
  "ftp:contributors:top-tier:v3",
  "ftp:contributors:growth-trend",
];

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

    // Verify HMAC SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex"),
      );

    if (!signaturesMatch) {
      // Mark as failed
      await prisma.contribution.update({
        where: { id: contributionId },
        data: { status: "failed" },
      });
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Mark as paid
    const contribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // Also save to Supporter table (for admin /supporters view).
    // Returning-subscriber dedup: if a Supporter with this email or phone
    // already exists, UPDATE that row (preserving createdAt + tenure)
    // instead of creating a duplicate. Visibility is reactivated by
    // clearing the previous expiresAt (or extending it via the standard
    // expiry calculator).
    try {
      const amountRupees = contribution.amount / 100; // paise → rupees
      const newExpiresAt = calculateOneTimeExpiry(amountRupees);

      // Look for an existing supporter that this payment belongs to.
      // Match email first (more reliable), then phone.
      let existing = null as Awaited<ReturnType<typeof prisma.supporter.findFirst>>;
      if (contribution.email) {
        existing = await prisma.supporter.findFirst({
          where: { email: contribution.email },
          orderBy: { createdAt: "desc" },
        });
      }
      if (!existing && (contribution as { phone?: string | null }).phone) {
        existing = await prisma.supporter.findFirst({
          where: { phone: (contribution as { phone?: string | null }).phone ?? undefined },
          orderBy: { createdAt: "desc" },
        });
      }

      if (existing) {
        // Returning supporter — refresh visibility, do NOT overwrite identity.
        const extendedExpiry = newExpiresAt && existing.expiresAt && existing.expiresAt > newExpiresAt
          ? existing.expiresAt   // keep the longer existing expiry
          : newExpiresAt;
        await prisma.supporter.update({
          where: { id: existing.id },
          data: {
            status: "success",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: amountRupees,
            tier: contribution.tier ?? existing.tier,
            message: contribution.message ?? existing.message,
            isPublic: contribution.isPublic,
            expiresAt: extendedExpiry,
          },
        });
        console.log(`[verify] Returning supporter ${existing.id} (${existing.email ?? existing.phone}) — refreshed.`);
      } else {
        await prisma.supporter.upsert({
          where: { paymentId: razorpay_payment_id },
          update: { status: "success", expiresAt: newExpiresAt },
          create: {
            name: contribution.name,
            email: contribution.email ?? null,
            amount: amountRupees,
            currency: contribution.currency,
            tier: contribution.tier ?? "one-time",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: "success",
            message: contribution.message ?? null,
            isRecurring: false,
            expiresAt: newExpiresAt,
            isPublic: contribution.isPublic,
          },
        });
      }
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

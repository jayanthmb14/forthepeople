/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { detectAndCleanSocialLink } from "@/lib/social-detect";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";

// All cache keys used by /api/data/contributors — must invalidate ALL on payment
const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
  "ftp:contributors:top-tier",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      phone,
      tier,
      amount: requestAmount,
      districtId,
      stateId,
      socialLink,
      message,
      isPublic,
    } = body as {
      razorpay_subscription_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      name: string;
      email?: string;
      phone?: string;
      tier: string;
      amount?: number;
      districtId?: string;
      stateId?: string;
      socialLink?: string;
      message?: string;
      isPublic?: boolean;
    };

    // Normalise phone to 10-digit Indian number for DB storage.
    const phoneDigits = (phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const phoneToStore = phoneDigits.length === 10 ? phoneDigits : null;

    if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Verify HMAC SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex"),
      );

    if (!signaturesMatch) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Re-validate name (defense-in-depth — client could tamper between
    // create-subscription and verify-subscription).
    const nameCheck = validateContributorName(name);
    if (!nameCheck.ok) {
      return NextResponse.json({ success: false, error: nameCheck.reason }, { status: 400 });
    }
    const cleanedName = nameCheck.cleaned;

    const msgCheck = validateSupporterMessage(message);
    if (!msgCheck.ok) {
      return NextResponse.json({ success: false, error: msgCheck.reason }, { status: 400 });
    }
    const cleanedMessage = msgCheck.cleaned;

    // Clean + detect social link: "@handle" → "https://instagram.com/handle",
    // bare "foo.com" → "https://foo.com", noisy post URLs normalized, etc.
    const social = socialLink?.trim() ? detectAndCleanSocialLink(socialLink.trim()) : null;
    const cleanedSocialUrl = social?.cleanUrl ?? null;

    // Get badge type from tier config
    const tierConfig = TIER_CONFIG[tier];
    const badgeType = tierConfig?.badgeType ?? null;
    const amount = Number.isFinite(requestAmount) && (requestAmount ?? 0) > 0
      ? Number(requestAmount)
      : tierConfig?.amount ?? 0;

    // Create or update Supporter record (upsert to handle webhook race condition)
    await prisma.supporter.upsert({
      where: { paymentId: razorpay_payment_id },
      update: {
        name: cleanedName,
        email: email?.trim() || null,
        phone: phoneToStore,
        amount,
        tier,
        razorpaySubscriptionId: razorpay_subscription_id,
        isRecurring: true,
        subscriptionStatus: "active",
        activatedAt: new Date(),
        expiresAt: null,
        districtId: districtId || null,
        stateId: stateId || null,
        socialLink: cleanedSocialUrl,
        socialPlatform: social?.platform ?? null,
        badgeType,
        message: cleanedMessage,
        isPublic: isPublic !== false,
        status: "success",
      },
      create: {
        name: cleanedName,
        email: email?.trim() || null,
        phone: phoneToStore,
        amount,
        tier,
        paymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        isRecurring: true,
        subscriptionStatus: "active",
        activatedAt: new Date(),
        expiresAt: null,
        districtId: districtId || null,
        stateId: stateId || null,
        socialLink: cleanedSocialUrl,
        socialPlatform: social?.platform ?? null,
        badgeType,
        badgeLevel: null,
        message: cleanedMessage,
        isPublic: isPublic !== false,
        status: "success",
      },
    });

    // Invalidate ALL contributor caches so walls refresh immediately
    await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));

    return NextResponse.json({ success: true, message: "Subscription verified" });
  } catch (err) {
    console.error("[verify-subscription]", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

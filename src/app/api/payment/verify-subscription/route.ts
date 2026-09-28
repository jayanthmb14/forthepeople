/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { subscriptionFieldsFromNotes, validRazorpaySignature } from "@/lib/supporter-payment";
import { detectAndCleanSocialLink } from "@/lib/social-detect";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { CONTRIBUTOR_CACHE_KEYS as SUPPORTER_LIST_KEYS } from "@/lib/supporter-cache";

// All cache keys used by /api/data/contributors — must invalidate ALL on payment
// The public supporter lists' Redis keys (one list, src/lib/supporter-cache.ts).
const CONTRIBUTOR_CACHE_KEYS = SUPPORTER_LIST_KEYS;

/**
 * The subscription's notes as Razorpay holds them (create-subscription wrote
 * them after checking tier, amount and place), or null when Razorpay cannot
 * be reached. One retry; 8 s each.
 */
async function subscriptionNotes(subscriptionId: string): Promise<unknown | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
      if (res.ok) {
        const sub = (await res.json()) as { id?: string; notes?: unknown };
        return sub.id === subscriptionId ? (sub.notes ?? {}) : null;
      }
      if (res.status < 500) return null; // not found / not ours: no point retrying
    } catch {
      // network error or timeout: retry once
    }
  }
  return null;
}

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

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
    }

    if (!validRazorpaySignature(`${razorpay_payment_id}|${razorpay_subscription_id}`, razorpay_signature, keySecret)) {
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

    // Tier, amount, district and state come from the subscription itself —
    // Razorpay's copy of the notes create-subscription wrote after checking
    // them — never from this request body. The signature covers only
    // payment_id|subscription_id, so a ₹99 subscriber used to be able to
    // re-post this call as a ₹99,000 "founder" shown on every page.
    const notes = await subscriptionNotes(razorpay_subscription_id);
    if (notes === null) {
      // Paid, but the plan cannot be confirmed right now: log the id (no
      // personal data) so the owner can add the supporter by hand.
      console.error(`[verify-subscription] could not read subscription ${razorpay_subscription_id} from Razorpay`);
      return NextResponse.json({ success: false, error: "Could not confirm the subscription" }, { status: 502 });
    }
    const plan = subscriptionFieldsFromNotes(notes);
    if (!plan.ok) {
      return NextResponse.json({ success: false, error: plan.error }, { status: 400 });
    }
    const { tier, amount, districtId, stateId, badgeType } = plan.fields;

    // What the supporter chose about their own row (name, contact, link,
    // message, anonymity) may come from the body.
    const shownAs = {
      name: cleanedName,
      email: email?.trim() || null,
      phone: phoneToStore,
      socialLink: cleanedSocialUrl,
      socialPlatform: social?.platform ?? null,
      message: cleanedMessage,
      isPublic: isPublic !== false,
    };

    const subscriptionRow = {
      amount,
      tier,
      razorpaySubscriptionId: razorpay_subscription_id,
      isRecurring: true,
      subscriptionStatus: "active",
      activatedAt: new Date(),
      expiresAt: null,
      districtId,
      stateId,
      badgeType,
      badgeLevel: null,
      status: "success",
    };

    // Upsert by payment id. A replay of this call (or a double submit) only
    // updates the supporter's own choices: it never restarts the tenure
    // (activatedAt), revives a cancelled subscription or clears an expiry
    // the webhook set. A row the webhook wrote first for this payment
    // (not yet linked to the subscription) becomes the subscription's row.
    const existing = await prisma.supporter.findUnique({
      where: { paymentId: razorpay_payment_id },
      select: { razorpaySubscriptionId: true },
    });
    await prisma.supporter.upsert({
      where: { paymentId: razorpay_payment_id },
      update: existing?.razorpaySubscriptionId ? shownAs : { ...shownAs, ...subscriptionRow },
      create: { ...shownAs, ...subscriptionRow, paymentId: razorpay_payment_id },
    });

    // Invalidate ALL contributor caches so walls refresh immediately
    await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));

    return NextResponse.json({ success: true, message: "Subscription verified" });
  } catch (err) {
    console.error("[verify-subscription]", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}

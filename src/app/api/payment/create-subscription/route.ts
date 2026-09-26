/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

// Each call creates a Razorpay plan + subscription: 10 per hour per hashed IP.
// Same limiter key as create-order (see the note there). Fails open on a
// Redis outage.
const ORDER_LIMIT = 10;
const ORDER_WINDOW_SECONDS = 60 * 60;

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`payment-order:${hashIp(getClientIp(req))}`, ORDER_LIMIT, ORDER_WINDOW_SECONDS);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please try again in an hour." },
      { status: 429, headers: { "Retry-After": String(ORDER_WINDOW_SECONDS) } }
    );
  }

  try {
    const body = await req.json();
    const { tier, amount, name, email, phone, districtId, stateId, socialLink, message } = body as {
      tier: string;
      amount: number;
      name: string;
      email?: string;
      phone?: string;
      districtId?: string;
      stateId?: string;
      socialLink?: string;
      message?: string;
    };

    // Validate phone (required for subscriptions — UPI AutoPay / e-mandate
    // needs a verified contact). 10-digit Indian number, strip +91 prefix.
    const phoneDigits = (phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit phone number is required for subscriptions" },
        { status: 400 }
      );
    }

    const nameResult = validateContributorName(name);
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.reason }, { status: 400 });
    }
    const cleanedName = nameResult.cleaned;

    const messageResult = validateSupporterMessage(message);
    if (!messageResult.ok) {
      return NextResponse.json({ error: messageResult.reason }, { status: 400 });
    }
    const cleanedMessage = messageResult.cleaned;

    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig || !tierConfig.isRecurring) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    // Validate amount against tier bounds
    if (!Number.isFinite(amount) || amount < tierConfig.minAmount || amount > tierConfig.maxAmount) {
      return NextResponse.json(
        { error: `Amount must be between ₹${tierConfig.minAmount} and ₹${tierConfig.maxAmount.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Validate district/state requirements
    if (tierConfig.requiresDistrict && !districtId) {
      return NextResponse.json({ error: "District selection is required for this tier" }, { status: 400 });
    }
    if (tierConfig.requiresState && !stateId) {
      return NextResponse.json({ error: "State selection is required for this tier" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // ── Create a one-off Razorpay plan with the user's exact amount ──
    const planRes = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        period: "monthly",
        interval: 1,
        item: {
          name: `FTP ${tierConfig.name} ₹${amount}/mo`,
          amount: Math.round(amount * 100), // paise
          currency: "INR",
          description: tierConfig.description,
        },
      }),
    });

    if (!planRes.ok) {
      const errText = await planRes.text();
      console.error("[create-subscription] Plan creation failed:", errText);
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
    }

    const plan = await planRes.json();

    // Create Razorpay subscription using the dynamic plan
    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        plan_id: plan.id,
        total_count: 120, // up to 10 years
        customer_notify: 1, // Razorpay sends payment confirmation SMS + email
        notify_info: {
          notify_email: email?.trim() || undefined,
          notify_phone: `+91${phoneDigits}`,
        },
        notes: {
          name: cleanedName,
          email: email?.trim() || "",
          phone: phoneDigits,
          tier,
          amount: String(amount),
          districtId: districtId || "",
          stateId: stateId || "",
          socialLink: socialLink?.trim() || "",
          message: cleanedMessage ?? "",
          platform: "forthepeople.in",
        },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.error("[create-subscription] Razorpay subscription error:", err);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const data = await subRes.json();

    return NextResponse.json({
      subscriptionId: data.id,
      planId: plan.id,
      amount,
      shortUrl: data.short_url,
    });
  } catch (err) {
    console.error("[create-subscription]", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

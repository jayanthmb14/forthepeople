/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import prisma from "@/lib/db";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

const ABSOLUTE_MIN = 10;
const ABSOLUTE_MAX = 500000;

// Each call creates a Contribution row AND a Razorpay order, so cap it at
// 10 per hour per hashed IP. Shared key with create-subscription so the two
// endpoints cannot be alternated to double the budget. Fails open on a Redis
// outage — a cache blip must not block donations.
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
    const { amount, tier, name, email, phone, message, isPublic } = body as {
      amount: number;
      tier: string;
      name: string;
      email?: string;
      phone?: string;
      message?: string;
      isPublic: boolean;
    };
    // Normalise phone — optional for one-time, but carry through to Razorpay notes.
    const phoneDigits = (phone ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

    // Validate
    const nameResult = validateContributorName(name);
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.reason }, { status: 400 });
    }
    const messageResult = validateSupporterMessage(message);
    if (!messageResult.ok) {
      return NextResponse.json({ error: messageResult.reason }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < ABSOLUTE_MIN || amount > ABSOLUTE_MAX) {
      return NextResponse.json(
        { error: `Amount must be between ₹${ABSOLUTE_MIN} and ₹${ABSOLUTE_MAX.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Per-tier validation (one-time tiers only — subscription tiers go through create-subscription)
    const tierConfig = TIER_CONFIG[tier];
    if (tierConfig && !tierConfig.isRecurring) {
      if (amount < tierConfig.minAmount) {
        return NextResponse.json(
          { error: `Minimum amount for ${tierConfig.name} is ₹${tierConfig.minAmount}` },
          { status: 400 }
        );
      }
      if (amount > tierConfig.maxAmount) {
        return NextResponse.json(
          { error: `Maximum amount for ${tierConfig.name} is ₹${tierConfig.maxAmount.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }
    }

    const razorpay = getRazorpay();

    // Create Prisma record first to get contributionId for receipt
    const contribution = await prisma.contribution.create({
      data: {
        name: nameResult.cleaned,
        email: email?.trim() || null,
        amount: amount * 100, // store in paise
        tier: tier || "custom",
        message: messageResult.cleaned,
        isPublic: isPublic !== false,
        status: "created",
      },
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `ftp_${contribution.id}`,
      notes: {
        tier,
        platform: "forthepeople.in",
        contributionId: contribution.id,
        ...(phoneDigits.length === 10 ? { phone: phoneDigits } : {}),
      },
    });

    // Save orderId back to contribution
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      contributionId: contribution.id,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import prisma from "@/lib/db";
import { oneTimeOrder } from "@/lib/supporter-payment";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

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
    // One-time orders are always stored under a one-time tier ("custom" for
    // monthly tier names and anything unknown) and must fit its bounds: the
    // stored tier is what the supporter wall shows (src/lib/supporter-payment.ts).
    const order = oneTimeOrder(tier, amount);
    if (!order.ok) {
      return NextResponse.json({ error: order.error }, { status: 400 });
    }

    const razorpay = getRazorpay();

    // Create Prisma record first to get contributionId for receipt
    const contribution = await prisma.contribution.create({
      data: {
        name: nameResult.cleaned,
        email: email?.trim() || null,
        amount: amount * 100, // store in paise
        tier: order.tier,
        message: messageResult.cleaned,
        isPublic: isPublic !== false,
        status: "created",
      },
    });

    // Create Razorpay order
    const rzpOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `ftp_${contribution.id}`,
      notes: {
        tier: order.tier,
        platform: "forthepeople.in",
        contributionId: contribution.id,
        ...(phoneDigits.length === 10 ? { phone: phoneDigits } : {}),
      },
    });

    // Save orderId back to contribution
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      contributionId: contribution.id,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { capturedPaymentFromRazorpay } from "@/lib/supporter-payment";
import { recordOneTimePayment } from "@/lib/record-supporter-payment";
import { bustSupporterCaches } from "@/lib/supporter-cache";

export async function POST() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay keys not configured in environment" }, { status: 400 });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Fetch all captured payments from Razorpay (last 100)
    const res = await fetch(
      "https://api.razorpay.com/v1/payments?count=100",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Razorpay API error: ${err}` }, { status: 500 });
    }

    const data = await res.json() as { items: Record<string, unknown>[] };
    const payments = data.items ?? [];

    let synced = 0;
    let skipped = 0;

    // Adds captured one-time payments that have no Supporter row yet (the
    // browser never came back and the webhook was missed), through the same
    // writer as /api/payment/verify and the webhook: the name, visibility,
    // message and tier typed at checkout, an expiry, and never a row for a
    // monthly subscription debit (src/lib/supporter-payment.ts).
    for (const item of payments) {
      if (item.status !== "captured") { skipped++; continue; }
      const payment = capturedPaymentFromRazorpay(item);
      if (!payment.paymentId || payment.invoiceId) { skipped++; continue; }

      const existing = await prisma.supporter.findUnique({ where: { paymentId: payment.paymentId }, select: { id: true } });
      if (existing) { skipped++; continue; }

      if (await recordOneTimePayment(payment)) synced++;
      else skipped++;
    }

    if (synced > 0) await bustSupporterCaches();

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: payments.length,
    });
  } catch (err) {
    console.error("[sync-razorpay]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

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

    for (const payment of payments) {
      if (payment.status !== "captured") { skipped++; continue; }

      const paymentId = String(payment.id ?? "");
      if (!paymentId) { skipped++; continue; }

      const existing = await prisma.supporter.findUnique({ where: { paymentId } });
      if (existing) { skipped++; continue; }

      const notes = (payment.notes as Record<string, string>) ?? {};
      const amountPaise = Number(payment.amount ?? 0);

      await prisma.supporter.create({
        data: {
          name: notes.name ?? String(payment.email ?? payment.contact ?? "Supporter"),
          email: payment.email ? String(payment.email) : null,
          phone: payment.contact ? String(payment.contact) : null,
          amount: amountPaise / 100,
          currency: String(payment.currency ?? "INR"),
          tier: notes.tier ?? "one-time",
          paymentId,
          orderId: payment.order_id ? String(payment.order_id) : null,
          method: payment.method ? String(payment.method) : null,
          status: "success",
          message: notes.message ?? null,
          district: notes.district ?? null,
          razorpayData: payment as object,
        },
      });
      synced++;
    }

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

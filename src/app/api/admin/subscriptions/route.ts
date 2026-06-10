/**
 * ForThePeople.in — Subscription Manager API
 * GET/POST/PATCH/DELETE /api/admin/subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.subscription.findMany({ orderBy: { category: "asc" } });
  const totalMonthly = subs
    .filter((s) => s.status === "active" && s.billingCycle === "monthly")
    .reduce((sum, s) => sum + s.costINR, 0);
  const totalYearly = subs
    .filter((s) => s.status === "active" && s.billingCycle === "yearly")
    .reduce((sum, s) => sum + s.costINR, 0);

  return NextResponse.json({ subscriptions: subs, totalMonthly, totalYearlyPerMonth: totalYearly / 12 });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sub = await prisma.subscription.create({ data: body });
  return NextResponse.json(sub);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sub = await prisma.subscription.update({ where: { id }, data });
  return NextResponse.json(sub);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.subscription.update({ where: { id }, data: { status: "cancelled" } });
  return NextResponse.json({ ok: true });
}

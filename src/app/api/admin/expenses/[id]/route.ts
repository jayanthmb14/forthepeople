/**
 * ForThePeople.in — Single expense update / delete
 * PATCH  /api/admin/expenses/[id]
 * DELETE /api/admin/expenses/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Prisma.ExpenseUpdateInput = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.category !== undefined) data.category = String(body.category);
  if (body.description !== undefined) data.description = String(body.description);
  if (body.amountINR !== undefined) data.amountINR = Number(body.amountINR);
  if (body.amountUSD !== undefined) data.amountUSD = body.amountUSD == null ? null : Number(body.amountUSD);
  if (body.exchangeRate !== undefined) data.exchangeRate = body.exchangeRate == null ? null : Number(body.exchangeRate);
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod ?? null;
  if (body.referenceNumber !== undefined) data.referenceNumber = body.referenceNumber ?? null;
  if (body.invoiceUrl !== undefined) data.invoiceUrl = body.invoiceUrl ?? null;
  if (body.invoiceBlobUrl !== undefined) data.invoiceBlobUrl = body.invoiceBlobUrl ?? null;
  if (body.isRecurring !== undefined) data.isRecurring = Boolean(body.isRecurring);
  if (body.recurringInterval !== undefined) data.recurringInterval = body.recurringInterval ?? null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;

  const expense = await prisma.expense.update({ where: { id }, data });
  await logAuditAuto({
    action: "expense_edit",
    resource: "Expense",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });
  return NextResponse.json({ expense });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.expense.delete({ where: { id } });
  await logAuditAuto({ action: "expense_delete", resource: "Expense", resourceId: id });
  return NextResponse.json({ ok: true });
}

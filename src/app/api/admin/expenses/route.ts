/**
 * ForThePeople.in — Expense CRUD
 * GET  /api/admin/expenses?category=hosting&from=YYYY-MM-DD&to=YYYY-MM-DD&recurring=true
 * POST /api/admin/expenses — create expense
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

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const from = sp.get("from");
  const to = sp.get("to");
  const recurring = sp.get("recurring");

  const where: Prisma.ExpenseWhereInput = {};
  if (category) where.category = category;
  if (recurring === "true") where.isRecurring = true;
  if (recurring === "false") where.isRecurring = false;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: 500,
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.date || !body.category || !body.description || body.amountINR == null) {
    return NextResponse.json(
      { error: "date, category, description, amountINR are required" },
      { status: 400 }
    );
  }

  const amountINR = Number(body.amountINR);
  if (!Number.isFinite(amountINR) || amountINR < 0) {
    return NextResponse.json({ error: "amountINR must be a non-negative number" }, { status: 400 });
  }

  const data: Prisma.ExpenseCreateInput = {
    date: new Date(body.date),
    category: String(body.category),
    description: String(body.description),
    amountINR,
    amountUSD: body.amountUSD != null ? Number(body.amountUSD) : null,
    exchangeRate: body.exchangeRate != null ? Number(body.exchangeRate) : null,
    paymentMethod: body.paymentMethod ?? null,
    referenceNumber: body.referenceNumber ?? null,
    invoiceUrl: body.invoiceUrl ?? null,
    invoiceBlobUrl: body.invoiceBlobUrl ?? null,
    isRecurring: Boolean(body.isRecurring),
    recurringInterval: body.recurringInterval ?? null,
    notes: body.notes ?? null,
  };

  const expense = await prisma.expense.create({ data });
  await logAuditAuto({
    action: "expense_add",
    resource: "Expense",
    resourceId: expense.id,
    details: { category: expense.category, amountINR: expense.amountINR },
  });
  return NextResponse.json({ expense });
}

/**
 * ForThePeople.in — Single subscription update / delete
 * PATCH  /api/admin/subscriptions/[id]
 * DELETE /api/admin/subscriptions/[id] — hard delete
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { encrypt } from "@/lib/encryption";
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

  const data: Prisma.SubscriptionUpdateInput = {};
  const dateFields = ["purchaseDate", "expiryDate", "renewalDate"] as const;
  for (const f of dateFields) {
    if (body[f] !== undefined) {
      (data as Record<string, unknown>)[f] = body[f] ? new Date(body[f]) : null;
    }
  }
  const stringFields = [
    "name",
    "displayName",
    "serviceName",
    "provider",
    "category",
    "plan",
    "billingCycle",
    "status",
    "apiKeyEnvVar",
    "dashboardUrl",
    "notes",
    "currency",
    "accountEmail",
    "loginUsername",
    "loginMethod",
    "loginNotes",
  ] as const;
  for (const f of stringFields) {
    if (body[f] !== undefined) {
      (data as Record<string, unknown>)[f] = body[f] ?? null;
    }
  }
  // Password: encrypt when provided, set null when explicitly cleared.
  if (body.loginPassword !== undefined) {
    if (body.loginPassword === null || body.loginPassword === "") {
      (data as Record<string, unknown>).loginPassword = null;
    } else {
      (data as Record<string, unknown>).loginPassword = encrypt(String(body.loginPassword));
    }
  }
  if (body.costINR !== undefined) data.costINR = Number(body.costINR);
  if (body.costUSD !== undefined) data.costUSD = Number(body.costUSD);
  if (body.costOriginal !== undefined) {
    data.costOriginal = body.costOriginal == null ? null : Number(body.costOriginal);
  }
  if (body.exchangeRate !== undefined) {
    data.exchangeRate = body.exchangeRate == null ? null : Number(body.exchangeRate);
  }
  if (body.autoRenew !== undefined) data.autoRenew = Boolean(body.autoRenew);

  const sub = await prisma.subscription.update({ where: { id }, data });
  await logAuditAuto({
    action: "subscription_edit",
    resource: "Subscription",
    resourceId: id,
    details: {
      fields: Object.keys(data),
      credentialsChanged:
        "loginPassword" in data || "loginUsername" in data || "loginMethod" in data,
    },
  });
  return NextResponse.json({ subscription: sub });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

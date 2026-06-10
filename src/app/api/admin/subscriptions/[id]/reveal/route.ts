/**
 * ForThePeople.in — Reveal subscription login password
 * GET /api/admin/subscriptions/[id]/reveal
 *
 * Returns the decrypted loginPassword for a subscription. Logged in the audit
 * trail so there's a record of every credential access. Requires admin cookie —
 * no vault gate so you can quickly pull a password while debugging a service.
 * Tighten to vault-gated if needed later.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { logAuditAuto } from "@/lib/audit-log";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = await prisma.subscription.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      serviceName: true,
      loginUsername: true,
      loginPassword: true,
      loginMethod: true,
      loginNotes: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let password: string | null = null;
  if (row.loginPassword) {
    try {
      password = decrypt(row.loginPassword);
    } catch {
      password = null;
    }
  }

  await logAuditAuto({
    action: "subscription_reveal_credentials",
    resource: "Subscription",
    resourceId: id,
    details: { serviceName: row.serviceName ?? row.name },
  });

  return NextResponse.json({
    username: row.loginUsername,
    password,
    method: row.loginMethod,
    notes: row.loginNotes,
  });
}

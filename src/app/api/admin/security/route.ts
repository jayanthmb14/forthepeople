/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

// GET — return auth info (no secrets)
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });

  // Count remaining backup codes
  let backupCodeCount = 0;
  if (auth?.backupCodes) {
    try {
      const codes: string[] = JSON.parse(decrypt(auth.backupCodes));
      backupCodeCount = codes.length;
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    totpEnabled: auth?.totpEnabled ?? false,
    totpVerifiedAt: auth?.totpVerifiedAt?.toISOString() ?? null,
    recoveryEmail: auth?.recoveryEmail || process.env.ADMIN_RECOVERY_EMAIL || "",
    recoveryPhone: auth?.recoveryPhone || process.env.ADMIN_RECOVERY_PHONE || "",
    lastLoginAt: auth?.lastLoginAt?.toISOString() ?? null,
    lastLoginIp: auth?.lastLoginIp ?? null,
    backupCodeCount,
  });
}

// PATCH — update recovery email/phone
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recoveryEmail, recoveryPhone } = await req.json() as {
    recoveryEmail?: string;
    recoveryPhone?: string;
  };

  const data: Record<string, string> = {};
  if (recoveryEmail) data.recoveryEmail = recoveryEmail;
  if (recoveryPhone) data.recoveryPhone = recoveryPhone;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.adminAuth.upsert({
    where: { id: "admin" },
    update: data,
    create: { id: "admin", ...data },
  });

  return NextResponse.json({ ok: true });
}

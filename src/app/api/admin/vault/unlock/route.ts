/**
 * ForThePeople.in — Vault unlock
 * POST /api/admin/vault/unlock
 * Body: { totpCode: string }
 *
 * Verifies the TOTP against the AdminAuth TOTP secret. If valid, mints a
 * 10-minute vault session bound to the admin cookie and returns it in
 * `ftp_vault_session` cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";
import { createVaultSession, VAULT_COOKIE } from "@/lib/vault-session";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  const adminCookie = jar.get(COOKIE)?.value;
  if (!adminCookie) {
    // Vault sessions bind to the admin cookie value; header-only admin auth
    // (x-admin-secret / Bearer) cannot unlock the vault.
    return NextResponse.json({ error: "Vault requires a cookie session" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.totpCode === "string" ? body.totpCode.replace(/\s+/g, "") : "";

  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const auth = await prisma.adminAuth
    .findUnique({ where: { id: "admin" } })
    .catch(() => null);

  if (!auth?.totpEnabled || !auth.totpSecret) {
    return NextResponse.json(
      { error: "2FA must be enabled in the Security tab before unlocking the vault." },
      { status: 400 }
    );
  }

  if (!verifyTOTP(auth.totpSecret, code)) {
    await logAuditAuto({ action: "vault_unlock_failed", resource: "Vault" });
    return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
  }

  const { token, expiresIn } = await createVaultSession(adminCookie);
  jar.set(VAULT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: expiresIn,
  });

  await logAuditAuto({ action: "vault_unlock", resource: "Vault" });
  return NextResponse.json({ unlocked: true, expiresIn });
}

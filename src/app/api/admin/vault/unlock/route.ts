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
import { ADMIN_COOKIE, isAdminLoginLocked, recordAdminAuthFailure, requireAdminCookie } from "@/lib/admin-auth";
import { getClientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

// The code is the vault's second factor, so guessing it is throttled like the
// login code: 5 tries per 15 min per IP (fail closed), and every wrong code
// counts towards the admin login lockout, which also closes the vault.
const UNLOCK_MAX_ATTEMPTS = 5;
const UNLOCK_WINDOW_SECONDS = 15 * 60;

export async function POST(req: NextRequest) {
  // Cookie session only: vault sessions bind to the admin cookie value, and
  // the password header (x-admin-secret) with a made-up cookie must not
  // unlock the vault.
  if (!(await requireAdminCookie()).ok) {
    return NextResponse.json({ error: "Vault requires a cookie session" }, { status: 401 });
  }
  const jar = await cookies();
  const adminCookie = jar.get(ADMIN_COOKIE)?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: "Vault requires a cookie session" }, { status: 401 });
  }

  const limiterKey = `admin-vault-unlock:${hashIp(getClientIp(req))}`;
  const rl = await rateLimit(limiterKey, UNLOCK_MAX_ATTEMPTS, UNLOCK_WINDOW_SECONDS, { failClosed: true });
  if (!rl.success || (await isAdminLoginLocked())) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": String(UNLOCK_WINDOW_SECONDS) } }
    );
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
    await recordAdminAuthFailure();
    await logAuditAuto({ action: "vault_unlock_failed", resource: "Vault" });
    return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
  }
  await resetRateLimit(limiterKey);

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

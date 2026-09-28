/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { verifyTOTP } from "@/lib/totp";
import { requireAdmin, requireAdminCookie } from "@/lib/admin-auth";
import { canChangeRecovery } from "@/lib/admin-second-factor";
import { getClientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

// GET — return auth info (no secrets)
export async function GET() {
  if (!(await requireAdmin()).ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

// PATCH — update recovery email/phone. The recovery e-mail receives the link
// that switches 2FA off, so changing it needs what switching 2FA off needs:
// a browser session (not the password header) and, while 2FA is on, a
// current code (src/lib/admin-second-factor.ts).
export async function PATCH(req: NextRequest) {
  if (!(await requireAdminCookie()).ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recoveryEmail, recoveryPhone, code } = await req.json() as {
    recoveryEmail?: string;
    recoveryPhone?: string;
    code?: string;
  };

  const data: Record<string, string> = {};
  if (recoveryEmail) data.recoveryEmail = recoveryEmail;
  if (recoveryPhone) data.recoveryPhone = recoveryPhone;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const auth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  const secret = auth?.totpEnabled ? auth.totpSecret : null;
  const cleanCode = typeof code === "string" ? code.replace(/\s+/g, "") : "";
  let codeValid = false;
  if (secret && cleanCode) {
    // A code check is a credential check: throttle it (fail closed).
    const limiterKey = `admin-security-code:${hashIp(getClientIp(req))}`;
    const rl = await rateLimit(limiterKey, 5, 15 * 60, { failClosed: true });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }
    codeValid = verifyTOTP(secret, cleanCode);
    if (codeValid) await resetRateLimit(limiterKey);
  }

  const gate = canChangeRecovery({ totpEnabled: Boolean(secret), codeGiven: cleanCode.length > 0, codeValid });
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  await prisma.adminAuth.upsert({
    where: { id: "admin" },
    update: data,
    create: { id: "admin", ...data },
  });

  return NextResponse.json({ ok: true });
}

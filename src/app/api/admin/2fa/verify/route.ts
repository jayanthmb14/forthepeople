/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAdminAuthFailure, requireAdminCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";
import { getClientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

// Cookie-only — see setup/route.ts for why the header path is excluded.
async function isAuthed() {
  const { ok } = await requireAdminCookie();
  return ok;
}

// POST: { code: "123456" } — verify and enable 2FA
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A code check is a credential check: throttle it (fail closed), like
  // 2fa/disable and the vault unlock.
  const limiterKey = `admin-2fa-verify:${hashIp(getClientIp(req))}`;
  const rl = await rateLimit(limiterKey, 5, 15 * 60, { failClosed: true });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  if (!adminAuth?.totpSecret) {
    return NextResponse.json({ error: "Run setup first" }, { status: 400 });
  }
  // Only the setup step uses this route; once 2FA is on it must not answer
  // "is this code right?" for anyone holding a session cookie.
  if (adminAuth.totpEnabled) {
    return NextResponse.json({ error: "2FA is already on" }, { status: 409 });
  }

  const valid = verifyTOTP(adminAuth.totpSecret, code);
  if (!valid) {
    await recordAdminAuthFailure();
    return NextResponse.json({
      error: "Code doesn't match. Make sure your app shows the latest code.",
    }, { status: 400 });
  }

  await resetRateLimit(limiterKey);

  // Enable 2FA
  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: { totpEnabled: true, totpVerifiedAt: new Date() },
  });

  return NextResponse.json({ enabled: true, message: "2FA is now active" });
}

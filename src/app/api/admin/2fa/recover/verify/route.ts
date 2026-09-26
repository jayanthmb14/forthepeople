/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

// POST: { token: "..." } — verify recovery token and disable 2FA
export async function POST(req: NextRequest) {
  // A 256-bit token cannot be guessed, but this is still an unauthenticated
  // credential check, so keep it throttled (fail closed) like the others.
  const rl = await rateLimit(`admin-2fa-recover-verify:${hashIp(getClientIp(req))}`, 10, 15 * 60, {
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const { token } = await req.json() as { token: string };
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  const storedHash = adminAuth?.recoveryToken ?? "";
  const tokensMatch = storedHash.length > 0 &&
    storedHash.length === tokenHash.length &&
    crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(storedHash));

  if (
    !adminAuth?.recoveryToken ||
    !adminAuth?.recoveryTokenExpiry ||
    !tokensMatch
  ) {
    return NextResponse.json(
      { error: "This recovery link is invalid or expired. Request a new one." },
      { status: 400 }
    );
  }

  if (new Date() > adminAuth.recoveryTokenExpiry) {
    return NextResponse.json(
      { error: "This recovery link is invalid or expired. Request a new one." },
      { status: 400 }
    );
  }

  // Disable 2FA and clear token
  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: {
      totpEnabled: false,
      totpSecret: null,
      backupCodes: null,
      totpVerifiedAt: null,
      recoveryToken: null,
      recoveryTokenExpiry: null,
    },
  });

  return NextResponse.json({ success: true, message: "2FA disabled. Log in with password." });
}

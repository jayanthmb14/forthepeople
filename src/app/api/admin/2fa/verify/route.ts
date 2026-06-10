/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

// POST: { code: "123456" } — verify and enable 2FA
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } });
  if (!adminAuth?.totpSecret) {
    return NextResponse.json({ error: "Run setup first" }, { status: 400 });
  }

  const valid = verifyTOTP(adminAuth.totpSecret, code);
  if (!valid) {
    return NextResponse.json({
      error: "Code doesn't match. Make sure your app shows the latest code.",
    }, { status: 400 });
  }

  // Enable 2FA
  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: { totpEnabled: true, totpVerifiedAt: new Date() },
  });

  return NextResponse.json({ enabled: true, message: "2FA is now active" });
}

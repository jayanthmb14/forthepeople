/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { requireAdminCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { generateTOTPSecret, generateQRCode, generateBackupCodes } from "@/lib/totp";

// 2FA management is COOKIE-ONLY: a session cookie means the caller already
// passed password + (if enabled) 2FA in a browser. The ops header path
// (x-admin-secret) is deliberately not enough to re-key 2FA.
async function isAuthed() {
  const { ok } = await requireAdminCookie();
  return ok;
}

// POST: Generate new TOTP secret + QR code (does NOT enable 2FA yet)
// Stores the pending secret in DB under a temp field until verify confirms it
export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, encryptedSecret } = generateTOTPSecret();
  const qrCodeDataUrl = await generateQRCode(secret);
  const { codes, encryptedCodes } = generateBackupCodes();

  // Store pending secret in DB (totpEnabled stays false until verify)
  await prisma.adminAuth.upsert({
    where: { id: "admin" },
    update: { totpSecret: encryptedSecret, backupCodes: encryptedCodes },
    create: {
      id: "admin",
      totpSecret: encryptedSecret,
      backupCodes: encryptedCodes,
      totpEnabled: false,
    },
  });

  return NextResponse.json(
    {
      qrCodeDataUrl,
      secret, // plain text for manual entry
      backupCodes: codes,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

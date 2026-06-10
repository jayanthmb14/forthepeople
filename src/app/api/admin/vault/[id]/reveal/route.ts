/**
 * ForThePeople.in — Vault: reveal key plaintext
 * POST /api/admin/vault/[id]/reveal
 *
 * Decrypts and returns the raw key. Rate-limited per vault session
 * (MAX_REVEALS_PER_SESSION). Every call writes an audit-log entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { VAULT_COOKIE, bumpReveals, checkVaultSession } from "@/lib/vault-session";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  const admin = jar.get(COOKIE)?.value;
  const sessionToken = jar.get(VAULT_COOKIE)?.value;
  const status = await checkVaultSession(sessionToken, admin);
  if (!status.valid || !sessionToken) {
    return NextResponse.json({ error: "Vault locked" }, { status: 403 });
  }

  const bump = await bumpReveals(sessionToken);
  if (!bump.allowed) {
    return NextResponse.json(
      { error: "Reveal limit reached for this vault session" },
      { status: 429 }
    );
  }

  const { id } = await ctx.params;
  const row = await prisma.adminAPIKey.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let plaintext: string;
  try {
    plaintext = decrypt(row.encryptedKey);
  } catch {
    return NextResponse.json(
      { error: "Decryption failed. ENCRYPTION_SECRET may have changed since this key was stored." },
      { status: 500 }
    );
  }

  await prisma.adminAPIKey.update({
    where: { id },
    data: { lastAccessedAt: new Date(), lastAccessedBy: "admin" },
  });
  await logAuditAuto({
    action: "vault_key_reveal",
    resource: "AdminAPIKey",
    resourceId: id,
    details: { provider: row.provider, revealsThisSession: bump.reveals },
  });

  return NextResponse.json({
    key: plaintext,
    revealsUsed: bump.reveals,
    expiresInSeconds: 30, // UI should auto-hide after this
  });
}

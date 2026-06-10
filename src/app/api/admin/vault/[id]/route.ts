/**
 * ForThePeople.in — Vault single-key operations
 * GET    /api/admin/vault/[id]        — returns masked key details
 * POST   /api/admin/vault/[id]/reveal — decrypts + returns plaintext (rate limited, logged)
 * PATCH  /api/admin/vault/[id]        — update label/notes/isActive/envVarName, optionally rotate key
 * DELETE /api/admin/vault/[id]        — delete
 *
 * NOTE: reveal uses POST (not GET) so it can't be fetched by accident via a browser address bar.
 * For convenience we expose reveal via a sub-segment — see route at vault/[id]/reveal.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { VAULT_COOKIE, checkVaultSession } from "@/lib/vault-session";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";

async function requireVault(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const { ok } = await requireAdmin();
  if (!ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  // Vault session is bound to the raw admin cookie value (see vault-session.ts),
  // so read it to validate the unlocked-vault layer on top of admin auth.
  const jar = await cookies();
  const admin = jar.get(COOKIE)?.value;
  const sessionToken = jar.get(VAULT_COOKIE)?.value;
  const status = await checkVaultSession(sessionToken, admin);
  if (!status.valid) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Vault locked" }, { status: 403 }),
    };
  }
  return { ok: true };
}

function maskKey(raw: string): string {
  if (raw.length <= 14) return raw.slice(0, 3) + "…" + raw.slice(-2);
  return raw.slice(0, 10) + "…" + raw.slice(-3);
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireVault();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;
  const row = await prisma.adminAPIKey.findUnique({
    where: { id },
    select: {
      id: true,
      provider: true,
      envVarName: true,
      maskedKey: true,
      label: true,
      notes: true,
      isActive: true,
      lastTestedAt: true,
      lastAccessedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ key: row });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireVault();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label ?? null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;
  if (body.envVarName !== undefined) data.envVarName = body.envVarName ?? null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (typeof body.key === "string" && body.key.trim()) {
    const k = body.key.trim();
    data.encryptedKey = encrypt(k);
    data.maskedKey = maskKey(k);
  }

  const row = await prisma.adminAPIKey.update({ where: { id }, data });
  await logAuditAuto({
    action: "vault_key_edit",
    resource: "AdminAPIKey",
    resourceId: id,
    details: {
      provider: row.provider,
      rotated: Boolean(data.encryptedKey),
      fields: Object.keys(data),
    },
  });
  return NextResponse.json({
    key: {
      id: row.id,
      provider: row.provider,
      envVarName: row.envVarName,
      maskedKey: row.maskedKey,
      label: row.label,
      notes: row.notes,
      isActive: row.isActive,
      updatedAt: row.updatedAt,
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await requireVault();
  if (!gate.ok) return gate.res;
  const { id } = await ctx.params;
  const row = await prisma.adminAPIKey.findUnique({
    where: { id },
    select: { provider: true },
  });
  await prisma.adminAPIKey.delete({ where: { id } });
  await logAuditAuto({
    action: "vault_key_delete",
    resource: "AdminAPIKey",
    resourceId: id,
    details: { provider: row?.provider },
  });
  return NextResponse.json({ ok: true });
}

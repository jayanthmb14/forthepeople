/**
 * ForThePeople.in — Vault session status
 * GET /api/admin/vault/session  — returns { unlocked, remainingSeconds, reveals }
 * DELETE /api/admin/vault/session — destroys the current vault session
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  VAULT_COOKIE,
  checkVaultSession,
  destroyVaultSession,
  VAULT_TTL_SECONDS,
  MAX_REVEALS_PER_SESSION,
} from "@/lib/vault-session";
import { requireAdmin } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  const sessionToken = jar.get(VAULT_COOKIE)?.value;
  const status = await checkVaultSession(sessionToken, jar.get(COOKIE)?.value);
  return NextResponse.json({
    unlocked: status.valid,
    remainingSeconds: Math.round(status.remainingSeconds),
    reveals: status.reveals,
    maxReveals: MAX_REVEALS_PER_SESSION,
    ttl: VAULT_TTL_SECONDS,
  });
}

export async function DELETE() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  const token = jar.get(VAULT_COOKIE)?.value;
  if (token) await destroyVaultSession(token);
  jar.delete(VAULT_COOKIE);
  return NextResponse.json({ ok: true });
}

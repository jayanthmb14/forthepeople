/**
 * ForThePeople.in — Vault (list + create)
 * GET  /api/admin/vault        — list keys (masked only)
 * POST /api/admin/vault        — add new encrypted key
 *
 * Requires both admin cookie and an unlocked vault session.
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

export async function GET() {
  const gate = await requireVault();
  if (!gate.ok) return gate.res;

  const keys = await prisma.adminAPIKey.findMany({
    orderBy: { provider: "asc" },
    select: {
      id: true,
      provider: true,
      envVarName: true,
      maskedKey: true,
      label: true,
      notes: true,
      isActive: true,
      lastTestedAt: true,
      lastTestResult: true,
      lastAccessedAt: true,
      lastAccessedBy: true,
      addedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Reference: which env vars are set in the *process* but NOT in the vault.
  const KNOWN_ENV_VARS = [
    "OPENROUTER_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "SENTRY_API_TOKEN",
    "SENTRY_AUTH_TOKEN",
    "PLAUSIBLE_API_KEY",
    "OPENWEATHER_API_KEY",
    "DATA_GOV_API_KEY",
    "CRON_SECRET",
    "ENCRYPTION_SECRET",
    "ADMIN_PASSWORD",
  ];
  const vaultEnvVars = new Set(keys.map((k) => k.envVarName).filter(Boolean));
  const envReference = KNOWN_ENV_VARS.map((name) => ({
    name,
    inVault: vaultEnvVars.has(name),
    inEnvironment: Boolean(process.env[name]),
  }));

  return NextResponse.json({ keys, envReference });
}

export async function POST(req: NextRequest) {
  const gate = await requireVault();
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => ({}));
  const provider = String(body.provider ?? "").trim();
  const envVarName = body.envVarName ? String(body.envVarName).trim() : null;
  const rawKey = String(body.key ?? "").trim();
  const label = body.label ? String(body.label).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!provider || !rawKey) {
    return NextResponse.json({ error: "provider and key are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.adminAPIKey.findUnique({ where: { provider } });
    const data = {
      provider,
      encryptedKey: encrypt(rawKey),
      maskedKey: maskKey(rawKey),
      envVarName,
      label,
      notes,
      isActive: true,
      addedBy: "admin",
    };
    const row = existing
      ? await prisma.adminAPIKey.update({ where: { provider }, data })
      : await prisma.adminAPIKey.create({ data });
    await logAuditAuto({
      action: existing ? "vault_key_replace" : "vault_key_add",
      resource: "AdminAPIKey",
      resourceId: row.id,
      details: { provider, envVarName },
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
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

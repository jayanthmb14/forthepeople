/**
 * ForThePeople.in — Seed API Vault with existing env var keys
 * Run: npx tsx scripts/seed-vault-keys.ts
 *
 * Reads known API keys from process.env and stores them encrypted in AdminAPIKey.
 * Idempotent: upserts by `provider`. Skips keys that aren't present in env.
 */

import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Inline copy of the encrypt() helper from src/lib/encryption.ts so this script
// has no TS path-alias import chain.
function encryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "forthepeople-fallback-change-me";
  return crypto.scryptSync(secret, "forthepeople-salt-v2", 32);
}

function encrypt(text: string): string {
  const key = encryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function maskKey(raw: string): string {
  if (raw.length <= 14) return raw.slice(0, 3) + "…" + raw.slice(-2);
  return raw.slice(0, 10) + "…" + raw.slice(-3);
}

interface Seed {
  provider: string;
  envVarName: string;
  label: string;
}

const KNOWN: Seed[] = [
  { provider: "openrouter", envVarName: "OPENROUTER_API_KEY", label: "OpenRouter API Key" },
  { provider: "razorpay_key", envVarName: "RAZORPAY_KEY_ID", label: "Razorpay Key ID" },
  { provider: "razorpay_secret", envVarName: "RAZORPAY_KEY_SECRET", label: "Razorpay Key Secret" },
  { provider: "razorpay_webhook", envVarName: "RAZORPAY_WEBHOOK_SECRET", label: "Razorpay Webhook Secret" },
  { provider: "resend", envVarName: "RESEND_API_KEY", label: "Resend Email API Key" },
  { provider: "sentry_auth", envVarName: "SENTRY_AUTH_TOKEN", label: "Sentry Auth Token (build)" },
  { provider: "sentry_api", envVarName: "SENTRY_API_TOKEN", label: "Sentry API Token (read)" },
  { provider: "plausible", envVarName: "PLAUSIBLE_API_KEY", label: "Plausible Stats API Key" },
  { provider: "openweathermap", envVarName: "OPENWEATHER_API_KEY", label: "OpenWeatherMap API Key" },
  { provider: "data_gov", envVarName: "DATA_GOV_API_KEY", label: "Data.gov.in API Key" },
];

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const s of KNOWN) {
    const raw = process.env[s.envVarName];
    if (!raw) {
      console.log(`[seed-vault] skip ${s.envVarName} (not in env)`);
      skipped++;
      continue;
    }
    const payload = {
      provider: s.provider,
      envVarName: s.envVarName,
      encryptedKey: encrypt(raw),
      maskedKey: maskKey(raw),
      label: s.label,
      isActive: true,
      addedBy: "seed-script",
    };
    const existing = await prisma.adminAPIKey.findUnique({
      where: { provider: s.provider },
    });
    if (existing) {
      await prisma.adminAPIKey.update({ where: { id: existing.id }, data: payload });
      updated++;
      console.log(`[seed-vault] updated ${s.provider}`);
    } else {
      await prisma.adminAPIKey.create({ data: payload });
      created++;
      console.log(`[seed-vault] created ${s.provider}`);
    }
  }

  console.log(`[seed-vault] created=${created} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((err) => {
    console.error("[seed-vault] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

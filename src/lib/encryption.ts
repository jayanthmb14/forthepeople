/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import crypto from "crypto";

function getEncryptionKey(): Buffer {
  // Prefer a dedicated secret; fall back to ADMIN_PASSWORD. Refuse to start with a
  // public fallback constant — encrypting the API-key vault with a known string
  // (committed in this open-source repo) would be trivially reversible.
  const secret = process.env.ENCRYPTION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_SECRET (or ADMIN_PASSWORD) must be set — refusing to encrypt/decrypt with a fallback constant.",
    );
  }
  return crypto.scryptSync(secret, "forthepeople-salt-v2", 32);
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !encrypted) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function maskKey(key: string): string {
  if (!key || key.length <= 12) return "••••••••";
  return key.substring(0, 10) + "••••••••" + key.substring(key.length - 4);
}

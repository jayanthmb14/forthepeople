/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

/**
 * TOTP (Google Authenticator) helpers for the single admin account, plus the
 * PURE helpers that sign / verify the "password OK, waiting for the 6-digit
 * code" token used between the two login steps.
 *
 * Everything in this file is side-effect free: no Redis, no cookies, no env
 * reads (the secret is always passed in). That is deliberate so the token
 * logic can be unit-tested with a plain node script. The Redis binding and
 * cookie handling live in src/lib/admin-auth.ts and
 * src/app/[locale]/admin/actions.ts.
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";

const ISSUER = "ForThePeople.in";
const LABEL = "Admin";

// Generate a new TOTP secret
export function generateTOTPSecret(): { secret: string; encryptedSecret: string } {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const secret = totp.secret.base32;
  const encryptedSecret = encrypt(secret);
  return { secret, encryptedSecret };
}

// Generate QR code data URL for Google Authenticator
export async function generateQRCode(secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const uri = totp.toString();
  return await QRCode.toDataURL(uri);
}

// Verify a 6-digit TOTP code
export function verifyTOTP(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: LABEL,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup codes
// ─────────────────────────────────────────────────────────────────────────────

// Alphabet without look-alike characters (no 0/O, 1/I/L) so codes are easy to
// read back from a printout. 30 symbols ^ 8 chars ≈ 6.5e11 combinations.
const BACKUP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ2345679";

/**
 * Build one backup code like "K7PQ-M3XZ" using crypto.randomInt (CSPRNG).
 * Math.random() is NOT acceptable here — its output is predictable.
 */
function randomBackupCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += BACKUP_ALPHABET[randomInt(BACKUP_ALPHABET.length)];
    if (i === 3) out += "-";
  }
  return out;
}

// Generate 8 one-time backup codes
export function generateBackupCodes(): { codes: string[]; encryptedCodes: string } {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(randomBackupCode());
  }
  const encryptedCodes = encrypt(JSON.stringify(codes));
  return { codes, encryptedCodes };
}

// Verify a backup code and remove it (one-time use)
export function verifyBackupCode(
  encryptedCodes: string,
  inputCode: string
): { valid: boolean; updatedEncryptedCodes: string | null } {
  try {
    const codes: string[] = JSON.parse(decrypt(encryptedCodes));
    const normalizedInput = inputCode.toUpperCase().trim();
    const index = codes.indexOf(normalizedInput);
    if (index === -1) return { valid: false, updatedEncryptedCodes: null };
    codes.splice(index, 1);
    return {
      valid: true,
      updatedEncryptedCodes: codes.length > 0 ? encrypt(JSON.stringify(codes)) : null,
    };
  } catch {
    return { valid: false, updatedEncryptedCodes: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed "TOTP pending" token — pure helpers
// ─────────────────────────────────────────────────────────────────────────────
//
// After the password check passes we must remember, for at most 5 minutes,
// "this browser already proved the password" while the admin types the
// 6-digit code. The old implementation stored the literal string "ok" in a
// cookie, which meant anyone could skip the password by typing that cookie
// into dev-tools. The token is now:
//
//     <nonce>.<expiryMs>.<hmac>
//     hmac = HMAC-SHA256("<nonce>.<expiryMs>", ADMIN_SESSION_SECRET)
//
// The signature proves WE issued it; the expiry bounds its life; and the
// nonce is looked up in Redis (see admin-auth.ts) so it can be consumed
// exactly once and tied to the IP that passed the password.

/** How long the password step stays valid while waiting for the TOTP code. */
export const TOTP_PENDING_TTL_SECONDS = 5 * 60;

/** Generate a fresh random nonce (32 hex chars). */
export function generateTotpPendingNonce(): string {
  return randomBytes(16).toString("hex");
}

function hmacHex(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/** Constant-time string compare that tolerates length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * Sign a pending token. `expiresAt` is a Unix timestamp in milliseconds.
 * Pure: the same inputs always yield the same token.
 */
export function signTotpPendingToken(nonce: string, expiresAt: number, secret: string): string {
  const body = `${nonce}.${expiresAt}`;
  return `${body}.${hmacHex(body, secret)}`;
}

export type TotpPendingParseResult =
  | { ok: true; nonce: string; expiresAt: number }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

/**
 * Verify a pending token's shape, signature and expiry. Does NOT touch Redis —
 * callers must still confirm the nonce exists (and consume it). `now` is
 * injectable so tests can simulate the clock.
 */
export function parseTotpPendingToken(
  token: string | undefined | null,
  secret: string,
  now: number = Date.now()
): TotpPendingParseResult {
  if (!token) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [nonce, expiryStr, providedHmac] = parts;
  // Nonce must be exactly what generateTotpPendingNonce() produces.
  if (!/^[0-9a-f]{32}$/.test(nonce)) return { ok: false, reason: "malformed" };
  if (!/^\d{1,16}$/.test(expiryStr)) return { ok: false, reason: "malformed" };
  if (!/^[0-9a-f]{64}$/.test(providedHmac)) return { ok: false, reason: "malformed" };

  // 1. Authenticity — constant-time HMAC compare.
  if (!safeEqual(providedHmac, hmacHex(`${nonce}.${expiryStr}`, secret))) {
    return { ok: false, reason: "bad_signature" };
  }

  // 2. Expiry.
  const expiresAt = Number(expiryStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, nonce, expiresAt };
}

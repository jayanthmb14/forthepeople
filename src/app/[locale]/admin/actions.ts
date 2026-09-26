"use server";

/**
 * ForThePeople.in — Admin server actions
 * Extracted from layout.tsx so they can be reused across server + client components.
 *
 * Login is two steps when 2FA is enabled (it is, on production):
 *
 *   1. loginAction  — password (timing-safe) → signed 5-minute "pending" token
 *   2. totpAction   — 6-digit code or backup code → 8-hour signed session
 *
 * Every wrong password or code counts towards a global lockout (10 failures ⇒
 * 15-minute lock, stored in Redis). Both steps are rate-limited per IP and the
 * limiters FAIL CLOSED: if Redis is unreachable, nobody can log in — which is
 * the right default for the door to the API-key vault and donor data.
 *
 * Error codes redirected back to /admin?error=… (layout may render them):
 *   1       wrong password / invalid pending token
 *   code    wrong 6-digit or backup code
 *   rate    too many attempts from this IP
 *   locked  admin login locked for 15 minutes
 *   config  ADMIN_PASSWORD or Redis not configured
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyTOTP, verifyBackupCode } from "@/lib/totp";
import {
  ADMIN_COOKIE,
  TOTP_PENDING_COOKIE,
  TOTP_PENDING_TOKEN_COOKIE,
  clearAdminAuthFailures,
  consumeTotpPendingToken,
  createAdminSession,
  createTotpPendingToken,
  destroyAdminSession,
  isAdminLoginLocked,
  recordAdminAuthFailure,
  safeEqual,
  verifyTotpPendingToken,
} from "@/lib/admin-auth";
import { getClientIpFromHeaders, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { TOTP_PENDING_TTL_SECONDS } from "@/lib/totp";

// Password-step limiter — 5 attempts / 15 min per hashed IP (Upstash Redis).
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const loginKey = (ipHash: string) => `admin-login:${ipHash}`;

// Code-step limiters — 5 / 15 min per IP, plus a global 30 / 15 min ceiling so
// a botnet cannot spread guesses across many IPs.
const TOTP_MAX_ATTEMPTS = 5;
const TOTP_GLOBAL_MAX_ATTEMPTS = 30;
const TOTP_WINDOW_SECONDS = 15 * 60;
const totpKey = (ipHash: string) => `admin-totp:${ipHash}`;
const TOTP_GLOBAL_KEY = "admin-totp:global";

const SESSION_MAX_AGE_SECONDS = 8 * 3600;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "strict" as const,
};

/**
 * Best-effort mirror of the failure count into AdminAuth so the Security tab
 * can show it. Redis (admin-auth.ts) is the source of truth for the lock.
 */
async function mirrorFailureToDb(locked: boolean): Promise<void> {
  await prisma.adminAuth
    .upsert({
      where: { id: "admin" },
      update: {
        failedAttempts: { increment: 1 },
        ...(locked ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      },
      create: { id: "admin", failedAttempts: 1 },
    })
    .catch(() => {});
}

export async function loginAction(formData: FormData) {
  const pw = formData.get("password");
  const locale = String(formData.get("locale") ?? "en");

  const hdrs = await headers();
  const ip = getClientIpFromHeaders(hdrs);
  const ipHash = hashIp(ip);

  // Refuse to run without a configured password — NEVER compare against "".
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("[admin] ADMIN_PASSWORD is not set — admin login disabled.");
    redirect(`/${locale}/admin?error=config`);
  }

  if (await isAdminLoginLocked()) {
    redirect(`/${locale}/admin?error=locked`);
  }

  const rl = await rateLimit(loginKey(ipHash), LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS, {
    failClosed: true,
  });
  if (!rl.success) {
    redirect(`/${locale}/admin?error=rate`);
  }

  // Timing-safe compare — a plain `===` leaks the length/prefix via timing.
  const passwordOk = typeof pw === "string" && safeEqual(pw, adminPassword);
  if (!passwordOk) {
    const { locked } = await recordAdminAuthFailure();
    await mirrorFailureToDb(locked);
    redirect(`/${locale}/admin?error=${locked ? "locked" : "1"}`);
  }

  const adminAuth = await prisma.adminAuth
    .findUnique({ where: { id: "admin" } })
    .catch(() => null);

  const jar = await cookies();

  if (adminAuth?.totpEnabled && adminAuth?.totpSecret) {
    // Step 1 passed — hand the browser a signed, Redis-backed, IP-bound token
    // that is only good for finishing step 2 within 5 minutes.
    let pendingToken: string;
    try {
      pendingToken = await createTotpPendingToken(ip);
    } catch (err) {
      console.error("[admin] could not create TOTP pending token:", err instanceof Error ? err.message : err);
      redirect(`/${locale}/admin?error=config`);
    }
    jar.set(TOTP_PENDING_TOKEN_COOKIE, pendingToken, {
      ...cookieBase,
      maxAge: TOTP_PENDING_TTL_SECONDS,
    });
    // UI hint only (tells the layout to show the code form). Carries no authority.
    jar.set(TOTP_PENDING_COOKIE, "ok", { ...cookieBase, maxAge: TOTP_PENDING_TTL_SECONDS });
    redirect(`/${locale}/admin?step=totp`);
  }

  // No 2FA configured — password alone completes the login.
  await finishLogin(jar, ip, ipHash);
  redirect(`/${locale}/admin`);
}

export async function totpAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const code = formData.get("code");
  const backupCode = formData.get("backupCode");

  const hdrs = await headers();
  const ip = getClientIpFromHeaders(hdrs);
  const ipHash = hashIp(ip);
  const jar = await cookies();

  // The signed pending token is the ONLY proof that step 1 happened.
  const pending = await verifyTotpPendingToken(jar.get(TOTP_PENDING_TOKEN_COOKIE)?.value, ip);
  if (!pending.ok) {
    console.warn(JSON.stringify({ event: "admin_totp_pending_rejected", reason: pending.reason, ipHash }));
    jar.delete(TOTP_PENDING_TOKEN_COOKIE);
    jar.delete(TOTP_PENDING_COOKIE);
    redirect(`/${locale}/admin?error=1`);
  }

  if (await isAdminLoginLocked()) {
    redirect(`/${locale}/admin?error=locked`);
  }

  // Per-IP and global limiters, both fail closed.
  const [perIp, global] = await Promise.all([
    rateLimit(totpKey(ipHash), TOTP_MAX_ATTEMPTS, TOTP_WINDOW_SECONDS, { failClosed: true }),
    rateLimit(TOTP_GLOBAL_KEY, TOTP_GLOBAL_MAX_ATTEMPTS, TOTP_WINDOW_SECONDS, { failClosed: true }),
  ]);
  if (!perIp.success || !global.success) {
    redirect(`/${locale}/admin?step=totp&error=rate`);
  }

  const adminAuth = await prisma.adminAuth
    .findUnique({ where: { id: "admin" } })
    .catch(() => null);
  if (!adminAuth?.totpSecret) {
    redirect(`/${locale}/admin?error=1`);
  }

  let verified = false;

  if (typeof code === "string" && code.trim() && adminAuth.totpSecret) {
    verified = verifyTOTP(adminAuth.totpSecret, code.replace(/\s/g, ""));
  } else if (typeof backupCode === "string" && backupCode.trim() && adminAuth.backupCodes) {
    const result = verifyBackupCode(adminAuth.backupCodes, backupCode);
    verified = result.valid;
    if (result.valid) {
      await prisma.adminAuth
        .update({
          where: { id: "admin" },
          data: { backupCodes: result.updatedEncryptedCodes },
        })
        .catch(() => {});
    }
  }

  if (!verified) {
    const { locked } = await recordAdminAuthFailure();
    await mirrorFailureToDb(locked);
    redirect(`/${locale}/admin?${locked ? "error=locked" : "step=totp&error=code"}`);
  }

  // Success — burn the nonce so this token can never be replayed, then mint
  // the real session.
  await consumeTotpPendingToken(pending.nonce);
  jar.delete(TOTP_PENDING_TOKEN_COOKIE);
  jar.delete(TOTP_PENDING_COOKIE);
  await resetRateLimit(totpKey(ipHash));
  await finishLogin(jar, ip, ipHash);
  redirect(`/${locale}/admin`);
}

/**
 * Shared tail of both paths: clear limiters, mint the 8-hour session cookie,
 * and record the login on AdminAuth (best-effort).
 */
async function finishLogin(
  jar: Awaited<ReturnType<typeof cookies>>,
  ip: string,
  ipHash: string
): Promise<void> {
  await resetRateLimit(loginKey(ipHash));
  await clearAdminAuthFailures();
  const sessionToken = await createAdminSession(ip);
  jar.set(ADMIN_COOKIE, sessionToken, { ...cookieBase, maxAge: SESSION_MAX_AGE_SECONDS });
  await prisma.adminAuth
    .upsert({
      where: { id: "admin" },
      update: { lastLoginAt: new Date(), lastLoginIp: ip, failedAttempts: 0, lockedUntil: null },
      create: { id: "admin", lastLoginAt: new Date(), lastLoginIp: ip },
    })
    .catch(() => {});
}

export async function logoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const jar = await cookies();
  await destroyAdminSession(); // deletes the Redis session record + clears the cookie
  jar.delete(TOTP_PENDING_TOKEN_COOKIE);
  jar.delete(TOTP_PENDING_COOKIE);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

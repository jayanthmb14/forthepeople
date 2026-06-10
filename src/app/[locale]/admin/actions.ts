"use server";

/**
 * ForThePeople.in — Admin server actions
 * Extracted from layout.tsx so they can be reused across server + client components.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyTOTP, verifyBackupCode } from "@/lib/totp";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";
const TOTP_PENDING_COOKIE = "admin_totp_pending";

// Best-effort login-attempt limiter. NOTE: this in-memory Map resets per
// serverless invocation on Vercel, so it is NOT reliable protection.
// Session 4 moves this to the Upstash-backed rateLimit() helper.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function loginAction(formData: FormData) {
  const pw = formData.get("password") as string;
  const locale = formData.get("locale") as string;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  if (!checkLoginRateLimit(ip)) {
    redirect(`/${locale}/admin?error=rate`);
  }

  if (pw === (process.env.ADMIN_PASSWORD ?? "")) {
    const adminAuth = await prisma.adminAuth
      .findUnique({ where: { id: "admin" } })
      .catch(() => null);

    if (adminAuth?.totpEnabled && adminAuth?.totpSecret) {
      (await cookies()).set(TOTP_PENDING_COOKIE, "ok", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 300,
        path: "/",
        sameSite: "strict",
      });
      redirect(`/${locale}/admin?step=totp`);
    }

    resetLoginAttempts(ip);
    const sessionToken = await createAdminSession(ip);
    (await cookies()).set(COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600,
      path: "/",
      sameSite: "strict",
    });
    await prisma.adminAuth
      .upsert({
        where: { id: "admin" },
        update: { lastLoginAt: new Date(), lastLoginIp: ip, failedAttempts: 0 },
        create: { id: "admin", lastLoginAt: new Date(), lastLoginIp: ip },
      })
      .catch(() => {});
    redirect(`/${locale}/admin`);
  }

  redirect(`/${locale}/admin?error=1`);
}

export async function totpAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const code = formData.get("code") as string;
  const backupCode = formData.get("backupCode") as string;

  const jar = await cookies();
  if (jar.get(TOTP_PENDING_COOKIE)?.value !== "ok") {
    redirect(`/${locale}/admin?error=1`);
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const adminAuth = await prisma.adminAuth
    .findUnique({ where: { id: "admin" } })
    .catch(() => null);
  if (!adminAuth?.totpSecret) {
    redirect(`/${locale}/admin?error=1`);
  }

  let verified = false;

  if (code && adminAuth.totpSecret) {
    verified = verifyTOTP(adminAuth.totpSecret, code.replace(/\s/g, ""));
  } else if (backupCode && adminAuth.backupCodes) {
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
    redirect(`/${locale}/admin?step=totp&error=code`);
  }

  resetLoginAttempts(ip);
  const sessionToken = await createAdminSession(ip);
  jar.set(COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 3600,
    path: "/",
    sameSite: "strict",
  });
  jar.delete(TOTP_PENDING_COOKIE);

  await prisma.adminAuth
    .update({
      where: { id: "admin" },
      data: { lastLoginAt: new Date(), lastLoginIp: ip, failedAttempts: 0 },
    })
    .catch(() => {});

  redirect(`/${locale}/admin`);
}

export async function logoutAction(formData: FormData) {
  const locale = formData.get("locale") as string;
  const jar = await cookies();
  await destroyAdminSession(); // deletes the Redis session record + clears the cookie
  jar.delete(TOTP_PENDING_COOKIE);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

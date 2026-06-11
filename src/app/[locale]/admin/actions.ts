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
import { rateLimit, resetRateLimit, hashIp } from "@/lib/rate-limit";

const COOKIE = "ftp_admin_v1";
const TOTP_PENDING_COOKIE = "admin_totp_pending";

// Admin-login attempt limiter — Upstash Redis (5 attempts / 15 min), IP-hashed.
// Reliable across serverless invocations (replaces the old in-memory Map, which
// reset on every Vercel invocation and so provided no real protection).
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const loginKey = (ip: string) => `admin-login:${hashIp(ip)}`;

export async function loginAction(formData: FormData) {
  const pw = formData.get("password") as string;
  const locale = formData.get("locale") as string;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rl = await rateLimit(loginKey(ip), LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS);
  if (!rl.success) {
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

    await resetRateLimit(loginKey(ip));
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

  await resetRateLimit(loginKey(ip));
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

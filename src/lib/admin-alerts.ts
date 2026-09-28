/**
 * ForThePeople.in — Admin Alert System
 * Sends email alerts via Resend + stores in AdminAlert table.
 * Rate-limited: max 10 alerts per hour per title to prevent inbox flooding.
 */

import { Resend } from "resend";
import { prisma } from "@/lib/db";

type AlertLevel = "critical" | "warning" | "info";

interface AlertPayload {
  level: AlertLevel;
  title: string;
  message: string;
  details?: Record<string, string | number>;
  module?: string;
  district?: string;
}

// In-memory rate limiter
const alertLog = new Map<string, number[]>();
const MAX_PER_HOUR = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - 3_600_000;
  const timestamps = (alertLog.get(key) || []).filter(t => t > cutoff);
  if (timestamps.length >= MAX_PER_HOUR) return true;
  timestamps.push(now);
  alertLog.set(key, timestamps);
  return false;
}

export async function sendAdminAlert(payload: AlertPayload): Promise<boolean> {
  let emailed = false;

  // 1. Try sending email (skip if rate-limited or env vars missing)
  const adminEmail = process.env.ADMIN_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (adminEmail && resendKey && !isRateLimited(payload.title)) {
    const emoji = { critical: "🚨", warning: "⚠️", info: "ℹ️" };
    const color = { critical: "#DC2626", warning: "#D97706", info: "#2563EB" };

    const detailRows = payload.details
      ? Object.entries(payload.details)
          .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6B6B6B;font-size:13px;">${k}</td><td style="padding:4px 0;font-size:13px;font-weight:600;">${v}</td></tr>`)
          .join("")
      : "";

    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "ForThePeople.in <noreply@forthepeople.in>",
        to: adminEmail,
        subject: `${emoji[payload.level]} [FTP ${payload.level.toUpperCase()}] ${payload.title}`,
        html: `
          <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:0 auto;">
            <div style="padding:16px 20px;background:${color[payload.level]};border-radius:8px 8px 0 0;">
              <h2 style="margin:0;color:#fff;font-size:16px;">${emoji[payload.level]} ${payload.title}</h2>
            </div>
            <div style="padding:20px;background:#FAFAF8;border:1px solid #E8E8E4;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 12px;color:#1A1A1A;font-size:14px;">${payload.message}</p>
              ${payload.module ? `<p style="margin:0 0 4px;font-size:12px;color:#9B9B9B;">Module: <strong>${payload.module}</strong></p>` : ""}
              ${payload.district ? `<p style="margin:0 0 12px;font-size:12px;color:#9B9B9B;">District: <strong>${payload.district}</strong></p>` : ""}
              ${detailRows ? `<table style="margin-top:12px;border-collapse:collapse;">${detailRows}</table>` : ""}
              <hr style="border:none;border-top:1px solid #E8E8E4;margin:16px 0;" />
              <p style="margin:0;font-size:11px;color:#9B9B9B;">
                <a href="https://forthepeople.in/en/admin" style="color:#2563EB;">Open Admin Panel →</a>
                &nbsp;·&nbsp; ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </p>
            </div>
          </div>
        `,
      });
      emailed = true;
    } catch (err) {
      console.error("[admin-alert] Email failed:", err instanceof Error ? err.message : err);
    }
  }

  // 2. Always store in DB (even if email failed or was rate-limited)
  try {
    await prisma.adminAlert.create({
      data: {
        level: payload.level,
        title: payload.title,
        message: payload.message,
        details: payload.details || undefined,
        module: payload.module,
        district: payload.district,
        emailed,
      },
    });
  } catch (dbErr) {
    console.error("[admin-alert] DB store failed:", dbErr);
  }

  return emailed;
}

// ── Transient error filter ────────────────────────────────
// External government portals (water.karnataka.gov.in, bescom.karnataka.gov.in, etc.)
// and upstream news feeds go down frequently. These aren't code bugs — alerting on
// them floods the admin panel with non-actionable noise. The data freshness panel
// still shows the stale state so we don't hide the problem, we just stop paging.
const TRANSIENT_PATTERNS = [
  "fetch failed",
  "etimedout",
  "econnrefused",
  "econnreset",
  "enotfound",
  "socket hang up",
  "network timeout",
  "aborterror",
  "aborterror: ",
  "signal is aborted",
  "the operation was aborted",
  "http 502",
  "http 503",
  "http 504",
  "http 429",
  "getaddrinfo enotfound",
  "request timed out",
];

export function isTransientError(error: string | null | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return TRANSIENT_PATTERNS.some((p) => lower.includes(p));
}

// ── Helper functions for common alerts ────────────────────

export function alertNewFeedback(type: string, subject: string) {
  return sendAdminAlert({
    level: "info",
    title: "New User Feedback",
    message: `A user submitted ${type} feedback: "${subject}"`,
    details: { Type: type, Subject: subject },
  });
}

export function alertPaymentReceived(amountInPaise: number, planName: string) {
  return sendAdminAlert({
    level: "info",
    title: "Payment Received",
    message: `₹${(amountInPaise / 100).toLocaleString("en-IN")} received for ${planName}.`,
    details: { Amount: `₹${(amountInPaise / 100).toLocaleString("en-IN")}`, Plan: planName },
  });
}

export function alertCronFailed(cronName: string, error: string) {
  if (isTransientError(error)) {
    return Promise.resolve(false);
  }
  return sendAdminAlert({
    level: "critical",
    title: `Cron Job Failed: ${cronName}`,
    message: `The ${cronName} cron job failed.`,
    details: { Error: error, Time: new Date().toISOString() },
    module: cronName,
  });
}

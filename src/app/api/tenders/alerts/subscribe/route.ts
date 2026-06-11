// POST /api/tenders/alerts/subscribe
// v1 captures intent only — delivery pipeline is v2.
//
// DPDP: alertChannelEmail / alertChannelWhatsapp are collected ONLY to notify this
// user about THIS tender's deadline / corrigendum changes — the alert they explicitly
// asked for. No marketing, no sharing. We require an affirmative consent:true in the
// body before storing any contact detail, and rate-limit + length-cap the input.
// (Persisting the consent flag itself needs a TenderSavedByUser schema column —
// tracked as a follow-up; for now consent is enforced at the gate.)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, hashIp, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LEN = 200;

export async function POST(req: Request) {
  // 5 alert-subscriptions / IP / hour.
  const rl = await rateLimit(`tender-alert:${hashIp(getClientIp(req))}`, 5, 3600);
  if (!rl.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." } },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  let body: {
    tenderId?: string;
    userIdentifier?: string;
    alertChannelEmail?: string;
    alertChannelWhatsapp?: string;
    alertOnDeadline?: boolean;
    alertOnCorrigendum?: boolean;
    consent?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_JSON", message: "Invalid JSON body" } }, { status: 400 });
  }

  if (!body.tenderId || !body.userIdentifier) {
    return NextResponse.json({ error: { code: "MISSING_FIELDS", message: "tenderId and userIdentifier are required" } }, { status: 400 });
  }

  // DPDP: explicit, affirmative consent required before any contact detail is stored.
  if (body.consent !== true) {
    return NextResponse.json({ error: { code: "CONSENT_REQUIRED", message: "consent:true is required to store your contact details for tender alerts" } }, { status: 400 });
  }

  if (!body.alertChannelEmail && !body.alertChannelWhatsapp) {
    return NextResponse.json({ error: { code: "NO_CHANNEL", message: "At least one of alertChannelEmail or alertChannelWhatsapp is required" } }, { status: 400 });
  }

  // Strict email validation when an email channel is provided.
  if (body.alertChannelEmail !== undefined && !EMAIL_RE.test(body.alertChannelEmail)) {
    return NextResponse.json({ error: { code: "INVALID_EMAIL", message: "alertChannelEmail is not a valid email address" } }, { status: 400 });
  }

  // Length caps on the identifier / contact fields.
  if (
    body.userIdentifier.length > MAX_FIELD_LEN ||
    (body.alertChannelEmail?.length ?? 0) > MAX_FIELD_LEN ||
    (body.alertChannelWhatsapp?.length ?? 0) > MAX_FIELD_LEN
  ) {
    return NextResponse.json({ error: { code: "FIELD_TOO_LONG", message: `Fields must be at most ${MAX_FIELD_LEN} characters` } }, { status: 400 });
  }

  const tender = await prisma.tender.findUnique({ where: { id: body.tenderId }, select: { id: true } });
  if (!tender) {
    return NextResponse.json({ error: { code: "TENDER_NOT_FOUND", message: `Tender ${body.tenderId} does not exist` } }, { status: 404 });
  }

  await prisma.tenderSavedByUser.upsert({
    where: { tenderId_userIdentifier: { tenderId: body.tenderId, userIdentifier: body.userIdentifier } },
    update: {
      alertChannelEmail: body.alertChannelEmail ?? null,
      alertChannelWhatsapp: body.alertChannelWhatsapp ?? null,
      alertOnDeadline: body.alertOnDeadline ?? true,
      alertOnCorrigendum: body.alertOnCorrigendum ?? true,
    },
    create: {
      tenderId: body.tenderId,
      userIdentifier: body.userIdentifier,
      alertChannelEmail: body.alertChannelEmail ?? null,
      alertChannelWhatsapp: body.alertChannelWhatsapp ?? null,
      alertOnDeadline: body.alertOnDeadline ?? true,
      alertOnCorrigendum: body.alertOnCorrigendum ?? true,
    },
  });

  return NextResponse.json({ ok: true, note: "Alert intent captured. Delivery pipeline rolls out in v2." });
}

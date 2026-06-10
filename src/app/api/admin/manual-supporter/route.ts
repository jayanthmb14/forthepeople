/**
 * ForThePeople.in — Manual supporter creation
 * POST /api/admin/manual-supporter
 *
 * For offline contributions (UPI direct, bank transfer, cash, cheque). Writes a
 * Supporter row with source="manual" and invalidates public contributor caches
 * so the change shows up on the Wall immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { logAuditAuto } from "@/lib/audit-log";
import { calculateOneTimeExpiry } from "@/lib/contribution-expiry";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { detectAndCleanSocialLink } from "@/lib/social-detect";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";

const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
  "ftp:contributors:top-tier",
];

async function invalidateContributorCaches() {
  await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));
}

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || body.amount == null) {
    return NextResponse.json(
      { error: "name and amount are required" },
      { status: 400 }
    );
  }
  const nameResult = validateContributorName(body.name);
  if (!nameResult.ok) {
    return NextResponse.json({ error: nameResult.reason }, { status: 400 });
  }
  const messageResult = validateSupporterMessage(body.message);
  if (!messageResult.ok) {
    return NextResponse.json({ error: messageResult.reason }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const tier = String(body.tier ?? "custom");
  const createdAt = body.paymentDate ? new Date(body.paymentDate) : new Date();

  // Recurring vs one-time — inferred from tier if not explicitly passed.
  const tierConfig = TIER_CONFIG[tier];
  const isRecurring = body.isRecurring !== undefined
    ? Boolean(body.isRecurring)
    : Boolean(tierConfig?.isRecurring);

  // Expiry: for one-time, auto-calc if not provided. For recurring, null unless admin overrides.
  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);
  } else if (!isRecurring) {
    expiresAt = calculateOneTimeExpiry(amount, createdAt);
  }

  const badgeType = tierConfig?.badgeType ?? null;

  const supporter = await prisma.supporter.create({
    data: {
      name: nameResult.cleaned,
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      amount,
      currency: "INR",
      tier,
      method: body.paymentMethod ?? null,
      status: "success",
      source: "manual",
      referenceNumber: body.referenceNumber ?? null,
      message: messageResult.cleaned,
      districtId: body.districtId ?? null,
      stateId: body.stateId ?? null,
      socialLink: (() => {
        const raw = typeof body.socialLink === "string" ? body.socialLink.trim() : "";
        return raw ? (detectAndCleanSocialLink(raw)?.cleanUrl ?? null) : null;
      })(),
      socialPlatform: (() => {
        if (body.socialPlatform) return body.socialPlatform;
        const raw = typeof body.socialLink === "string" ? body.socialLink.trim() : "";
        return raw ? (detectAndCleanSocialLink(raw)?.platform ?? null) : null;
      })(),
      badgeType,
      isPublic: body.isPublic === undefined ? true : Boolean(body.isPublic),
      isRecurring,
      subscriptionStatus: isRecurring ? "active" : null,
      activatedAt: isRecurring ? createdAt : null,
      expiresAt,
      paymentId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt,
    },
  });

  await invalidateContributorCaches();

  await logAuditAuto({
    action: "supporter_add_manual",
    resource: "Supporter",
    resourceId: supporter.id,
    details: { name: supporter.name, amount, tier, method: body.paymentMethod ?? null },
  });

  return NextResponse.json({ supporter });
}

/**
 * ForThePeople.in — Edit supporter
 * PATCH /api/admin/supporters/[id]
 *
 * Invalidates public contributor caches on update so the Wall reflects changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { logAuditAuto } from "@/lib/audit-log";
import { detectAndCleanSocialLink } from "@/lib/social-detect";
import { bustSupporterCaches } from "@/lib/supporter-cache";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const data: Prisma.SupporterUpdateInput = {};
  const stringFields = [
    "name",
    "email",
    "phone",
    "tier",
    "method",
    "message",
    "socialPlatform",
    "badgeType",
    "badgeLevel",
    "referenceNumber",
    "status",
    "subscriptionStatus",
  ] as const;
  for (const f of stringFields) {
    if (body[f] !== undefined) {
      (data as Record<string, unknown>)[f] = body[f] ?? null;
    }
  }

  // socialLink: clean + detect — handles "@handle", bare usernames, post URLs,
  // and generic domains into a canonical profile URL.
  if (body.socialLink !== undefined) {
    const raw = typeof body.socialLink === "string" ? body.socialLink.trim() : "";
    if (!raw) {
      data.socialLink = null;
      if (body.socialPlatform === undefined) data.socialPlatform = null;
    } else {
      const detected = detectAndCleanSocialLink(raw);
      data.socialLink = detected?.cleanUrl ?? null;
      if (body.socialPlatform === undefined) {
        data.socialPlatform = detected?.platform ?? null;
      }
    }
  }

  // Visibility expiry — null = permanent.
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  }

  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.isPublic !== undefined) data.isPublic = Boolean(body.isPublic);
  if (body.isRecurring !== undefined) data.isRecurring = Boolean(body.isRecurring);
  if (body.districtId !== undefined) {
    data.sponsoredDistrict = body.districtId
      ? { connect: { id: body.districtId } }
      : { disconnect: true };
  }
  if (body.stateId !== undefined) {
    data.sponsoredState = body.stateId
      ? { connect: { id: body.stateId } }
      : { disconnect: true };
  }

  const supporter = await prisma.supporter.update({ where: { id }, data });
  await bustSupporterCaches();

  await logAuditAuto({
    action: "supporter_edit",
    resource: "Supporter",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return NextResponse.json({ supporter });
}

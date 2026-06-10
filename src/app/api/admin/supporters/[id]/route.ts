/**
 * ForThePeople.in — Edit supporter
 * PATCH /api/admin/supporters/[id]
 *
 * Invalidates public contributor caches on update so the Wall reflects changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import type { Prisma } from "@/generated/prisma";
import { logAuditAuto } from "@/lib/audit-log";
import { detectAndCleanSocialLink } from "@/lib/social-detect";
import redis from "@/lib/redis";

const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:v2",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
  "ftp:contributors:top-tier",
  "ftp:contributors:top-tier:v3",
  "ftp:contributors:growth-trend",
];

async function bustAllContributorCaches() {
  // Static keys
  await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));
  // Dynamic per-district / per-state keys (versioned suffix)
  if (redis) {
    try {
      const patterns = ["ftp:contributors:district:*", "ftp:contributors:state-page:*"];
      for (const p of patterns) {
        // @upstash/redis returns [cursor: string, keys: string[]] from SCAN.
        let cursor: string | number = "0";
        do {
          const res = await redis.scan(cursor as number, { match: p, count: 100 });
          // Be permissive — different upstash versions use string vs number cursors.
          const tuple = res as unknown as [string | number, string[]];
          cursor = tuple[0] ?? "0";
          const keys = Array.isArray(tuple[1]) ? tuple[1] : [];
          if (keys.length > 0) await redis.del(...keys);
        } while (String(cursor) !== "0");
      }
    } catch (err) {
      console.error("[supporters] cache scan failed:", err);
    }
  }
}

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
  await bustAllContributorCaches();

  await logAuditAuto({
    action: "supporter_edit",
    resource: "Supporter",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return NextResponse.json({ supporter });
}

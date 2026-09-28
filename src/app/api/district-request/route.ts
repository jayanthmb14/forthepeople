/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Request API
// POST /api/district-request — vote for a district
// GET /api/district-request — get top requested districts
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import redis from "@/lib/redis";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { waitingDistrict } from "@/lib/waiting-district";

const TOP_CACHE_KEY = "ftp:district-requests:top";
const ALL_CACHE_KEY = "ftp:district-requests:all";

// 120 votes / IP / minute. Generous enough that no enthusiastic human ever
// hits it; restrictive enough that scripts can't hammer.
const VOTE_RATE_LIMIT = 120;
const VOTE_RATE_WINDOW_SECONDS = 60;

export async function GET(req: NextRequest) {
  const wantAll = req.nextUrl.searchParams.get("all") === "1";

  if (wantAll) {
    const cached = await cacheGet<object[]>(ALL_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ all: cached, fromCache: true });
    }
    try {
      const all = await prisma.districtRequest.findMany({
        orderBy: { requestCount: "desc" },
      });
      await cacheSet(ALL_CACHE_KEY, all, 60);
      return NextResponse.json({ all, fromCache: false });
    } catch (err) {
      console.error("[district-request GET ?all]", err);
      return NextResponse.json({ all: [], fromCache: false, error: true });
    }
  }

  const cached = await cacheGet<object[]>(TOP_CACHE_KEY);
  if (cached) {
    return NextResponse.json({ top: cached, fromCache: true });
  }

  try {
    const top = await prisma.districtRequest.findMany({
      orderBy: { requestCount: "desc" },
      take: 5,
    });
    await cacheSet(TOP_CACHE_KEY, top, 300);
    return NextResponse.json({ top, fromCache: false });
  } catch (err) {
    console.error("[district-request GET]", err);
    return NextResponse.json({ top: [], fromCache: false, error: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.stateName || !body?.districtName) {
      return NextResponse.json({ error: "stateName and districtName required" }, { status: 400 });
    }
    // Only districts the vote page lists (in the registry, not live yet),
    // stored under the registry's spelling: these rows are the public
    // "most requested" chart, so free text must never get in.
    const district = waitingDistrict(body.stateName, body.districtName);
    if (!district) {
      return NextResponse.json({ error: "Unknown district" }, { status: 400 });
    }
    const { stateName, districtName } = district;

    const ipHash = hashIp(getClientIp(req));
    const rl = await rateLimit(`vote:${ipHash}`, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_SECONDS);
    if (!rl.success) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: VOTE_RATE_WINDOW_SECONDS },
        { status: 429, headers: { "Retry-After": String(VOTE_RATE_WINDOW_SECONDS) } },
      );
    }

    // Upsert — increment count
    const record = await prisma.districtRequest.upsert({
      where: { stateName_districtName: { stateName, districtName } },
      create: { stateName, districtName, requestCount: 1 },
      update: { requestCount: { increment: 1 } },
    });

    // Bust caches so next GET reflects the new total. (It used to set them
    // with a 0-second expiry, which Redis refuses, so nothing was cleared.)
    await redis?.del(TOP_CACHE_KEY, ALL_CACHE_KEY).catch(() => {});

    return NextResponse.json({ success: true, requestCount: record.requestCount });
  } catch (err) {
    console.error("[district-request POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

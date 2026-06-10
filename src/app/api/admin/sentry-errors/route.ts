/**
 * ForThePeople.in — Sentry unresolved issues for the admin panel
 * GET /api/admin/sentry-errors?limit=10
 * Redis cache: 5 minutes. Degrades gracefully when SENTRY_API_TOKEN is missing.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { cacheGet, cacheSet } from "@/lib/cache";
import { fetchSentryIssues, type SentryFetchResult } from "@/lib/sentry-api";

const CACHE_KEY = "ftp:admin:sentry-errors";
const CACHE_TTL = 300;

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 10));
  const cacheKey = `${CACHE_KEY}:${limit}`;

  const cached = await cacheGet<SentryFetchResult>(cacheKey);
  if (cached) return NextResponse.json({ ...cached, cached: true });

  const data = await fetchSentryIssues(limit);
  await cacheSet(cacheKey, data, CACHE_TTL);
  return NextResponse.json({ ...data, cached: false });
}

/**
 * ForThePeople.in — OpenRouter credit usage
 * GET /api/admin/openrouter-usage
 * Fetches real credit spend from OpenRouter's /auth/key endpoint.
 * Cached in Redis for 5 min to avoid hitting the upstream on every dashboard load.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { cacheGet, cacheSet } from "@/lib/cache";
import { prisma } from "@/lib/db";

const CACHE_KEY = "ftp:admin:openrouter-usage";
const CACHE_TTL = 300; // 5 minutes
const USD_TO_INR = 84; // approximate conversion; made dynamic in a later prompt

interface OpenRouterKeyResponse {
  data?: {
    label?: string;
    usage?: number; // credits used in USD
    limit?: number | null; // credit limit in USD; null if unlimited
    is_free_tier?: boolean;
    rate_limit?: { requests?: number; interval?: string };
  };
}

export interface OpenRouterUsage {
  spent: number; // USD
  limit: number | null; // USD; null = unlimited
  remaining: number | null; // USD
  percentUsed: number; // 0-100
  usdToInr: number;
  fetchedAt: string;
  source: "api" | "fallback";
  error?: string;
}

async function fetchFromOpenRouter(): Promise<OpenRouterUsage | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as OpenRouterKeyResponse;
    const spent = Number(json.data?.usage ?? 0);
    const limit = json.data?.limit == null ? null : Number(json.data.limit);
    const remaining = limit == null ? null : Math.max(0, limit - spent);
    const percentUsed = limit && limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return {
      spent,
      limit,
      remaining,
      percentUsed,
      usdToInr: USD_TO_INR,
      fetchedAt: new Date().toISOString(),
      source: "api",
    };
  } catch {
    return null;
  }
}

async function fallbackFromUsageLog(): Promise<OpenRouterUsage> {
  const sinceMonth = new Date(Date.now() - 30 * 86_400_000);
  let spent = 0;
  try {
    const rows = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: sinceMonth } },
      select: { costUSD: true },
    });
    spent = rows.reduce((s, r) => s + (r.costUSD ?? 0), 0);
  } catch {
    // ignore
  }
  return {
    spent,
    limit: 10,
    remaining: Math.max(0, 10 - spent),
    percentUsed: Math.min(100, (spent / 10) * 100),
    usdToInr: USD_TO_INR,
    fetchedAt: new Date().toISOString(),
    source: "fallback",
    error: "OpenRouter API key missing or unreachable",
  };
}

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await cacheGet<OpenRouterUsage>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  let data = await fetchFromOpenRouter();
  if (!data) data = await fallbackFromUsageLog();

  await cacheSet(CACHE_KEY, data, CACHE_TTL);
  return NextResponse.json(data);
}

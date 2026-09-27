/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { calculateBadgeLevel, getMonthsActive } from "@/lib/badge-level";
import { TIER_PRIORITY } from "@/lib/constants/razorpay-plans";
import { publicDisplayName } from "@/lib/supporter-name";
import { CONTRIBUTOR_KEYS } from "@/lib/supporter-cache";
import {
  isMockEnabled,
  mockTopTier,
  mockDistrict,
  mockStatePage,
  mockLeaderboard,
  mockDistrictRankings,
  mockAll,
  mockGrowthTrend,
} from "@/lib/mock-contributors";

const CACHE_TTL = 120; // 2 minutes
const HARD_MAX = 500; // absolute ceiling per page

// Public-safe fields only — never expose email, phone, paymentId, razorpayData
interface PublicContributor {
  id: string;
  name: string;
  amount: number | null; // only for one-time
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  districtName: string | null;
  stateName: string | null;
  districtSlug: string | null;
  stateSlug: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  isRecurring: boolean;
  monthsActive: number;
  message: string | null;
  createdAt: string;
}

function toPublic(s: {
  id: string;
  name: string;
  amount: number;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  activatedAt: Date | null;
  expiresAt: Date | null;
  isRecurring: boolean;
  message: string | null;
  isPublic: boolean;
  createdAt: Date;
  sponsoredDistrict?: { name: string; slug: string; state?: { name: string; slug: string } | null } | null;
  sponsoredState?: { name: string; slug: string } | null;
}): PublicContributor {
  const isAnon = !s.isPublic;
  // Never a phone number or e-mail as a name: those become "Supporter"
  // (src/lib/supporter-name.ts). email / phone columns are never selected.
  const districtName = s.sponsoredDistrict?.name ?? null;
  const districtSlug = s.sponsoredDistrict?.slug ?? null;
  const stateName = s.sponsoredState?.name ?? s.sponsoredDistrict?.state?.name ?? null;
  const stateSlug = s.sponsoredState?.slug ?? s.sponsoredDistrict?.state?.slug ?? null;
  return {
    id: s.id,
    name: publicDisplayName(s.name, s.isPublic),
    amount: s.isRecurring ? null : s.amount,
    tier: s.tier,
    badgeType: s.badgeType,
    badgeLevel: s.badgeLevel ?? calculateBadgeLevel(s.activatedAt),
    socialLink: isAnon ? null : s.socialLink,
    socialPlatform: isAnon ? null : s.socialPlatform,
    districtId: s.districtId,
    stateId: s.stateId,
    districtName,
    stateName,
    districtSlug,
    stateSlug,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    isRecurring: s.isRecurring,
    monthsActive: getMonthsActive(s.activatedAt),
    message: isAnon ? null : s.message,
    createdAt: s.createdAt.toISOString(),
  };
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  amount: true,
  tier: true,
  badgeType: true,
  badgeLevel: true,
  socialLink: true,
  socialPlatform: true,
  districtId: true,
  stateId: true,
  activatedAt: true,
  expiresAt: true,
  isRecurring: true,
  message: true,
  isPublic: true,
  createdAt: true,
  sponsoredDistrict: {
    select: {
      name: true,
      slug: true,
      state: { select: { name: true, slug: true } },
    },
  },
  sponsoredState: {
    select: { name: true, slug: true },
  },
} as const;

function notExpired() {
  return {
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  };
}

// ── Amount-based visibility thresholds (April 2026) ─────────
// Tier strings are display-only; visibility is decided by amount so a
// one-time ₹50,000 donor is treated identically to a tagged "patron"
// subscriber.
export const VISIBILITY_THRESHOLD = {
  national: 9999,   // homepage + every district page
  state:    999,    // every district page in that state (was 1999 until 2026-04-24)
  district: 99,     // a specific district page
} as const;

const NATIONAL_TIERS = ["founder", "patron"] as const;

function parsePaging(url: URL, defaultLimit: number): { limit: number; offset: number } {
  const rawLimit = Number(url.searchParams.get("limit"));
  const rawOffset = Number(url.searchParams.get("offset"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, HARD_MAX) : defaultLimit;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  return { limit, offset };
}

function tierPrioritySort(a: PublicContributor, b: PublicContributor): number {
  const pa = TIER_PRIORITY[a.tier] ?? 0;
  const pb = TIER_PRIORITY[b.tier] ?? 0;
  if (pa !== pb) return pb - pa;
  // DB already ordered within a tier by amount desc + tenure — preserve that
  // order by only sorting on priority here (return 0 for same tier).
  return 0;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const districtSlug = url.searchParams.get("district");
    const stateSlug = url.searchParams.get("state");

    // ── DEV-ONLY mock mode (guarded by env + NODE_ENV) ──
    if (isMockEnabled()) {
      if (type === "top-tier") {
        const { limit, offset } = parsePaging(url, 20);
        const full = mockTopTier();
        return NextResponse.json({ contributors: full.slice(offset, offset + limit), total: full.length });
      }
      if (type === "state-page" && stateSlug) {
        const { limit, offset } = parsePaging(url, 60);
        const full = mockStatePage(stateSlug);
        return NextResponse.json({ contributors: full.slice(offset, offset + limit), total: full.length });
      }
      if (type === "growth-trend") {
        return NextResponse.json({ points: mockGrowthTrend() });
      }
      if (districtSlug || stateSlug) {
        const { limit, offset } = parsePaging(url, 120);
        const full = mockDistrict(districtSlug, stateSlug);
        return NextResponse.json({ contributors: full.slice(offset, offset + limit), total: full.length });
      }
      if (type === "leaderboard") {
        const { limit, offset } = parsePaging(url, 10);
        const full = mockLeaderboard();
        return NextResponse.json({ contributors: full.slice(offset, offset + limit), total: full.length });
      }
      if (type === "district-rankings") {
        return NextResponse.json(mockDistrictRankings());
      }
      const { limit, offset } = parsePaging(url, 50);
      const all = mockAll();
      return NextResponse.json({
        subscribers: all.subscribers.slice(offset, offset + limit),
        oneTime: all.oneTime.slice(offset, offset + limit),
        subscribersTotal: all.subscribers.length,
        oneTimeTotal: all.oneTime.length,
      });
    }

    // ── State page sponsors ─────────────────────────────────
    // Visibility on a state page = NATIONAL contributors (tier OR amount
    // ≥ ₹9,999) PLUS anyone who explicitly sponsored this state OR donated
    // ≥ ₹999 within this state (subscription or one-time). Threshold dropped
    // from ₹1,999 on 2026-04-24 when State Champion monthly price was halved.
    if (type === "state-page" && stateSlug) {
      const { limit, offset } = parsePaging(url, 60);
      const cacheKey = CONTRIBUTOR_KEYS.statePage(stateSlug);
      const cached = await cacheGet<PublicContributor[]>(cacheKey);

      let sortedAll: PublicContributor[];
      if (cached) {
        sortedAll = cached;
      } else {
        const state = await prisma.state.findFirst({ where: { slug: stateSlug }, select: { id: true } });
        const stateId = state?.id ?? null;
        const contributors = await prisma.supporter.findMany({
          where: {
            status: "success",
            AND: [notExpired()],
            OR: [
              { tier: { in: [...NATIONAL_TIERS] } },
              { amount: { gte: VISIBILITY_THRESHOLD.national } },
              ...(stateId ? [
                { tier: "state", stateId },
                { stateId, amount: { gte: VISIBILITY_THRESHOLD.state } },
                { sponsoredDistrict: { stateId }, amount: { gte: VISIBILITY_THRESHOLD.state } },
              ] : []),
            ],
          },
          select: SELECT_FIELDS,
          orderBy: [{ amount: "desc" }, { activatedAt: "asc" }],
        });
        sortedAll = contributors.map(toPublic).sort(tierPrioritySort);
        await cacheSet(cacheKey, sortedAll, CACHE_TTL);
      }

      return NextResponse.json({
        contributors: sortedAll.slice(offset, offset + limit),
        total: sortedAll.length,
      });
    }

    // ── Growth trend — monthly new supporters + cumulative ──
    if (type === "growth-trend") {
      const cacheKey = CONTRIBUTOR_KEYS.growthTrend;
      const cached = await cacheGet<Array<{ month: string; newCount: number; cumulative: number }>>(cacheKey);
      if (cached) return NextResponse.json({ points: cached });

      const LAUNCH = new Date("2026-04-01T00:00:00Z");
      const rows = await prisma.supporter.findMany({
        where: { status: "success", createdAt: { gte: LAUNCH } },
        select: { createdAt: true },
      });
      const monthly: Record<string, number> = {};
      for (const r of rows) {
        const d = r.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthly[key] = (monthly[key] ?? 0) + 1;
      }
      const sorted = Object.keys(monthly).sort();
      let cum = 0;
      const points = sorted.map((month) => {
        cum += monthly[month];
        return { month, newCount: monthly[month], cumulative: cum };
      });
      await cacheSet(cacheKey, points, CACHE_TTL);
      return NextResponse.json({ points });
    }

    // ── Top-tier (national visibility) — homepage + every district page ──
    // Anyone with tier in (founder, patron) OR amount ≥ ₹9,999 (one-time
    // OR recurring) qualifies. Admin-tagged tier wins for label, but the
    // visibility gate is amount-based so a one-time ₹50,000 donor lands
    // here automatically.
    if (type === "top-tier") {
      const { limit, offset } = parsePaging(url, 20);
      const cacheKey = CONTRIBUTOR_KEYS.topTier;
      const cached = await cacheGet<PublicContributor[]>(cacheKey);
      const sortedAll = cached
        ? cached
        : (await (async () => {
            const top = await prisma.supporter.findMany({
              where: {
                status: "success",
                AND: [notExpired()],
                OR: [
                  { tier: { in: [...NATIONAL_TIERS] } },
                  { amount: { gte: VISIBILITY_THRESHOLD.national } },
                ],
              },
              select: SELECT_FIELDS,
              orderBy: [{ amount: "desc" }, { activatedAt: "asc" }],
            });
            const sorted = top.map(toPublic).sort(tierPrioritySort);
            await cacheSet(cacheKey, sorted, CACHE_TTL);
            return sorted;
          })());
      return NextResponse.json({
        contributors: sortedAll.slice(offset, offset + limit),
        total: sortedAll.length,
      });
    }

    // ── District page sponsors ──────────────────────────────
    // Visibility on a district page = NATIONAL contributors + STATE
    // contributors (in this state) + DISTRICT contributors (in this
    // district). Decided by amount thresholds (or matching tier),
    // for both subscriptions AND one-time donations.
    if (districtSlug || stateSlug) {
      const { limit, offset } = parsePaging(url, 120);
      const cacheKey = CONTRIBUTOR_KEYS.district(districtSlug ?? "", stateSlug ?? "");
      const cached = await cacheGet<PublicContributor[]>(cacheKey);

      let combined: PublicContributor[];
      if (cached) {
        combined = cached;
      } else {
        let resolvedStateId: string | null = null;
        let resolvedDistrictId: string | null = null;

        if (districtSlug) {
          const district = await prisma.district.findFirst({
            where: { slug: districtSlug },
            select: { id: true, stateId: true },
          });
          if (district) {
            resolvedDistrictId = district.id;
            resolvedStateId = district.stateId;
          }
        }
        if (stateSlug && !resolvedStateId) {
          const state = await prisma.state.findFirst({
            where: { slug: stateSlug },
            select: { id: true },
          });
          if (state) resolvedStateId = state.id;
        }

        const visibilityOr: Array<Record<string, unknown>> = [
          // National visibility — show everywhere
          { tier: { in: [...NATIONAL_TIERS] } },
          { amount: { gte: VISIBILITY_THRESHOLD.national } },
        ];
        if (resolvedStateId) {
          visibilityOr.push(
            { tier: "state", stateId: resolvedStateId },
            { stateId: resolvedStateId, amount: { gte: VISIBILITY_THRESHOLD.state } },
            { sponsoredDistrict: { stateId: resolvedStateId }, amount: { gte: VISIBILITY_THRESHOLD.state } },
          );
        }
        if (resolvedDistrictId) {
          visibilityOr.push(
            { tier: "district", districtId: resolvedDistrictId },
            { districtId: resolvedDistrictId, amount: { gte: VISIBILITY_THRESHOLD.district } },
          );
        }

        const rows = await prisma.supporter.findMany({
          where: {
            status: "success",
            AND: [notExpired()],
            OR: visibilityOr,
          },
          select: SELECT_FIELDS,
          orderBy: [{ amount: "desc" }, { activatedAt: "asc" }, { createdAt: "desc" }],
        });

        // Dedupe (the OR can match the same row through multiple branches)
        const byId = new Map<string, typeof rows[number]>();
        for (const r of rows) byId.set(r.id, r);
        combined = [...byId.values()].map(toPublic).sort(tierPrioritySort);

        await cacheSet(cacheKey, combined, CACHE_TTL);
      }

      return NextResponse.json({
        contributors: combined.slice(offset, offset + limit),
        total: combined.length,
      });
    }

    // ── Leaderboard ─────────────────────────────────────────
    if (type === "leaderboard") {
      const { limit, offset } = parsePaging(url, 10);
      const cacheKey = CONTRIBUTOR_KEYS.leaderboard;
      const cached = await cacheGet<PublicContributor[]>(cacheKey);

      const sortedAll = cached
        ? cached
        : (await (async () => {
            const leaders = await prisma.supporter.findMany({
              where: {
                isRecurring: true,
                subscriptionStatus: "active",
                status: "success",
                ...notExpired(),
              },
              select: SELECT_FIELDS,
              orderBy: [{ amount: "desc" }, { activatedAt: "asc" }],
              take: 50, // cache a bit more than default so first pages come from cache
            });
            const sorted = leaders
              .map(toPublic)
              .sort((a, b) => {
                if (a.monthsActive !== b.monthsActive) return b.monthsActive - a.monthsActive;
                const pa = TIER_PRIORITY[a.tier] ?? 0;
                const pb = TIER_PRIORITY[b.tier] ?? 0;
                if (pa !== pb) return pb - pa;
                return (b.amount ?? 0) - (a.amount ?? 0);
              });
            await cacheSet(cacheKey, sorted, CACHE_TTL);
            return sorted;
          })());

      return NextResponse.json({
        contributors: sortedAll.slice(offset, offset + limit),
        total: sortedAll.length,
      });
    }

    // ── District rankings ─────────────────────────────────
    if (type === "district-rankings") {
      const rkCacheKey = CONTRIBUTOR_KEYS.districtRankings;
      const rkCached = await cacheGet<unknown>(rkCacheKey);
      if (rkCached) return NextResponse.json(rkCached);

      const districtSupporters = await prisma.supporter.findMany({
        where: {
          isRecurring: true,
          subscriptionStatus: "active",
          status: "success",
          districtId: { not: null },
          ...notExpired(),
        },
        select: {
          districtId: true,
          amount: true,
          name: true,
          isPublic: true,
          sponsoredDistrict: {
            select: { name: true, slug: true, active: true, state: { select: { name: true, slug: true } } },
          },
        },
      });

      const districtMap: Record<string, {
        districtName: string;
        districtSlug: string;
        stateName: string;
        stateSlug: string;
        active: boolean;
        count: number;
        monthlyTotal: number;
      }> = {};

      for (const s of districtSupporters) {
        const dId = s.districtId!;
        if (!districtMap[dId]) {
          districtMap[dId] = {
            districtName: s.sponsoredDistrict?.name ?? "Unknown",
            districtSlug: s.sponsoredDistrict?.slug ?? "",
            stateName: s.sponsoredDistrict?.state?.name ?? "",
            stateSlug: s.sponsoredDistrict?.state?.slug ?? "",
            active: s.sponsoredDistrict?.active ?? false,
            count: 0,
            monthlyTotal: 0,
          };
        }
        districtMap[dId].count++;
        districtMap[dId].monthlyTotal += s.amount;
      }

      const rankings = Object.values(districtMap)
        .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

      const activeRankings = rankings.filter((r) => r.active);
      const awaitingLaunch = rankings.filter((r) => !r.active);

      const rkResult = { rankings: activeRankings, awaitingLaunch };
      await cacheSet(rkCacheKey, rkResult, CACHE_TTL);
      return NextResponse.json(rkResult);
    }

    // ── All contributors (one-time + subscriptions) ─────────
    const { limit, offset } = parsePaging(url, 50);
    const cacheKey = CONTRIBUTOR_KEYS.all;
    const cached = await cacheGet<{ subscribers: PublicContributor[]; oneTime: PublicContributor[] }>(cacheKey);

    const full = cached
      ? cached
      : (await (async () => {
          const [subscribers, oneTime] = await Promise.all([
            prisma.supporter.findMany({
              where: {
                isRecurring: true,
                subscriptionStatus: "active",
                status: "success",
                ...notExpired(),
              },
              select: SELECT_FIELDS,
              orderBy: [{ amount: "desc" }, { activatedAt: "asc" }],
            }),
            prisma.supporter.findMany({
              where: {
                isRecurring: false,
                status: "success",
                ...notExpired(),
              },
              select: SELECT_FIELDS,
              orderBy: { amount: "desc" },
            }),
          ]);

          const result = {
            subscribers: subscribers.map(toPublic).sort(tierPrioritySort),
            oneTime: oneTime.map(toPublic),
          };

          await cacheSet(cacheKey, result, CACHE_TTL);
          return result;
        })());

    return NextResponse.json({
      subscribers: full.subscribers.slice(offset, offset + limit),
      oneTime: full.oneTime.slice(offset, offset + limit),
      subscribersTotal: full.subscribers.length,
      oneTimeTotal: full.oneTime.length,
    });
  } catch (err) {
    console.error("[data/contributors]", err);
    return NextResponse.json({ contributors: [], subscribers: [], oneTime: [], total: 0 });
  }
}

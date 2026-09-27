/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { publicDisplayName } from "@/lib/supporter-name";
import { CONTRIBUTOR_KEYS } from "@/lib/supporter-cache";

const CACHE_KEY = CONTRIBUTOR_KEYS.payment; // v8: shared masking rule (src/lib/supporter-name.ts)
const CACHE_TTL = 60; // 60 seconds

export interface ContributorItem {
  displayName: string;
  tierLabel: string;
  tier: string | null;
  message: string | null;
  timeAgo: string;
  socialLink: string | null;
  socialPlatform: string | null;
  /** Full district name (e.g. "Mandya") if the supporter sponsored a specific district. */
  districtName: string | null;
  /** Full state name (e.g. "Karnataka") if the supporter sponsored a specific state. */
  stateName: string | null;
  /** True if this row represents a recurring subscription (vs one-time). */
  isRecurring: boolean;
  /** "active" | "paused" | "cancelled" | "expired" — null for one-time supporters. */
  subscriptionStatus: string | null;
}

export interface ContributorsResponse {
  contributors: ContributorItem[];
  /** Every active supporter: one-time gifts plus ONE month of each subscription. */
  totalRupees: number;
  /** Every active supporter row (one-time and monthly). */
  count: number;
  /** One-time gifts only (isRecurring = false), same filter as `count`. */
  oneTimeCount: number;
  /** One-time gifts only, whole rupees. */
  oneTimeRupees: number;
}

// Session 14 v8.1 Fix #15: when the supporter has opted in to be public,
// show the full name. Privacy theater (first + last initial) only applied
// to people who specifically asked NOT to be displayed publicly — and for
// those we still return "Anonymous", so the truncation form was never
// the right balance.
//
// Sept 2026 (privacy audit): some old rows have a phone number or email in
// the `name` column (early checkout form put the wrong field there). Those
// are PII and must never reach the public API, so they render as "Supporter".
// The email/phone columns are never selected by this route at all.
// The rule is shared with /api/data/contributors: src/lib/supporter-name.ts.
const anonymizeName = publicDisplayName;

// Aligned with VISIBILITY_THRESHOLD in /api/data/contributors so labels match
// where a contributor actually appears.
function tierLabelFor(amountRupees: number): string {
  if (amountRupees < 99) return "☕ Chai Supporter";
  if (amountRupees < 999) return "🏛️ District Supporter";
  if (amountRupees < 9999) return "🗺️ State Supporter";
  if (amountRupees < 50000) return "🌟 All-India Patron";
  return "👑 Founding Builder";
}

function relativeTime(date: Date | null): string {
  const d = date ?? new Date();
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Today";
  if (diff < 7 * day) return "This week";
  if (diff < 30 * day) return "This month";
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function truncateMessage(msg: string | null): string | null {
  if (!msg) return null;
  if (msg.length <= 100) return msg;
  return `${msg.slice(0, 100)}...`;
}

export async function GET() {
  try {
    const cached = await cacheGet<ContributorsResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // April 2026 — read from Supporter (single source of truth). Every
    // Razorpay payment writes a Supporter row, plus admin can add manual
    // donations. Reading Contribution alone missed the manual ones (e.g.
    // Micah Alex's ₹50,000 founding contribution).
    // Note: Supporter.amount is in RUPEES (not paise like Contribution).
    const now = new Date();
    const supporterFilter = {
      status: "success",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [rows, totals, oneTimeTotals] = await Promise.all([
      prisma.supporter.findMany({
        where: supporterFilter,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          name: true,
          amount: true,
          tier: true,
          message: true,
          isPublic: true,
          createdAt: true,
          socialLink: true,
          socialPlatform: true,
          // Plain-text district fallback (legacy field on Supporter).
          district: true,
          // FK relations — preferred source for full names.
          sponsoredDistrict: { select: { name: true } },
          sponsoredState: { select: { name: true } },
          // Subscription gate (Phase I Fix #10b).
          isRecurring: true,
          subscriptionStatus: true,
        },
      }),
      prisma.supporter.aggregate({
        where: supporterFilter,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.supporter.aggregate({
        where: { ...supporterFilter, isRecurring: false },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const contributors: ContributorItem[] = rows.map((r) => {
      const rupees = Math.floor(r.amount); // already rupees
      // Prefer the FK relation; fall back to the legacy plain-text Supporter.district.
      const districtName =
        r.sponsoredDistrict?.name ?? (r.district && r.district.trim() ? r.district.trim() : null);
      const stateName = r.sponsoredState?.name ?? null;
      return {
        displayName: anonymizeName(r.name, r.isPublic),
        tierLabel: tierLabelFor(rupees),
        tier: r.tier,
        message: r.isPublic ? truncateMessage(r.message ?? null) : null,
        timeAgo: relativeTime(r.createdAt ?? null),
        // Only surface the social link if the supporter opted into being public.
        socialLink: r.isPublic ? r.socialLink ?? null : null,
        socialPlatform: r.isPublic ? r.socialPlatform ?? null : null,
        districtName,
        stateName,
        isRecurring: r.isRecurring,
        subscriptionStatus: r.subscriptionStatus ?? null,
      };
    });

    const totalRupees = Math.floor(totals?._sum?.amount ?? 0);
    const count = typeof totals?._count === "number" ? totals._count : 0;

    const result: ContributorsResponse = {
      contributors,
      totalRupees,
      count,
      oneTimeCount: typeof oneTimeTotals?._count === "number" ? oneTimeTotals._count : 0,
      oneTimeRupees: Math.floor(oneTimeTotals?._sum?.amount ?? 0),
    };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[contributors]", err);
    return NextResponse.json({ contributors: [], totalRupees: 0, count: 0, oneTimeCount: 0, oneTimeRupees: 0 });
  }
}

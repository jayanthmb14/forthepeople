/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:contributors:v7"; // bump: phone/email-looking names now masked as "Supporter"
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
  totalRupees: number;
  count: number;
}

// Looks like a phone number: optional "+", then 8+ digits/spaces/dashes.
// Catches "+91 98765 43210", "9876543210", "98765-43210".
const PHONE_LIKE = /^\+?\d[\d\s-]{7,}$/;
// Looks like an email address (loose on purpose — we only need "is this
// probably an email", not RFC validation).
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * True when a stored name is really a phone number, an email address, or too
 * short to be a name (< 2 letters). Such values must never be shown publicly.
 * (Not exported — Next.js route files may only export route handlers. The
 * same rule is mirrored in scripts/anonymize-supporter-names.ts.)
 */
function looksLikeContactInfo(raw: string): boolean {
  const name = (raw || "").trim();
  if (PHONE_LIKE.test(name)) return true;
  if (EMAIL_LIKE.test(name)) return true;
  const letters = name.match(/\p{L}/gu)?.length ?? 0;
  return letters < 2;
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
function anonymizeName(raw: string, isPublic: boolean): string {
  if (!isPublic) return "Anonymous";
  const name = (raw || "").trim();
  if (!name) return "Anonymous";
  if (looksLikeContactInfo(name)) return "Supporter";
  return name;
}

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

    const [rows, totals] = await Promise.all([
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
    };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[contributors]", err);
    return NextResponse.json({ contributors: [], totalRupees: 0, count: 0 });
  }
}

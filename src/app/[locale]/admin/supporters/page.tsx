/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Revenue & Supporters tab (under 💰 FINANCE in the sidebar).
 * - Revenue summary cards (from /api/admin/finance-summary)
 * - "Add Manual Supporter" button for offline contributions
 * - Inline edit (click any row) for tier / district / message / visibility
 * - Razorpay sync button
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SyncButton } from "./SyncButton";
import SupportersSection from "./SupportersSection";
import type { SupporterRow } from "./SupportersTable";
import { requireAdmin } from "@/lib/admin-auth";
type Params = Promise<{ locale: string }>;

export default async function SupportersPage({ params }: { params: Params }) {
  const { locale } = await params;
  const { ok: authed } = await requireAdmin();
  if (!authed) redirect(`/${locale}/admin`);

  const [supporters, districts, states] = await Promise.all([
    prisma.supporter.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        sponsoredDistrict: { select: { name: true, slug: true, stateId: true } },
        sponsoredState: { select: { name: true, slug: true } },
      },
    }),
    prisma.district.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, stateId: true },
      orderBy: { name: "asc" },
    }),
    prisma.state.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized: SupporterRow[] = supporters.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    amount: s.amount,
    tier: s.tier,
    status: s.status,
    method: s.method,
    isRecurring: s.isRecurring,
    subscriptionStatus: s.subscriptionStatus,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    districtName: s.sponsoredDistrict?.name ?? null,
    districtSlug: s.sponsoredDistrict?.slug ?? null,
    districtId: s.districtId,
    stateName: s.sponsoredState?.name ?? null,
    stateSlug: s.sponsoredState?.slug ?? null,
    stateId: s.stateId,
    socialLink: s.socialLink,
    badgeLevel: s.badgeLevel,
    badgeType: s.badgeType,
    message: s.message,
    isPublic: s.isPublic,
    source: s.source,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
            All contributions — Razorpay webhook + manual offline payments. Click any row to edit.
          </div>
        </div>
        <SyncButton />
      </div>

      <SupportersSection
        initialSupporters={serialized}
        districts={districts}
        states={states}
      />
    </div>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * GET /api/admin/districts — returns active districts + states.
 * `states` is additive for the Content Editor / manual-supporter State→District cascade.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [districts, states] = await Promise.all([
    prisma.district.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        nameLocal: true,
        stateId: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.state.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({ districts, states });
}

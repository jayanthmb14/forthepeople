/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/insights?district=mandya&module=leadership
// Returns the latest approved AI insight for a given district + module
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");
  const moduleSlug = searchParams.get("module");

  if (!district || !moduleSlug) {
    return NextResponse.json({ insight: null });
  }

  // Resolve district by slug
  const districtRecord = await prisma.district.findFirst({
    where: { slug: district },
    select: { id: true },
  });
  if (!districtRecord) {
    return NextResponse.json({ insight: null });
  }

  const insight = await prisma.aIInsight.findFirst({
    where: {
      districtId: districtRecord.id,
      module: moduleSlug,
      approved: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    { insight },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const stateSlug = url.searchParams.get("state");
  const districtSlug = url.searchParams.get("district");

  let stateId: string | null = null;
  let districtId: string | null = null;

  if (stateSlug) {
    const state = await prisma.state.findFirst({
      where: { slug: stateSlug },
      select: { id: true },
    });
    stateId = state?.id ?? null;
  }

  if (districtSlug && stateId) {
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug, stateId },
      select: { id: true },
    });
    districtId = district?.id ?? null;
  }

  return NextResponse.json({ stateId, districtId });
}

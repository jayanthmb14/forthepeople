/**
 * GET /api/admin/suggestions
 *
 * Admin-only: list all suggestions, any status. Supports filter by status.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";

const VALID_STATUSES = new Set([
  "PENDING",
  "REVIEWED",
  "ACCEPTED",
  "REJECTED",
  "SPAM",
  "IMPLEMENTED",
]);

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status");
  const where: Prisma.SuggestionWhereInput =
    status && VALID_STATUSES.has(status)
      ? { status: status as Prisma.SuggestionWhereInput["status"] }
      : {};

  const items = await prisma.suggestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ data: items });
}

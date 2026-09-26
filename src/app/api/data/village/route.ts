/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// GET /api/data/village?id=xxx — village details
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const village = await prisma.village.findUnique({
    where: { id },
    include: {
      taluk: {
        include: { district: { select: { name: true, nameLocal: true, slug: true } } },
      },
    },
  });

  if (!village) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: village });
}

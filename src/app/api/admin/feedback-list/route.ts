/**
 * ForThePeople.in — Admin Feedback List API
 * GET: List all feedback with AI classification data
 * PATCH: Update feedback status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { district: { select: { name: true } } },
  });

  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, adminNote } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (adminNote !== undefined) data.adminNote = adminNote;

  await prisma.feedback.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

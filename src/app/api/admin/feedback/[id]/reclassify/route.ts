import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyFeedback } from "@/lib/feedback-classifier";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const fb = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, type: true, subject: true, message: true, module: true, district: { select: { name: true } } },
  });

  if (!fb) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const result = await classifyFeedback(
    fb.id, fb.type, fb.subject, fb.message, fb.module, fb.district?.name
  );

  if (!result) {
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, classification: result });
}

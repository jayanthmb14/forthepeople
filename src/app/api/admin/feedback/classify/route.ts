import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { batchClassifyFeedback } from "@/lib/feedback-classifier";

export async function POST() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await batchClassifyFeedback();
  return NextResponse.json(result);
}

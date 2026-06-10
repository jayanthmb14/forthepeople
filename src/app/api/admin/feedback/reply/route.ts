import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { replyToFeedback } from "@/lib/feedback-reply";

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { feedbackId, replyText, sendEmail } = await req.json();
  if (!feedbackId || !replyText) {
    return NextResponse.json({ error: "feedbackId and replyText required" }, { status: 400 });
  }

  const result = await replyToFeedback(feedbackId, replyText, sendEmail ?? false);
  return NextResponse.json(result);
}

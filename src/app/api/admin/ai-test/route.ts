/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai-provider";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const start = Date.now();
  try {
    const response = await callAI({
      systemPrompt: "You are a test assistant for ForThePeople.in.",
      userPrompt: "Reply with exactly: {\"status\":\"ok\",\"message\":\"Connection successful\"}",
      purpose: "classify",
      jsonMode: true,
    });
    const durationMs = Date.now() - start;
    return NextResponse.json({
      success: true,
      provider: response.provider,
      model: response.model,
      usedFallback: response.usedFallback,
      durationMs,
      response: response.text.slice(0, 200),
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }, { status: 500 });
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Cron: translate live text once, store it
// GET or POST /api/cron/translate-content
// Schedule: vercel.json (catch-up; news and insight crons translate their
// own new items straight away)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
//
//   ?dry=1   plan only: how many pieces/characters are missing, plus one
//            tiny test translation to prove the provider key works
//
// Does nothing (and reports why) until a provider key is set and the
// ContentTranslation table exists. Details: docs/I18N.md §3.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { translatePendingContent } from "@/lib/translation/job";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";

const CRON_NAME = "translate-content";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const startTime = await cronStarted(CRON_NAME);
  try {
    const result = await translatePendingContent({ budgetMs: 270_000, dry });
    // Nothing to do / not configured is still a healthy run.
    const broken = result.enabled && !dry && result.translated === 0 && result.failed > 0;
    await cronFinished(CRON_NAME, startTime, {
      status: broken ? "error" : "ok",
      count: result.translated,
      error: broken ? result.errors[0] : undefined,
    });
    return NextResponse.json({ ok: !broken, dry, ...result, durationMs: Date.now() - startTime });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    await cronFinished(CRON_NAME, startTime, { status: "error", error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

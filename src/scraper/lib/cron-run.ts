/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// withCronErrors — the catch block a cron route needs after cronStarted().
//
// v5.5: weather, crops, dams, news and health-score ran their first DB
// query after cronStarted() with no try/catch. A DB error there left
// Redis "ftp:cron:<name>" at status "running" and the ScraperLog row
// "running", and skipped cronFinished(). Wrapped in this, the run is
// recorded as an error (so /api/health goes stale on schedule) and the
// caller gets a JSON 500. Call cronFinished() yourself on success, as the
// last thing that can throw.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cronFinished } from "@/lib/cron-auth";

export async function withCronErrors(name: string, runStart: number, body: () => Promise<Response>): Promise<Response> {
  try {
    return await body();
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${name}] ${msg}`);
    await cronFinished(name, runStart, { status: "error", error: msg.slice(0, 500) });
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  }
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: petrol and diesel prices — twice a day
// GET /api/cron/scrape-fuel      suggested schedule "0 7,14 * * *"
//                                (12:30 and 19:30 IST; add to vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-fuel" + one ScraperLog row ("fuel")
// Stores:    Redis "ftp:data:fuel" (src/lib/markets/fuel.ts), no expiry
//
// WHY: petrol and diesel were taken off the site because the only numbers
// were two hard-coded April prices. This reads the Petroleum Planning &
// Analysis Cell's daily metro table and double-checks Delhi against PPAC's
// own "as on" line and BPCL's Delhi price build-up (src/scraper/jobs/
// fuel-prices.ts). Prices change at 6 am; PPAC posts the day's table
// around 11 am (home page) and 6:40 pm (metro page) on working days, so
// two runs a day are enough. A run where anything disagrees or cannot be
// read writes nothing and says why.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { acquireCronLock, releaseCronLock } from "@/scraper/lib/cron-lock";
import { collectFuelPrices } from "@/scraper/jobs/fuel-prices";

export const runtime = "nodejs";
export const maxDuration = 60;
const CRON_NAME = "scrape-fuel";
const TIME_BUDGET_MS = 50_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await acquireCronLock(CRON_NAME, maxDuration + 30))) {
    return NextResponse.json({ ok: true, skipped: "another run is in progress" });
  }

  const runStart = await cronStarted(CRON_NAME);
  const logs: string[] = [];
  try {
    const r = await collectFuelPrices({ deadlineMs: runStart + TIME_BUDGET_MS, log: (m) => logs.push(m) });
    console.log(`[scrape-fuel] ${logs.join(" | ")}`);
    const ok = r.written !== null;
    await cronFinished(CRON_NAME, runStart, {
      status: ok ? "ok" : "error",
      count: r.written === "created" ? 1 : 0,
      updated: r.written === "changed" || r.written === "confirmed" ? 1 : 0,
      error: ok ? undefined : `Nothing written: ${r.problems.join("; ")}`.slice(0, 500),
      attempted: 1,
    });
    return NextResponse.json(
      {
        ok,
        written: r.written,
        problems: r.problems,
        asOf: r.snapshot?.asOf ?? null,
        cities: r.snapshot?.cities ?? [],
        tableUrl: r.tableUrl,
        durationMs: Date.now() - runStart,
      },
    );
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-fuel] ${msg} | ${logs.join(" | ")}`);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: `Fuel prices: ${msg}` });
    return NextResponse.json({ ok: false, error: "Fuel prices could not be collected" }, { status: 502 });
  } finally {
    await releaseCronLock(CRON_NAME);
  }
}

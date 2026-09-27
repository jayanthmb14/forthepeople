/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// GET /api/data/prices → the cached market-prices snapshot the /prices page
// is built from: gold 24K / 22K (₹ per gram), silver (₹ per kg), USD/INR,
// Brent crude ($ per barrel), Sensex, Nifty 50 and Nifty Bank, each with
// about 4 months of daily values, its source link and (for Yahoo) the time
// of the newest value. A series whose source failed is missing — never
// filled in. See src/lib/markets/prices.ts.
import { NextResponse } from "next/server";
import { getPricesSnapshot } from "@/lib/markets/prices";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET() {
  const snap = await getPricesSnapshot();
  const ok = Object.keys(snap.series).length > 0;
  return NextResponse.json(snap, {
    headers: { "Cache-Control": ok ? "public, s-maxage=600, stale-while-revalidate=300" : "no-store" },
  });
}

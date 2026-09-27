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
//
// `fuel`: petrol and diesel in Delhi, Mumbai, Chennai and Kolkata (rupees
// per litre at IOCL outlets, PPAC's daily table), with PPAC's "as on" day
// and the source links; Delhi is double-checked against BPCL. null until
// /api/cron/scrape-fuel has stored a checked snapshot (src/lib/markets/fuel.ts).
import { NextResponse } from "next/server";
import { getPricesSnapshot } from "@/lib/markets/prices";
import { readFuelSnapshot } from "@/lib/markets/fuel";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET() {
  const [snap, fuel] = await Promise.all([getPricesSnapshot(), readFuelSnapshot()]);
  const ok = Object.keys(snap.series).length > 0;
  return NextResponse.json({ ...snap, fuel }, {
    headers: { "Cache-Control": ok ? "public, s-maxage=600, stale-while-revalidate=300" : "no-store" },
  });
}

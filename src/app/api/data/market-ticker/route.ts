/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Market Ticker API
// GET /api/data/market-ticker → { items, asOf, isMarketHours, fromCache, usingFallback }
//
// The latest value and the change since the previous trading day for each
// figure. Built from the same cached snapshot as the /prices page
// (src/lib/markets/prices.ts), plus EUR/INR, Bitcoin and Ethereum, which only
// the ticker shows.
//
// Sept 2026 (v5) fixes:
//   • Yahoo answered 429 to every call because this route sent a desktop
//     browser User-Agent with Origin/Referer: finance.yahoo.com. The shared
//     fetcher sends a plain User-Agent and no Origin/Referer.
//   • Silver was always missing: IBJA's silver key is `silverRate`, not
//     `purity999`. Silver is now shown per kilogram, as IBJA publishes it.
//   • Petrol and diesel were two hard-coded April numbers shown as today's
//     price. Removed until there is a real, dated source.
//   • The "fallback" list of invented numbers is gone: when every source
//     fails, `items` is empty and the ticker hides itself.
//   • Crude is Brent (the front-month contract, e.g. BZX26.NYM), the benchmark India's oil basket follows, in US
//     dollars per barrel — the same series as the /prices page.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { latestWithChange, type PricePoint } from "@/lib/markets/compute";
import { getPricesSnapshot, isIndianMarketOpen, type PriceKey } from "@/lib/markets/prices";
import { fetchYahooSeries } from "@/lib/markets/sources";

export const runtime = "nodejs";
export const maxDuration = 20;

const CACHE_KEY = "ftp:market-ticker:v5"; // v5: shared snapshot, no fuel, no fallback, silver per kg

export interface TickerItem {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  /** "/g", "/kg", "/bbl" or "" (index points, exchange rates). */
  unit: string;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

/** One ticker row from a daily series, or null when the series is empty. */
function rowFrom(
  symbol: string,
  label: string,
  points: PricePoint[] | undefined,
  opts: { prefix?: string; decimals?: number; unit?: string } = {},
): TickerItem | null {
  if (!points || points.length === 0) return null;
  const lw = latestWithChange(points);
  if (!lw) return null;
  const { prefix = "", decimals = 0, unit = "" } = opts;
  const c = lw.change;
  const abs = c ? c.abs : 0;
  return {
    symbol,
    label,
    value: `${prefix}${fmt(lw.latest.v, decimals)}`,
    change: !c || c.direction === "flat" ? "–" : `${abs >= 0 ? "+" : "-"}${prefix}${fmt(Math.abs(abs), decimals)}`,
    changePct: c ? c.pct : 0,
    direction: c ? c.direction : "flat",
    unit,
  };
}

async function fetchUsdInrLatest(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.INR;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cached = await cacheGet<{ items: TickerItem[]; asOf: string }>(CACHE_KEY);
  if (cached) return NextResponse.json({ ...cached, fromCache: true });

  const [snap, eurR, btcR, ethR] = await Promise.all([
    getPricesSnapshot(),
    fetchYahooSeries("EURINR=X", "5d"),
    fetchYahooSeries("BTC-INR", "5d"),
    fetchYahooSeries("ETH-INR", "5d"),
  ]);
  const pts = (k: PriceKey) => snap.series[k]?.points;

  const rows: Array<TickerItem | null> = [
    rowFrom("SENSEX", "Sensex", pts("sensex")),
    rowFrom("NIFTY50", "Nifty 50", pts("nifty")),
    rowFrom("NIFTYBANK", "Nifty Bank", pts("bankNifty")),
    rowFrom("GOLD", "Gold (24K)", pts("gold24"), { prefix: "₹", unit: "/g" }),
    rowFrom("SILVER", "Silver", pts("silver"), { prefix: "₹", unit: "/kg" }),
    rowFrom("CRUDE", "Brent crude", pts("crude"), { prefix: "$", decimals: 2, unit: "/bbl" }),
    rowFrom("USD_INR", "USD/INR", pts("usdInr"), { prefix: "₹", decimals: 2 }),
    rowFrom("EUR_INR", "EUR/INR", eurR?.points, { prefix: "₹", decimals: 2 }),
    rowFrom("BTC_INR", "Bitcoin", btcR?.points, { prefix: "₹" }),
    rowFrom("ETH_INR", "Ethereum", ethR?.points, { prefix: "₹" }),
  ];
  const items = rows.filter((r): r is TickerItem => r !== null);

  // USD/INR: when Yahoo failed, the latest rate from open.er-api (no change figure).
  if (!items.some((i) => i.symbol === "USD_INR")) {
    const rate = await fetchUsdInrLatest();
    if (rate) {
      items.push({ symbol: "USD_INR", label: "USD/INR", value: `₹${fmt(rate, 2)}`, change: "–", changePct: 0, direction: "flat", unit: "" });
    }
  }

  const result = {
    items,
    asOf: new Date().toISOString(),
    isMarketHours: isIndianMarketOpen(),
    fromCache: false,
    usingFallback: false,
  };

  // Nothing came back: don't cache the empty answer for long.
  const ttl = items.length === 0 ? 60 : isIndianMarketOpen() ? 300 : 1800;
  await cacheSet(CACHE_KEY, result, ttl);
  return NextResponse.json(result, {
    headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=60` },
  });
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Market Ticker API
// GET /api/data/market-ticker
// Free data: Yahoo Finance + open.er-api.com + IBJA
// Redis cache: 5 min market hours, 30 min after hours
//
// Sept 2026 fix: this route used to fetch nine upstreams one after another
// with no timeout, so a single hung Yahoo call 504'd the whole ticker
// (Vercel logged "Task timed out after 300 seconds"). Now every upstream
// gets AbortSignal.timeout(5000), all of them run in parallel via
// Promise.allSettled, and the route caps itself at maxDuration = 15.
// Worst case the ticker answers in ~5 s with whatever came back.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 15;

// Hard cap per upstream call. Yahoo normally answers in <1 s.
const UPSTREAM_TIMEOUT_MS = 5_000;

const CACHE_KEY = "ftp:market-ticker:v4"; // bump: added Bank Nifty + BTC/ETH + EUR/INR
// Fuel prices removed — not universal across districts

export interface TickerItem {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  unit: string;
}

// IST offset = UTC+5:30
function isMarketHours(): boolean {
  const now = new Date();
  const istHour = (now.getUTCHours() + 5) % 24;
  const istMin = (now.getUTCMinutes() + 30) % 60;
  const istTotalMin = istHour * 60 + istMin;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  // 9:15 AM to 3:30 PM IST
  return istTotalMin >= 555 && istTotalMin <= 930;
}

function getCacheTTL(): number {
  return isMarketHours() ? 300 : 1800;
}

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://finance.yahoo.com",
  Referer: "https://finance.yahoo.com",
};

async function fetchYahooQuote(
  ticker: string
): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prev = meta.previousClose ?? meta.chartPreviousClose;
    const change = price - prev;
    const changePct = (change / prev) * 100;
    return { price, change, changePct };
  } catch {
    return null;
  }
}

async function fetchUSDINR(): Promise<{ rate: number; changePct: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.INR;
    if (!rate) return null;
    // open.er-api doesn't give change, use small estimated variation
    return { rate, changePct: 0 };
  } catch {
    return null;
  }
}

// Fuel prices (petrol/LPG) removed — they are city-specific, not universal

// ── IBJA (India Bullion and Jewellers Association) — Official Indian gold/silver prices ──
async function fetchIBJAPrices(): Promise<{
  gold: { price: number; change: number; changePct: number } | null;
  silver: { price: number; change: number; changePct: number } | null;
}> {
  try {
    const res = await fetch("https://www.ibjarates.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return { gold: null, silver: null };
    const html = await res.text();

    // IBJA hidden fields contain JSON with purity999 (24K gold per 10g) and silver per kg
    const goldRateMatch = html.match(/HdnGold[^"]*"[^"]*value="([^"]*)"/i);
    const silverRateMatch = html.match(/HdnSilver[^"]*"[^"]*value="([^"]*)"/i);

    let goldPrice: number | null = null;
    let goldPrevPrice: number | null = null;
    let silverPrice: number | null = null;
    let silverPrevPrice: number | null = null;

    // Parse JSON format: {"labels":[...], "purity999":[128596, 132710, ...]}
    if (goldRateMatch) {
      try {
        const decoded = goldRateMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(decoded);
        const vals: number[] = data.purity999 ?? data.purity995 ?? [];
        if (vals.length >= 2) {
          goldPrice = vals[vals.length - 1];
          goldPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          goldPrice = vals[0];
        }
      } catch {
        // Fallback: try comma-separated format
        const vals = goldRateMatch[1].split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 50000);
        if (vals.length >= 2) {
          goldPrice = vals[vals.length - 1];
          goldPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          goldPrice = vals[0];
        }
      }
    }
    if (silverRateMatch) {
      try {
        const decoded = silverRateMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(decoded);
        const vals: number[] = data.purity999 ?? [];
        if (vals.length >= 2) {
          silverPrice = vals[vals.length - 1];
          silverPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          silverPrice = vals[0];
        }
      } catch {
        const vals = silverRateMatch[1].split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v) && v > 50000);
        if (vals.length >= 2) {
          silverPrice = vals[vals.length - 1];
          silverPrevPrice = vals[vals.length - 2];
        } else if (vals.length === 1) {
          silverPrice = vals[0];
        }
      }
    }

    const goldChange = goldPrice && goldPrevPrice ? goldPrice - goldPrevPrice : 0;
    const goldChangePct = goldPrice && goldPrevPrice ? (goldChange / goldPrevPrice) * 100 : 0;
    const silverChange = silverPrice && silverPrevPrice ? silverPrice - silverPrevPrice : 0;
    const silverChangePct = silverPrice && silverPrevPrice ? (silverChange / silverPrevPrice) * 100 : 0;

    return {
      gold: goldPrice ? { price: goldPrice, change: goldChange, changePct: goldChangePct } : null,
      silver: silverPrice ? { price: silverPrice, change: silverChange, changePct: silverChangePct } : null,
    };
  } catch {
    return { gold: null, silver: null };
  }
}

// Fallback static data (last known realistic values — used when all sources fail)
// Fallback: last known values (April 2026) — used when all live sources fail
const FALLBACK: TickerItem[] = [
  { symbol: "GOLD", label: "Gold (24K)", value: "₹15,033", change: "–", changePct: 0, direction: "flat", unit: "/g" },
  { symbol: "SILVER", label: "Silver", value: "₹260", change: "–", changePct: 0, direction: "flat", unit: "/g" },
  { symbol: "PETROL", label: "Petrol", value: "₹104.61", change: "–", changePct: 0, direction: "flat", unit: "/L" },
  { symbol: "DIESEL", label: "Diesel", value: "₹92.27", change: "–", changePct: 0, direction: "flat", unit: "/L" },
  { symbol: "USD_INR", label: "USD/INR", value: "₹85.50", change: "–", changePct: 0, direction: "flat", unit: "" },
  { symbol: "SENSEX", label: "Sensex", value: "74,248", change: "+312", changePct: 0.42, direction: "up", unit: "" },
  { symbol: "NIFTY50", label: "Nifty 50", value: "22,519", change: "+87", changePct: 0.39, direction: "up", unit: "" },
  { symbol: "CRUDE", label: "Crude", value: "$62.50", change: "-0.90", changePct: -1.14, direction: "down", unit: "/bbl" },
];

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}


// ── Small helper: build one ticker row from a quote ─────────
function quoteItem(
  symbol: string,
  label: string,
  q: { price: number; change: number; changePct: number },
  opts: { prefix?: string; decimals?: number; unit?: string; dashWhenFlat?: boolean } = {},
): TickerItem {
  const { prefix = "", decimals = 0, unit = "", dashWhenFlat = false } = opts;
  const price = decimals === 0 ? Math.round(q.price) : q.price;
  const change = decimals === 0 ? Math.round(q.change) : q.change;
  return {
    symbol,
    label,
    value: `${prefix}${fmt(price, decimals)}`,
    change: dashWhenFlat && change === 0 ? "–" : `${change >= 0 ? "+" : ""}${fmt(change, decimals)}`,
    changePct: q.changePct,
    direction: q.change > 0 ? "up" : q.change < 0 ? "down" : "flat",
    unit,
  };
}

/** Unwrap a Promise.allSettled result; a rejection counts as "no data". */
function settledValue<T>(r: PromiseSettledResult<T | null>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

export async function GET() {
  // Check cache first
  const cached = await cacheGet<{ items: TickerItem[]; asOf: string; fromCache: boolean }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  // ── Fire every upstream at once. Each has its own 5 s timeout, so the
  //    slowest possible path here is ~5 s, not 9 × (however long Yahoo hangs).
  const [sensexR, niftyR, niftyBankR, btcR, ethR, eurInrR, usdYahooR, crudeR, ibjaR] = await Promise.allSettled([
    fetchYahooQuote("^BSESN"),
    fetchYahooQuote("^NSEI"),
    fetchYahooQuote("^NSEBANK"),
    fetchYahooQuote("BTC-INR"),
    fetchYahooQuote("ETH-INR"),
    fetchYahooQuote("EURINR=X"),
    fetchYahooQuote("USDINR=X"),
    fetchYahooQuote("CL=F"),
    fetchIBJAPrices(),
  ]);

  const sensex = settledValue(sensexR);
  const nifty = settledValue(niftyR);
  const niftyBank = settledValue(niftyBankR);
  const btc = settledValue(btcR);
  const eth = settledValue(ethR);
  const eurInr = settledValue(eurInrR);
  const usdYahoo = settledValue(usdYahooR);
  const crude = settledValue(crudeR);
  const ibja = settledValue(ibjaR) ?? { gold: null, silver: null };

  const items: TickerItem[] = [];
  let fetchedAny = false;

  if (sensex) { fetchedAny = true; items.push(quoteItem("SENSEX", "Sensex", sensex)); }
  if (nifty) { fetchedAny = true; items.push(quoteItem("NIFTY50", "Nifty 50", nifty)); }
  // Session 16 v10 Phase C (Fix #2): Nifty Bank, BTC/INR, ETH/INR, EUR/INR
  if (niftyBank) { fetchedAny = true; items.push(quoteItem("NIFTYBANK", "Nifty Bank", niftyBank)); }
  if (btc) { fetchedAny = true; items.push(quoteItem("BTC_INR", "Bitcoin", btc, { prefix: "₹" })); }
  if (eth) { fetchedAny = true; items.push(quoteItem("ETH_INR", "Ethereum", eth, { prefix: "₹" })); }
  if (eurInr) {
    fetchedAny = true;
    items.push(quoteItem("EUR_INR", "EUR/INR", eurInr, { prefix: "₹", decimals: 2, dashWhenFlat: true }));
  }

  // USD/INR — Yahoo first (real-time); only if that failed, try open.er-api
  // (one extra 5 s call at most, and only on the failure path).
  if (usdYahoo) {
    fetchedAny = true;
    items.push(quoteItem("USD_INR", "USD/INR", usdYahoo, { prefix: "₹", decimals: 2, dashWhenFlat: true }));
  } else {
    const usd = await fetchUSDINR();
    if (usd) {
      fetchedAny = true;
      items.push({
        symbol: "USD_INR",
        label: "USD/INR",
        value: `₹${fmt(usd.rate, 2)}`,
        change: "–",
        changePct: 0,
        direction: "flat",
        unit: "",
      });
    }
  }

  if (crude) {
    fetchedAny = true;
    items.push(quoteItem("CRUDE", "Crude", crude, { prefix: "$", decimals: 2, unit: "/bbl" }));
  }

  // Gold & Silver — IBJA (India Bullion and Jewellers Association) official Indian rates
  if (ibja.gold) {
    fetchedAny = true;
    // IBJA gives price per 10g — convert to per gram
    const goldPerGram = ibja.gold.price / 10;
    const goldChangePerGram = ibja.gold.change / 10;
    items.push({
      symbol: "GOLD",
      label: "Gold (24K)",
      value: `₹${fmt(Math.round(goldPerGram))}`,
      change: goldChangePerGram !== 0
        ? `${goldChangePerGram >= 0 ? "+" : ""}₹${fmt(Math.round(Math.abs(goldChangePerGram)))}`
        : "–",
      changePct: ibja.gold.changePct,
      direction: ibja.gold.change > 0 ? "up" : ibja.gold.change < 0 ? "down" : "flat",
      unit: "/g",
    });
  }
  if (ibja.silver) {
    fetchedAny = true;
    // IBJA gives silver price per kg — convert to per gram
    const silverPerGram = ibja.silver.price / 1000;
    const silverChangePerGram = ibja.silver.change / 1000;
    items.push({
      symbol: "SILVER",
      label: "Silver",
      value: `₹${fmt(silverPerGram, 2)}`,
      change: silverChangePerGram !== 0
        ? `${silverChangePerGram >= 0 ? "+" : ""}₹${fmt(Math.abs(silverChangePerGram), 2)}`
        : "–",
      changePct: ibja.silver.changePct,
      direction: ibja.silver.change > 0 ? "up" : ibja.silver.change < 0 ? "down" : "flat",
      unit: "/g",
    });
  }

  // Petrol & Diesel — static India averages
  // TODO: Make dynamic via fuel price API when a reliable free source is available
  items.push({
    symbol: "PETROL",
    label: "Petrol",
    value: "₹104.61",
    change: "–",
    changePct: 0,
    direction: "flat",
    unit: "/L",
  });
  items.push({
    symbol: "DIESEL",
    label: "Diesel",
    value: "₹92.27",
    change: "–",
    changePct: 0,
    direction: "flat",
    unit: "/L",
  });

  // Order: indices first (Sensex/Nifty/Bank), then commodities (Gold/Silver/Crude),
  // then fuel + currencies + crypto. Session 16 v10 Phase C.
  const ORDER = ["SENSEX", "NIFTY50", "NIFTYBANK", "GOLD", "SILVER", "CRUDE", "PETROL", "DIESEL", "USD_INR", "EUR_INR", "BTC_INR", "ETH_INR"];
  const ordered: TickerItem[] = ORDER
    .map((sym) => items.find((i) => i.symbol === sym))
    .filter((i): i is TickerItem => Boolean(i));

  // Use fallback if nothing fetched
  const finalItems = fetchedAny && ordered.length >= 2 ? ordered : FALLBACK;

  const result = {
    items: finalItems,
    asOf: new Date().toISOString(),
    isMarketHours: isMarketHours(),
    fromCache: false,
    usingFallback: !fetchedAny,
  };

  // Do not cache a pure-fallback answer for long: retry upstreams sooner.
  const ttl = fetchedAny ? getCacheTTL() : 60;
  await cacheSet(CACHE_KEY, result, ttl);
  return NextResponse.json(result, {
    headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=60` },
  });
}

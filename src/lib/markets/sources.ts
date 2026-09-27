/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Market prices — upstream fetchers (network only; no cache, no fallback)
// ═══════════════════════════════════════════════════════════════════════
//
//  Two free, public sources:
//    • IBJA (India Bullion and Jewellers Association), ibjarates.com —
//      gold 24K / 22K and silver, about 4 months of daily evening rates.
//    • Yahoo Finance chart API — Sensex, Nifty 50, Nifty Bank, USD/INR,
//      Brent crude and a few others, any range.
//
//  Yahoo answers 429 ("Too many requests") to a full desktop-browser
//  User-Agent and to Origin/Referer headers pointing at finance.yahoo.com —
//  exactly what the old ticker sent, which is why Sensex and Nifty were
//  missing. A plain, honest User-Agent is answered normally (checked
//  27 Sep 2026). If query1 still refuses, query2 is tried once.
//
//  Every call has its own timeout. A failed call returns null: the caller
//  shows the empty state, never an invented value.
//
//  Caching: by default nothing is cached here (`cache: "no-store"`; the
//  callers keep a Redis snapshot). A server-rendered page passes
//  `revalidate` instead, so the fetch goes through Next's data cache and the
//  page can stay statically generated (ISR) — a no-store fetch would make
//  the whole route dynamic.

import { parseIbjaHtml, parseYahooChart, type IbjaSeries, type YahooSeries } from "./compute";

const TIMEOUT_MS = 6_000;

const YAHOO_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; ForThePeople.in/1.0; +https://forthepeople.in)",
  Accept: "application/json",
};

export const IBJA_URL = "https://www.ibjarates.com/";

/** Public page a visitor can open to check a Yahoo series. */
export function yahooQuoteUrl(symbol: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
}

export interface FetchCacheOptions {
  /** Seconds to keep the response in Next's data cache; omit for no-store. */
  revalidate?: number;
}

function cacheInit(opts?: FetchCacheOptions): RequestInit {
  return opts?.revalidate ? ({ next: { revalidate: opts.revalidate } } as RequestInit) : { cache: "no-store" };
}

/**
 * Daily closes for one Yahoo symbol. `range` is Yahoo's own ("5d", "1mo",
 * "6mo", "1y"); the /prices page asks for 6 months so a full 3-month window
 * and its starting point are always inside the answer.
 */
export async function fetchYahooSeries(symbol: string, range = "6mo", opts?: FetchCacheOptions): Promise<YahooSeries | null> {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${encodeURIComponent(range)}`;
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(`https://${host}.finance.yahoo.com${path}`, {
        headers: YAHOO_HEADERS,
        ...cacheInit(opts),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue; // 429 / 5xx → try the other host once
      const parsed = parseYahooChart(await res.json());
      if (parsed) return parsed;
    } catch {
      // timeout / network error → try the other host once
    }
  }
  return null;
}

/** IBJA gold 24K, gold 22K and silver history from the IBJA home page. */
export async function fetchIbjaSeries(opts?: FetchCacheOptions): Promise<IbjaSeries | null> {
  try {
    const res = await fetch(IBJA_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ForThePeople.in/1.0; +https://forthepeople.in)",
        Accept: "text/html,application/xhtml+xml",
      },
      ...cacheInit(opts),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const series = parseIbjaHtml(await res.text());
    const empty = !series.gold999Per10g.length && !series.gold916Per10g.length && !series.silverPerKg.length;
    return empty ? null : series;
  } catch {
    return null;
  }
}

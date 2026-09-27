/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Collapse the same story told by several outlets ("Karnataka: Lokayukta
// raids in Mandya…", "India News | Karnataka: Lokayukta Raids in Mandya…",
// "Karnataka Lokayukta raids Mandya…"). The ingest-time check (same title
// prefix within 24 h, src/scraper/jobs/news.ts) misses reworded headlines;
// this runs on the list a page shows. Pure function, unit-tested.

const STOP = new Set([
  "a", "an", "the", "in", "of", "to", "for", "on", "at", "as", "after", "from", "over", "and", "by", "with",
  "is", "are", "be", "into", "its", "his", "her", "their", "news", "india", "district", "s",
]);
const NUMBER_WORDS: Record<string, string> = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five" };

/** Content words of a headline, lower-cased, lightly stemmed, without the district's own name. */
export function headlineTokens(title: string, drop: string[] = []): Set<string> {
  const dropSet = new Set(drop.map((d) => d.toLowerCase()));
  const words = title
    .toLowerCase()
    .replace(/^india news\s*\|\s*/, "")
    .replace(/[’']s\b/g, "")
    .split(/[^a-z0-9-]+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .filter((w) => !STOP.has(w) && !dropSet.has(w));
  return new Set(words);
}

/** True when two headlines are the same story: most words shared (overlap coefficient). */
export function sameStory(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const smaller = Math.min(a.size, b.size);
  return smaller > 0 && shared >= 4 && shared / smaller >= 0.6;
}

const WINDOW_MS = 48 * 60 * 60 * 1000;
const AGGREGATOR_RX = /^india news\s*\|/i;

/**
 * Keep the first (newest, as ordered) article of each story; drop later
 * copies published within 48 h of a kept one.
 */
export function dedupeStories<T extends { title: string; publishedAt: Date | string }>(
  rows: T[],
  drop: string[] = [],
): T[] {
  const kept: { row: T; tokens: Set<string>; at: number }[] = [];
  for (const row of rows) {
    const tokens = headlineTokens(row.title, drop);
    const at = new Date(row.publishedAt).getTime();
    const dup = kept.find((k) => Math.abs(k.at - at) <= WINDOW_MS && sameStory(k.tokens, tokens));
    if (!dup) kept.push({ row, tokens, at });
    // Prefer the outlet's own headline over an aggregator's "India News | …" copy.
    else if (AGGREGATOR_RX.test(dup.row.title) && !AGGREGATOR_RX.test(row.title)) dup.row = row;
  }
  return kept.map((k) => k.row);
}

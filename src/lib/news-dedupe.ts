/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Collapse the same story told by several outlets ("Karnataka: Lokayukta
// raids in Mandya…", "India News | Karnataka: Lokayukta Raids in Mandya…",
// "Karnataka Lokayukta raids Mandya…"). At ingest (src/scraper/jobs/news.ts)
// a headline whose first five long words match a story of the last 7 days
// is not saved (titleKey), and a reworded copy of a story from the last
// 24 h is saved pointing at it (findCanonicalStory → duplicateOf). What
// slips past both is collapsed on the list a page shows (dedupeStories).
// Pure functions, unit-tested.

const STOP = new Set([
  "a", "an", "the", "in", "of", "to", "for", "on", "at", "as", "after", "from", "over", "and", "by", "with",
  "is", "are", "be", "into", "its", "his", "her", "their", "news", "india", "district", "s",
  // v5.4: small words that two different stories share by chance.
  "what", "why", "how", "who", "it", "this", "that", "will", "has", "have", "was", "not", "no", "says", "said",
  "amid", "against", "about", "up", "out", "new", "all",
]);
const NUMBER_WORDS: Record<string, string> = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five" };

/** Content words of a headline, lower-cased, lightly stemmed, without the district's own name. */
export function headlineTokens(title: string, drop: string[] = []): Set<string> {
  // Place names may be several words ("Bengaluru Urban", "Tamil Nadu"): drop each word.
  const dropSet = new Set(drop.flatMap((d) => d.toLowerCase().split(/[^a-z0-9-]+/)).filter(Boolean));
  const words = title
    .toLowerCase()
    .replace(/^india news\s*\|\s*/, "")
    .replace(/[’']s\b/g, "")
    .split(/[^a-z0-9-]+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .filter((w) => !STOP.has(w)) // before stemming too: "this" must not become "thi"
    .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .filter((w) => !STOP.has(w) && !dropSet.has(w));
  return new Set(words);
}

/**
 * True when two headlines are the same story: most words shared (overlap
 * coefficient). v5.4 (Sept 2026 audit): 3 shared content words and 40 %
 * of the shorter headline — reworded copies from other outlets share only
 * 3–4 ("Cauvery row: Farmers claim injustice; stage protest in Mandya" and
 * "Mandya farmers protest Cauvery water release recommendation"; "Gavimath
 * pontiff to inaugurate Mysuru Dasara this year" and "K'taka govt picks
 * Gavimath seer to inaugurate Mysuru Dasara"), so the old 4-word / 60 %
 * rule let them through. Checked on every district's September rows.
 * Only stories within 48 h (list) or 24 h (ingest) of each other are compared.
 */
export function sameStory(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const smaller = Math.min(a.size, b.size);
  return smaller > 0 && shared >= 3 && shared / smaller >= 0.4;
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

// ── Ingest-time checks (src/scraper/jobs/news.ts) ────────────
// Sept 2026: the ingest checks compared a punctuation-free key with the
// stored title through SQL `contains`, so "Karnataka: Lokayukta raids …"
// never matched "karnataka lokayukta raids …" — every re-worded or
// re-punctuated copy of a story was stored again. The stored titles are
// now keyed the same way in memory.

/** The first five words of 4+ letters, punctuation as spaces: the "same headline, other URL" key. */
export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .join(" ");
}

export interface StoredStory {
  id: string;
  title: string;
  publishedAt: Date | string;
  duplicateOf: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The earliest stored original (not itself a copy) of the same story
 * published within 24 h of this one, or null. Used to set NewsItem.duplicateOf.
 */
export function findCanonicalStory(
  title: string,
  publishedAt: Date | string,
  stored: readonly StoredStory[],
  drop: string[] = [],
): string | null {
  const tokens = headlineTokens(title, drop);
  const at = new Date(publishedAt).getTime();
  let best: { id: string; at: number } | null = null;
  for (const s of stored) {
    if (s.duplicateOf) continue;
    const sAt = new Date(s.publishedAt).getTime();
    if (Math.abs(sAt - at) > DAY_MS) continue;
    if (!sameStory(tokens, headlineTokens(s.title, drop))) continue;
    if (!best || sAt < best.at) best = { id: s.id, at: sAt };
  }
  return best?.id ?? null;
}

/**
 * Stored rows sharing a normalised 50-character title prefix: the original
 * (fetched first) stays, the later copies go. Pure; the cron deletes them.
 */
export function planTitleDuplicates<T extends { id: string; title: string; fetchedAt: Date | string }>(
  rows: readonly T[],
): Array<{ keepId: string; removeIds: string[] }> {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 50);
    if (key.length < 15) continue;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out: Array<{ keepId: string; removeIds: string[] }> = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const sorted = [...g].sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime() || a.id.localeCompare(b.id));
    out.push({ keepId: sorted[0].id, removeIds: sorted.slice(1).map((r) => r.id) });
  }
  return out;
}

// ── Housekeeping of stored stories (src/lib/news-store.ts runs it) ───
// Sept 2026 review: the "keep the newest 50" clean-up deleted stories that
// were still inside the feeds' 3-day window. The next run fetched them
// again as new rows — classified by the AI again, acted on and queued for
// review again (one URL was queued 19 times) — and deleted them again. It
// also left copies pointing (duplicateOf) at deleted originals, which hid
// those stories from every list.

/** The feeds' window: an article older than this is never fetched (src/scraper/jobs/news.ts). */
export const NEWS_MAX_AGE_DAYS = 3;
/** Stories kept per district beyond the fetch window. */
export const NEWS_KEEP_PER_DISTRICT = 50;

/**
 * Ids to delete: beyond the newest `keep`, and only those older than the
 * fetch window — a story the feeds can still return is never deleted, so
 * it is never fetched, classified and acted on twice.
 */
export function planNewsRetention<T extends { id: string; publishedAt: Date | string }>(
  rows: readonly T[],
  now: number,
  keep = NEWS_KEEP_PER_DISTRICT,
  maxAgeDays = NEWS_MAX_AGE_DAYS,
): string[] {
  const cutoff = now - maxAgeDays * DAY_MS;
  return [...rows]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(keep)
    .filter((r) => new Date(r.publishedAt).getTime() < cutoff)
    .map((r) => r.id);
}

/**
 * Copies whose original is being deleted: per original, the earliest copy
 * becomes the story's row (duplicateOf null) and the others point at it,
 * so the story stays listed once.
 */
export function planCopyPromotion<T extends { id: string; duplicateOf: string | null; publishedAt: Date | string }>(
  copies: readonly T[],
): Array<{ keepId: string; repointIds: string[] }> {
  const byOriginal = new Map<string, T[]>();
  for (const c of copies) {
    if (!c.duplicateOf) continue;
    byOriginal.set(c.duplicateOf, [...(byOriginal.get(c.duplicateOf) ?? []), c]);
  }
  return [...byOriginal.values()].map((g) => {
    const sorted = [...g].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime() || a.id.localeCompare(b.id));
    return { keepId: sorted[0].id, repointIds: sorted.slice(1).map((r) => r.id) };
  });
}

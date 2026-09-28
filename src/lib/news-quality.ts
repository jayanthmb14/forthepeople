/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// News quality — PURE helpers (no DB, no network), unit-tested in
// tests/news-quality.test.ts. Used when a story is saved
// (src/scraper/jobs/news.ts) and again when the list is served
// (/api/data/news), so rows saved by older code follow the same rules.
//
//   cleanHeadline()      publisher suffixes, "India News |" kickers and
//                        invisible characters out of a headline
//   displayHeadline()    a headline the feed cut short ends with "…"
//   isPromotional()      advertorials, price pages and listicles
//   isPlaceChecked()     a keyword-only row that may be about another place
//   newsForDisplay()     all of the above over one district's rows
//   newsDisplayTitle()   one row's headline exactly as the list shows it
//                        (what its stored translation is made from)
//
// Why (Sept 2026 audit): "Aarthi Scans & Labs Ranked #1 in Diagnostics"
// and "Gold Rate Today in Lucknow" were shown as local news; "… | Latest
// News Delhi" and nine zero-width spaces were part of headlines; TOI
// headlines cut at 105 characters ("… Sena UBT's Sanjay R") read as
// complete; and rows saved by the old job (no place check) put Karnataka
// and Chengalpattu stories in the New Delhi and Chennai feeds.
// ═══════════════════════════════════════════════════════════
import { categorize, classifyModule, mentionsDistrict, mentionsOtherState } from "./news-keywords";

// ── Headline text ───────────────────────────────────────────
/**
 * Google News titles end with " - <Publisher>". Only that last part goes:
 * the old job cut at the FIRST " - ", which also cut headlines that contain
 * a dash.
 */
export function stripFeedSuffix(title: string, source?: string | null): string {
  const t = title.trim();
  const src = source?.trim();
  if (src && t.endsWith(` - ${src}`)) return t.slice(0, -(src.length + 3)).trim();
  const i = t.lastIndexOf(" - ");
  return i > 0 ? t.slice(0, i).trim() : t;
}

const INVISIBLE = /[​-‍⁠﻿]/g;

/** "India News | …", "Video | …", "Karnataka News | …": the outlet's section, not the headline. */
const LEADING_KICKER = /^(?:india news|video|videos|photos?|watch|[a-z]+ news)\s*\|\s*/i;

/** A trailing "| …" or " - …" that names the outlet or its section. */
const OUTLET_WORDS =
  /\b(news|times|express|herald|tribune|today|inshorts|tap to know more|explained|live|mint|standard|post|chronicle|hindu|mid-day|ndtv|ani|pti|ians)\b/i;

function isOutletSegment(segment: string, publisher: string | null | undefined): boolean {
  const seg = segment.trim();
  if (!seg || seg.split(/\s+/).length > 5) return false;
  if (publisher && seg.toLowerCase() === publisher.trim().toLowerCase()) return true;
  // A single place word ("| Kolkata", "| Mumbai") is a section tag.
  if (/^[A-Z][a-z]+$/.test(seg)) return true;
  return OUTLET_WORDS.test(seg);
}

/**
 * The headline without invisible characters, leading section kickers and
 * trailing outlet names. Never returns an empty string: if cleaning would
 * leave nothing, the trimmed original is returned.
 */
export function cleanHeadline(raw: string, publisher?: string | null): string {
  let t = raw.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 2 && LEADING_KICKER.test(t); i++) t = t.replace(LEADING_KICKER, "");
  // Strip up to two trailing outlet segments: "… | Tap to know more | Inshorts".
  for (let i = 0; i < 2; i++) {
    const m = /\s+(?:\||-)\s+([^|]+)$/.exec(t);
    if (!m || !isOutletSegment(m[1], publisher)) break;
    t = t.slice(0, m.index).trim();
  }
  t = t.replace(/[\s|:–-]+$/, "").trim();
  return t || raw.trim();
}

/** Words that end a complete headline with a lone letter ("Group D", "Phase B"). */
const LETTER_NAMES = /\b(group|grade|phase|plan|class|type|vitamin|block|sector|wing|gate|line|category|part|section|team|pool|zone|ward|division|form|level|tier|schedule|stage)\s+[a-z]$/i;

/**
 * True when the feed cut the headline short: it ends with "..." or "…", or
 * with a lone letter ("… Sanjay R", "… BJP in T"), or it is exactly 105
 * characters with no closing punctuation — the Google News cut for Times
 * of India headlines ("… on Sion-Panvel highwa").
 */
export function looksTruncated(title: string): boolean {
  const t = title.trim();
  if (/(\.\.\.|…)$/.test(t)) return true;
  if (/\s[b-hj-zB-HJ-Z]$/.test(t) && !LETTER_NAMES.test(t)) return true;
  return t.length === 105 && !/[.!?"'’”)\]]$/.test(t);
}

/** The headline as shown: a cut headline ends with one "…". */
export function displayHeadline(title: string): string {
  const t = title.trim();
  if (!looksTruncated(t)) return t;
  return `${t.replace(/(\.\.\.|…)$/, "").trimEnd()}…`;
}

/**
 * A stored row's headline exactly as the district news list shows it
 * (/api/data/news: newsForDisplay's cleanHeadline, then displayHeadline).
 * The translation job translates THIS text, so the stored translation's
 * sourceHash matches what the list overlays; translating the raw stored
 * title never matched when cleaning changed it (zero-width spaces, "..." →
 * "…", an outlet suffix).
 */
export function newsDisplayTitle(row: { title: string; publisher?: string | null; source?: string | null }): string {
  return displayHeadline(cleanHeadline(row.title, row.publisher ?? row.source));
}

// ── Promotions ──────────────────────────────────────────────
/**
 * Advertorials, daily price pages and travel listicles. They are not civic
 * news; the job does not save them and the list does not show them.
 */
const PROMO_RE = new RegExp(
  [
    String.raw`\branked\s+(?:#|no\.?\s*)?1\b`,
    String.raw`\b(?:gold|silver|petrol|diesel)\s+(?:rate|rates|price|prices)\s+today\b`,
    String.raw`\bplaces\s+you\s+(?:can|must|should)\s+(?:explore|visit)\b`,
    String.raw`\bthings\s+to\s+do\b`,
    String.raw`\bhair\s+(?:restoration|transplant)\b`,
    String.raw`\breal\s+estate\s+(?:companies|hotspots?)\b`,
    String.raw`\bdestination\s+wedding\b`,
    String.raw`\b(?:horoscope|lottery\s+result)s?\b`,
  ].join("|"),
  "i",
);

export function isPromotional(title: string): boolean {
  return PROMO_RE.test(title);
}

// ── Place ───────────────────────────────────────────────────
export interface NewsRowLike {
  title: string;
  summary?: string | null;
  classifiedBy?: string | null;
}

/**
 * A row may be shown for this district when the AI checked its place
 * ("ai:<model>" — the job saves only what the AI says is about the
 * district), or — for a keyword-only row — when it names the district and
 * no other state. That is the rule the job uses to decide whether the AI
 * must check the place (src/scraper/jobs/news.ts), applied to rows saved
 * before it existed.
 */
export function isPlaceChecked(row: NewsRowLike, districtName: string, stateName: string): boolean {
  if (row.classifiedBy && row.classifiedBy.startsWith("ai:")) return true;
  const text = `${row.title} ${row.summary ?? ""}`;
  return mentionsDistrict(text, districtName) && !mentionsOtherState(text, stateName);
}

// ── One district's list ─────────────────────────────────────
export interface NewsDisplayRow extends NewsRowLike {
  publisher?: string | null;
  source?: string | null;
  category?: string | null;
  targetModule?: string | null;
}

/**
 * The rows a district's news list may show, cleaned and in the same order:
 * promotions and keyword-only rows that may be about another place are
 * left out; headlines are cleaned; category (always keyword-based) and a
 * keyword row's page tag follow today's classifier (rows saved by the old
 * substring classifier said "Crop prices" for "Kalaburagi").
 */
export function newsForDisplay<T extends NewsDisplayRow>(
  rows: readonly T[],
  place: { districtName: string; stateName: string },
): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const title = cleanHeadline(row.title, row.publisher ?? row.source);
    if (isPromotional(title)) continue;
    if (!isPlaceChecked({ ...row, title }, place.districtName, place.stateName)) continue;
    const keywordOnly = !row.classifiedBy || row.classifiedBy === "keyword";
    out.push({
      ...row,
      title,
      category: categorize(title),
      ...(keywordOnly ? { targetModule: classifyModule(title) } : {}),
    });
  }
  return out;
}

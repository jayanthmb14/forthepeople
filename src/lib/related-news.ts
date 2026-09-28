/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "Related news" at the foot of a module page (ModuleNews) shows a story
// only when its own English words back the tags it was stored with. Pure,
// unit-tested (tests/government-checks.test.ts).
//
// Why (Sept 2026 audit): stories collected before the news pipeline became
// state-aware stayed tagged to the wrong district or module — Karnataka
// stories under New Delhi's elections and courts, a Tripura story under
// Kolkata's leaders, a Yavatmal blast under Mumbai's police, a college
// reunion under Mysuru's police. The pipeline now checks new stories
// (src/scraper/jobs/news.ts); this check keeps the old ones off the pages.
//
// A story is related when ALL hold:
//   1. it names the district (any alias, whole words);
//   2. it names no other state or UT (a New Delhi story about "Karnataka
//      Congress" is not New Delhi news);
//   3. for modules with a keyword list, it uses one of that module's words
//      ("job mela" is not an elections story).
// 1–2 are the news list's keyword place rule (isPlaceChecked in
// src/lib/news-quality.ts), applied to the text itself even when the AI
// checked the place. Strict on purpose: a missed story costs little, a
// wrong one misleads.
import { MODULE_KEYWORDS, compileKeywords } from "@/lib/news-keywords";
import { isPlaceChecked } from "@/lib/news-quality";

const MODULE_MATCHERS = new Map(MODULE_KEYWORDS.map(([m, kws]) => [m, compileKeywords(kws)] as const));

export interface NewsLike {
  title: string;
  summary?: string | null;
  targetModule?: string | null;
}

/** Whether a stored story may appear as related news for its targetModule in this district. */
export function isRelatedNews(item: NewsLike, districtName: string, stateName: string): boolean {
  if (!item.targetModule || !districtName.trim()) return false;
  // classifiedBy null: the words must name the district, whatever the AI said.
  if (!isPlaceChecked({ title: item.title, summary: item.summary, classifiedBy: null }, districtName, stateName)) return false;
  const words = MODULE_MATCHERS.get(item.targetModule);
  return words ? words.test(`${item.title} ${item.summary ?? ""}`) : true;
}

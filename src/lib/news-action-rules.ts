/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// What the news pipeline may do with one classified article (pure).
//
// executeNewsAction (src/lib/news-action-engine.ts) asks decideNewsAction()
// first. The answer is one of:
//   skip     not about this district, or the classifier is unsure (< 0.60)
//   drop     nothing a person could act on — never queued:
//              • the generic "news" module (482 such items sat pending in
//                Sept 2026, each just a headline);
//              • a "police" item that is not a crime count: transfers,
//                reshuffles, staffing, accidents, lost property … (they
//                were queued as if they were NCRB crime counts)
//   queue    admin review (NewsActionQueue, status "pending"): every
//            leaders / police / power item — news never writes those tables
//            (the Sept 2026 audit found "D K Shivakumar — Chief Minister —
//            BJP" filed under Mumbai, a headline number stored as a crime
//            count) — and anything below 0.85 confidence
//   execute  high-confidence items of the other modules
// ═══════════════════════════════════════════════════════════

/** Modules where a news article must NEVER write straight to the page. */
export const REVIEW_ONLY_MODULES: ReadonlySet<string> = new Set(["police", "leaders", "power"]);

/** The classifier's "does not fit any page" modules: nothing to act on. */
const GENERIC_MODULES: ReadonlySet<string> = new Set(["news", "general", "other", ""]);

/** Words that make a police item a crime (or a crime count). */
const CRIME_RE =
  /theft|thiev|burglar|robber|snatch|murder|homicide|\bkill|assault|attack|hurt|violen|rape|sexual|molest|pocso|harass|stalk|kidnap|abduct|traffick|drug|narcotic|ganja|smuggl|fraud|cheat|scam|cyber|extort|brib|corrupt|dowry|riot|communal|vandal|arson|rowdy|\bgang|syndicate|threat|hoax|counterfeit|forger|gambl|betting|poach|wildlife|cognis|cogniz|offen[cs]|crime|criminal|\bstab|\bshoot|firing|loot|dacoit|embezzl|launder|bootleg|illicit|arms act/;

/** Police news that is not a crime figure, even when a crime word appears. */
const NON_CRIME_RE =
  /transfer|reshuffl|posting|appoint|promot|retire|administrat|staff|personnel|recruit|vacanc|shortage|lost|hiring|political|award|medal|training|awareness|inaugurat|preventive|detention|construction|encroach|accident|traffic(?!k)/;

/** True when a police item's crimeCategory names a crime (not a transfer, staffing or other non-crime news). */
export function isCrimeCategory(category: unknown): boolean {
  if (typeof category !== "string") return false;
  const c = category.toLowerCase().trim();
  if (!c) return false;
  return CRIME_RE.test(c) && !NON_CRIME_RE.test(c);
}

export type NewsActionDecision =
  | { kind: "skip"; reason: "not-about-district" | "low-confidence" }
  | { kind: "drop"; reason: "generic-news" | "not-a-crime" }
  | { kind: "queue"; reason: "review-only" | "mid-confidence" }
  | { kind: "execute" };

export interface NewsActionInput {
  targetModule: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  isAboutDistrict?: boolean;
}

export function decideNewsAction(c: NewsActionInput): NewsActionDecision {
  if (c.isAboutDistrict !== true) return { kind: "skip", reason: "not-about-district" };
  if (!(c.confidence >= 0.6)) return { kind: "skip", reason: "low-confidence" };
  const mod = (c.targetModule ?? "").trim().toLowerCase();
  if (GENERIC_MODULES.has(mod)) return { kind: "drop", reason: "generic-news" };
  if (mod === "police" && !isCrimeCategory(c.extractedData?.crimeCategory)) return { kind: "drop", reason: "not-a-crime" };
  if (REVIEW_ONLY_MODULES.has(mod)) return { kind: "queue", reason: "review-only" };
  if (c.confidence < 0.85) return { kind: "queue", reason: "mid-confidence" };
  return { kind: "execute" };
}

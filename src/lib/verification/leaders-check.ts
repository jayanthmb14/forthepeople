/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Leaders check — the comparison part (pure)
//
// For one state office (e.g. Chief Minister of Karnataka) we have:
//   - what we show (a Leader row per district),
//   - what the state's Wikipedia infobox says (WikiPerson[]),
//   - what Wikidata says (holder names + start date).
// officeChecks() turns that into two SourceChecks; decideStatus() in
// compare.ts gives the verdict ("verified" only when BOTH agree with us).
// ═══════════════════════════════════════════════════════════
import { fmtDay, namesMatchAny, nameTokens } from "./compare";
import type { SourceCheck } from "./types";
import type { WikiPerson } from "./wiki";

export const WIKIPEDIA_SOURCE = "Wikipedia";
export const WIKIDATA_SOURCE = "Wikidata";

/** What Wikidata says about one office: every spelling of every current holder. */
export interface WikidataOfficeAnswer {
  holders: Array<{ qid: string; names: string[]; start: Date | null }>;
  /** "P6" / "P35" on the state item, or "P39" (position held, via SPARQL). */
  via: string;
}

/** All spellings to compare with, from the infobox entries (display text and link title). */
export function wikipediaNames(people: readonly WikiPerson[]): string[] {
  return [...new Set(people.flatMap((p) => [p.name, p.link ?? ""]).map((s) => s.replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean))];
}

/** The best display name of a Wikidata holder: the first latin spelling. */
export function displayName(names: readonly string[]): string {
  return names.find((n) => nameTokens(n).length > 0) ?? names[0] ?? "?";
}

export function wikipediaUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

export function wikidataUrl(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

/**
 * The two outside checks for one stored name.
 *  - Wikipedia: undefined = the article could not be read or does not
 *    mention the office; [] = the office field is empty. Both count as
 *    "no answer" (agreed null), never as a disagreement.
 *  - Wikidata: undefined or no holders = "no answer".
 */
export function officeChecks(
  storedName: string,
  wiki: { people: readonly WikiPerson[] | undefined; url: string | null },
  wd: WikidataOfficeAnswer | undefined,
): SourceCheck[] {
  const wpNames = wiki.people ? wikipediaNames(wiki.people) : [];
  const wpCheck: SourceCheck = {
    source: WIKIPEDIA_SOURCE,
    value: wiki.people && wiki.people.length > 0 ? wiki.people.map((p) => p.name).join(", ") : null,
    agreed: wpNames.length > 0 ? namesMatchAny(storedName, wpNames) : null,
    independent: true,
    url: wiki.url,
    asOf: null,
  };

  const holders = wd?.holders ?? [];
  const wdNames = holders.flatMap((h) => h.names);
  const starts = holders.map((h) => h.start).filter((d): d is Date => d !== null);
  const newestStart = starts.length ? new Date(Math.max(...starts.map((d) => d.getTime()))) : null;
  const wdCheck: SourceCheck = {
    source: WIKIDATA_SOURCE,
    value: holders.length > 0 ? holders.map((h) => displayName(h.names)).join(", ") : null,
    agreed: wdNames.length > 0 ? namesMatchAny(storedName, wdNames) : null,
    independent: true,
    url: holders.length > 0 ? wikidataUrl(holders[0].qid) : null,
    asOf: newestStart ? newestStart.toISOString() : null,
  };
  return [wpCheck, wdCheck];
}

/** True when both outside sources answered and name the same person (so a suggestion is safe to show). */
export function sourcesAgreeWithEachOther(checks: readonly SourceCheck[], wikiPeople: readonly WikiPerson[] | undefined, wd: WikidataOfficeAnswer | undefined): boolean {
  if (!wikiPeople || wikiPeople.length === 0 || !wd || wd.holders.length === 0) return false;
  if (checks.some((c) => c.value === null)) return false;
  const wpNames = wikipediaNames(wikiPeople);
  return wd.holders.every((h) => h.names.some((n) => namesMatchAny(n, wpNames)));
}

/** One line for the admin, e.g. "Chief Minister of Karnataka: we show Siddaramaiah; Wikipedia: D. K. Shivakumar; Wikidata: D. K. Shivakumar (since 3 Jun 2026)". */
export function mismatchHeadline(office: string, shown: string, checks: readonly SourceCheck[]): string {
  const parts = checks.map((c) => {
    const since = c.asOf ? ` (since ${fmtDay(new Date(c.asOf))})` : "";
    return `${c.source}: ${c.value ?? "no answer"}${c.value ? since : ""}`;
  });
  return `${office}: we show ${shown}; ${parts.join("; ")}`.slice(0, 300);
}

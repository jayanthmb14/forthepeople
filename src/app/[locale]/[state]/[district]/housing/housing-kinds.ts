/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { LucideIcon } from "lucide-react";
import { Building, Building2, House } from "lucide-react";

// Plain helpers for the Housing schemes page.
//
// A housing row only carries a name, a year and counts. To say WHAT a
// scheme gives, WHO can get it and WHERE it runs, the page:
//   1. reads the family of the scheme from its name (PMAY-G, PMAY-U, a
//      state scheme, a city project) — nothing is guessed beyond the name;
//   2. looks for the same scheme in the district's scheme list (Scheme
//      table, category "Housing"), which holds the published amount,
//      eligibility, level and apply link;
//   3. falls back to one plain, well-known sentence per family (message
//      keys page_housing.family.<family>.*) with the official website.
// Every word a reader sees is a message key; this file only picks keys.

export type Family = "pmayg" | "pmayu" | "state" | "city" | "other";
export type Where = "india" | "state" | "local";

/** Brand words shared by a housing row and a scheme-list row of the same scheme. */
const BRANDS: Array<[string, RegExp]> = [
  ["pmayg", /pmay[\s-]*\(?g\b|pmay[\s-]*gramin|awaa?s\s+yojana\s*[-—(]*\s*(gramin|rural)|rural housing/],
  ["pmayu", /pmay[\s-]*\(?u\b|pmay[\s-]*urban|awaa?s\s+yojana\s*[-—(]*\s*(urban|shahari)|housing for all/],
  ["rgrhcl", /rgrhcl|rajiv gandhi\b.*\b(housing|gruha|nirmana)/],
  ["basava", /basava/],
  ["ambedkar", /ambedkar/],
  ["ramai", /ramai/],
  ["gharkul", /gharkul/],
  ["2bhk", /2\s*bhk|double bedroom/],
  ["indiramma", /indiramma/],
  ["bbmp", /\bbbmp\b/],
  ["bda", /\bbda\b|nadaprabhu|kempegowda layout/],
  ["dda", /\bdda\b/],
  ["mhada", /mhada/],
];

/** The scheme's brand key ("pmayg", "rgrhcl" …) or null. */
export function brandOf(name: string): string | null {
  const n = name.toLowerCase();
  for (const [k, re] of BRANDS) if (re.test(n)) return k;
  return null;
}

const STATE_WORDS = /rgrhcl|rajiv gandhi|basava|ambedkar|gharkul|ramai|2\s*bhk|double bedroom|indiramma|ashraya|devaraj|housing (board|corporation)/;
const CITY_WORDS = /\bbbmp\b|\bbda\b|\bdda\b|mhada|cidco|municipal|slum|layout|development authority|nagar nigam/;

/** Family of a housing scheme, from its name. */
export function familyOf(name: string): Family {
  const b = brandOf(name);
  if (b === "pmayg") return "pmayg";
  if (b === "pmayu") return "pmayu";
  const n = name.toLowerCase();
  if (STATE_WORDS.test(n)) return "state";
  if (CITY_WORDS.test(n)) return "city";
  return "other";
}

/** Where a family runs, when the name alone says so. */
export function whereOfFamily(f: Family): Where | null {
  if (f === "pmayg" || f === "pmayu") return "india";
  if (f === "state") return "state";
  if (f === "city") return "local";
  return null;
}

/** A scheme-list level ("Central", "STATE", "District" …) → where it runs, or null. */
export function whereOfLevel(level: string | null | undefined): Where | null {
  const l = (level ?? "").trim().toLowerCase();
  if (l.startsWith("central") || l === "centre" || l === "center" || l.startsWith("national")) return "india";
  if (l.startsWith("state")) return "state";
  if (l.startsWith("district") || l.startsWith("local") || l.startsWith("municipal") || l.startsWith("city") || l.startsWith("zilla")) return "local";
  return null;
}

/** A small line icon per kind of housing scheme (v5: no emoji). */
export const FAMILY_ICON: Record<Family, LucideIcon> = {
  pmayg: House,
  pmayu: Building,
  state: House,
  city: Building2,
  other: House,
};

/** Official website per family, for "check your name / apply" when the scheme list has no link. */
export const FAMILY_SITE: Partial<Record<Family, string>> = {
  pmayg: "https://pmayg.nic.in",
  pmayu: "https://pmay-urban.gov.in",
};

/**
 * Is a scheme-list row about housing? The category decides when it has
 * one ("Gruha Lakshmi" is a cash scheme, not a house); a row with no
 * useful category counts only when its name is a known housing scheme.
 */
export function isHousingScheme(category: string | null | undefined, name: string): boolean {
  const c = (category ?? "").trim().toLowerCase();
  if (/hous|shelter/.test(c)) return true;
  if (c && !/^(other|general|misc)/.test(c)) return false;
  return /pmay|awaa?s yojana|gharkul|2\s*bhk/.test(name.toLowerCase());
}

/**
 * The steps of a scheme, as message-key suffixes of page_housing.how.*.
 * PMAY-G does not take applications: names come from the Awaas+ survey
 * list and the Gram Sabha checks them. Everything else starts with an
 * application.
 */
export function stepsOf(f: Family): string[] {
  return f === "pmayg" ? ["list", "gramSabha", "sanction", "build", "money"] : ["apply", "survey", "sanction", "build", "money"];
}


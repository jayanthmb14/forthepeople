/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Scheme amounts: what the number means (a month? a year? once? a loan?)
// ═══════════════════════════════════════════════════════════════════════
//  Scheme.amount is one number with no unit. The page used to print it
//  bare ("₹3,000 in work support" for a monthly allowance, "Biggest benefit
//  ₹20,00,000" for a Mudra loan ceiling) — Sept 2026 audit. Until the table
//  has a unit column, the unit comes from this reviewed list, matched on
//  the scheme name. A scheme not on the list shows no amount (its published
//  words instead): an amount without its period is not shown.
//  Tested in tests/amount-basis.test.ts.

export type AmountBasis = "perMonth" | "perYear" | "oneTime" | "coverYear" | "loanUpTo" | "pensionMonth";

/** [basis, name pattern, source that fixes the unit]. First match wins. */
const RULES: Array<[AmountBasis, RegExp, string]> = [
  // Health cover per family per year.
  ["coverYear", /pm-?jay|ayushman|jan arogya|cmchis|comprehensive health insurance|swasthya sathi|aarogyasri/i, "cover per family per year: pmjay.gov.in, jeevandayee.gov.in (GR 28 Jul 2023)"],
  // Loans: the amount is a ceiling, not money given.
  ["loanUpTo", /mudra|vishwakarma|svanidhi|stand-?up india/i, "loan ceilings under each scheme's rules"],
  // Pension paid monthly from age 60.
  ["pensionMonth", /atal pension/i, "guaranteed monthly pension from age 60"],
  // Paid every month.
  ["perMonth", /ladki bahin|magalir urimai|gruha lakshmi|griha lakshmi|yuva nidhi|moovalur|pudhumai penn|annapurna bhandar/i, "monthly transfers; Pudhumai Penn: tnsocialwelfare.tn.gov.in (Rs 1,000 a month)"],
  // Paid every year.
  ["perYear", /pm-?kisan/i, "pmkisan.gov.in: Rs 6,000 a year in three instalments"],
  // Paid once.
  ["oneTime", /kanyashree|kalyana lakshmi|shadi mubarak|ujjwala|pmay|awas yojana|indiramma indlu/i, "one-time grants (Kanyashree K2, Ujjwala connection, PMAY house); Indiramma Indlu: kamareddy.telangana.gov.in"],
];

/** The unit of a scheme's amount, from its name; null when it is not on the reviewed list. */
export function amountBasis(name: string | null | undefined): AmountBasis | null {
  const n = (name ?? "").trim();
  if (!n) return null;
  for (const [basis, re] of RULES) if (re.test(n)) return basis;
  return null;
}

/**
 * The largest benefit worth comparing on the "Biggest benefit" tile: the
 * amount must have a known unit and must not be a loan ceiling.
 */
export function biggestBenefit<T extends { name: string; amount?: number | null }>(schemes: T[]): { scheme: T; basis: AmountBasis } | null {
  let best: { scheme: T; basis: AmountBasis } | null = null;
  for (const s of schemes) {
    const basis = amountBasis(s.name);
    if (!basis || basis === "loanUpTo" || !s.amount || s.amount <= 0) continue;
    if (!best || s.amount > (best.scheme.amount ?? 0)) best = { scheme: s, basis };
  }
  return best;
}

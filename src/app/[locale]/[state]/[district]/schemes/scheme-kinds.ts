/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Plain helpers for the schemes page: which KIND of help a scheme is
// (from its category and name), who it is for (keywords in the published
// eligibility text), the usual steps and documents for that kind, and
// where it runs (central / state / local). Nothing here invents a fact
// about a scheme: kinds, audiences and levels are read from the stored
// text, and steps / documents are the usual ones for that kind of help,
// shown on the page as "usually" with a pointer to the official site.
// Every label is a message key in "page_schemes".

/** The kind of help, used for the emoji, the "what you get" line, the steps and the documents. */
export type SchemeKind =
  | "health"
  | "housing"
  | "education"
  | "farm"
  | "women"
  | "jobs"
  | "food"
  | "water"
  | "energy"
  | "pension"
  | "business"
  | "transport"
  | "other";

const KIND_RULES: Array<[SchemeKind, RegExp]> = [
  ["health", /insurance|health|medical|hospital|arogya|pm-?jay|ayushman/],
  ["housing", /hous|shelter|awas|gharkul|pmay|gruha|griha/],
  ["education", /educat|school|scholar|student|vidya/],
  ["farm", /agri|farm|kisan|crop|fisher|krishi|raitha|dairy|horticult/],
  ["women", /women|woman|child|girl|mother|ladki|matru|mahila|mangala/],
  ["jobs", /employ|job|livelihood|skill|nrega|rozgar/],
  ["food", /food|nutrition|ration|anna/],
  ["water", /water|sanitation|toilet|jal |jal$|jal-|swachh/],
  ["energy", /lpg|gas|electric|energy|power|solar|ujjwala|jyothi/],
  ["pension", /pension|social|welfare|security|disab|senior|old age|widow/],
  ["business", /msme|artisan|industry|business|mudra|loan|financ|saving|bank|startup|touris/],
  ["transport", /transport|bus|travel|shakti/],
];

/** Kind from the category first (it is the cleaner field), then the name. */
export function schemeKind(category: string | null | undefined, name?: string | null): SchemeKind {
  const c = (category ?? "").toLowerCase();
  for (const [k, re] of KIND_RULES) if (re.test(c)) return k;
  const n = (name ?? "").toLowerCase();
  for (const [k, re] of KIND_RULES) if (re.test(n)) return k;
  return "other";
}

export const KIND_EMOJI: Record<SchemeKind, string> = {
  health: "🏥",
  housing: "🏠",
  education: "🎓",
  farm: "🌾",
  women: "👩‍👧",
  jobs: "💼",
  food: "🍚",
  water: "💧",
  energy: "🔥",
  pension: "🤝",
  business: "🏦",
  transport: "🚌",
  other: "📋",
};

/** "Women & Child Development" → "womenandchilddevelopment" (message key for a category word). */
export function catKey(category: string): string {
  return category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

/** Scheme names compared without case, spaces or punctuation (same rule as /api/data/scheme-coverage). */
export function schemeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type LevelKey = "central" | "state" | "local";

/** Scheme level ("Central", "STATE", "District", …) → key, or null when unknown. */
export function levelKey(level: string | null | undefined): LevelKey | null {
  const l = (level ?? "").trim().toLowerCase();
  if (l.startsWith("central") || l === "centre" || l === "center" || l.startsWith("national") || l.startsWith("central-state")) return "central";
  if (l.startsWith("state")) return "state";
  if (l.startsWith("local") || l.startsWith("district") || l.startsWith("municipal") || l.startsWith("zilla")) return "local";
  return null;
}

export const LEVEL_EMOJI: Record<LevelKey, string> = { central: "🇮🇳", state: "🏛️", local: "📍" };

/**
 * Many rows pack "who — what" into eligibility ("BPL families — ₹5 lakh
 * annual health cover"). Split on the first long dash so the page can show
 * who it is for and what it gives separately. Text stays as published.
 */
export function splitEligibility(text: string | null | undefined): { who: string | null; what: string | null } {
  if (!text) return { who: null, what: null };
  const s = text.trim();
  const m = s.match(/^(.+?)\s+[—–]\s+(.+)$/);
  if (m) return { who: m[1].trim(), what: m[2].trim() };
  return { who: s, what: null };
}

/** Who a scheme is for, as translatable keys (page_schemes.aud.<key>), from words in the published text. */
export type Audience =
  | "farmers"
  | "fishers"
  | "women"
  | "children"
  | "students"
  | "scst"
  | "obc"
  | "lowIncome"
  | "seniors"
  | "disabled"
  | "rural"
  | "urban"
  | "noHome"
  | "youth"
  | "workers"
  | "business"
  | "residents"
  | "everyone";

const AUD_RULES: Array<[Audience, RegExp]> = [
  ["farmers", /farmer|kisan|cultivat|agricultur/],
  ["fishers", /fisher/],
  ["women", /women|woman|girl|mother|female|widow/],
  ["children", /child|infant/],
  ["students", /student|scholar|matric/],
  ["scst", /\bsc\b|\bst\b|sc\/st|scheduled caste|scheduled tribe/],
  ["obc", /\bobc\b|backward class/],
  ["lowIncome", /\bbpl\b|below poverty|poor|\bews\b|\blig\b|income below|annual (family )?income|low[- ]income|ration card|antyodaya|secc/],
  ["seniors", /senior|elderly|old age|aged 60|60 years|above 60/],
  ["disabled", /disab|divyang|handicap/],
  ["rural", /rural|village|gramin/],
  ["urban", /urban|city|town/],
  ["noHome", /without (a )?pucc?a|without (a )?pukka|homeless|kutcha|no house/],
  ["youth", /youth|unemploy|job seeker|graduate/],
  ["workers", /worker|labour|labor|construction/],
  ["business", /artisan|msme|entrepreneur|business|vendor|weaver/],
  ["residents", /domicile|resident/],
  ["everyone", /^all\b|all households|all citizens|every family|all families/],
];

export function audiences(text: string | null | undefined): Audience[] {
  const s = (text ?? "").toLowerCase();
  if (!s) return [];
  const out: Audience[] = [];
  for (const [k, re] of AUD_RULES) if (re.test(s)) out.push(k);
  // "All farmer families" is still for farmers, not for everyone.
  if (out.length > 1) return out.filter((a) => a !== "everyone");
  return out;
}

export const AUD_EMOJI: Record<Audience, string> = {
  farmers: "🌾",
  fishers: "🎣",
  women: "👩",
  children: "🧒",
  students: "🎓",
  scst: "🤝",
  obc: "🤝",
  lowIncome: "💵",
  seniors: "👴",
  disabled: "♿",
  rural: "🏡",
  urban: "🏙️",
  noHome: "🏠",
  youth: "🧑",
  workers: "👷",
  business: "🧵",
  residents: "📍",
  everyone: "👨‍👩‍👧",
};

/** The usual steps for this kind of help (page_schemes.step.<key>). */
export function stepsFor(kind: SchemeKind, name?: string | null): Array<{ emoji: string; key: string }> {
  const insurance = /insurance|pm-?jay|ayushman|arogya|jeevandayee/i.test(name ?? "");
  switch (kind) {
    case "health":
      return insurance
        ? [
            { emoji: "🪪", key: "getCard" },
            { emoji: "🏥", key: "goHospital" },
            { emoji: "🔎", key: "cardChecked" },
            { emoji: "✅", key: "treatmentPaid" },
          ]
        : [
            { emoji: "🏥", key: "visitCentre" },
            { emoji: "🔎", key: "check" },
            { emoji: "✅", key: "careGiven" },
          ];
    case "housing":
      return [
        { emoji: "📝", key: "apply" },
        { emoji: "🔎", key: "survey" },
        { emoji: "✅", key: "approved" },
        { emoji: "🧱", key: "stages" },
        { emoji: "🏠", key: "home" },
      ];
    case "education":
      return [
        { emoji: "📝", key: "applyPortal" },
        { emoji: "🏫", key: "schoolChecks" },
        { emoji: "✅", key: "approved" },
        { emoji: "💰", key: "moneyBank" },
      ];
    case "water":
      return [
        { emoji: "🗣️", key: "askPanchayat" },
        { emoji: "🔎", key: "survey" },
        { emoji: "🚰", key: "tapFitted" },
      ];
    case "food":
      return [
        { emoji: "🪪", key: "rationCard" },
        { emoji: "🏪", key: "rationShop" },
        { emoji: "🍚", key: "getGrain" },
      ];
    case "jobs":
      return [
        { emoji: "📝", key: "register" },
        { emoji: "🙋", key: "askWork" },
        { emoji: "👷", key: "work" },
        { emoji: "💰", key: "wagesBank" },
      ];
    case "business":
      return [
        { emoji: "📝", key: "applyBank" },
        { emoji: "🔎", key: "check" },
        { emoji: "✅", key: "approved" },
        { emoji: "💰", key: "moneyReleased" },
      ];
    case "transport":
      return [
        { emoji: "🪪", key: "showId" },
        { emoji: "🚌", key: "travel" },
      ];
    case "farm":
    case "women":
    case "pension":
    case "energy":
      return [
        { emoji: "📝", key: "apply" },
        { emoji: "🔎", key: "papersChecked" },
        { emoji: "✅", key: "approved" },
        { emoji: "💰", key: "moneyBank" },
      ];
    default:
      return [
        { emoji: "📝", key: "apply" },
        { emoji: "🔎", key: "check" },
        { emoji: "✅", key: "approved" },
        { emoji: "🎁", key: "benefit" },
      ];
  }
}

/** Documents usually asked for with this kind of help (page_schemes.doc.<key>). */
export function docsFor(kind: SchemeKind): string[] {
  switch (kind) {
    case "health":
      return ["aadhaar", "ration"];
    case "housing":
      return ["aadhaar", "ration", "income", "address", "bank"];
    case "education":
      return ["aadhaar", "casteIncome", "marks", "feeReceipt", "bank"];
    case "farm":
      return ["aadhaar", "land", "bank"];
    case "women":
      return ["aadhaar", "ration", "age", "bank"];
    case "jobs":
      return ["aadhaar", "jobCard", "bank", "photo"];
    case "food":
      return ["aadhaar", "ration"];
    case "water":
      return ["aadhaar", "address"];
    case "energy":
      return ["aadhaar", "ration", "bank"];
    case "pension":
      return ["aadhaar", "age", "income", "bank"];
    case "business":
      return ["aadhaar", "pan", "businessProof", "bank"];
    case "transport":
      return ["aadhaar", "photo"];
    default:
      return ["aadhaar", "bank"];
  }
}

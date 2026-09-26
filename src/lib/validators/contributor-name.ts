/**
 * Clean contributor/supporter/suggestion name validator.
 *
 * Allowed: Unicode letters (Latin, Devanagari, Tamil, Kannada, Malayalam,
 * Bengali, Gurmukhi, Gujarati, Telugu, etc.), spaces, hyphens, apostrophes,
 * periods. Max 40 chars, min 2.
 *
 * Rejected: digits, pipes/slashes, promotional symbols (%, ₹, @),
 * emojis, URLs, phone-number patterns, "Since YYYY", explicit "p.a"/"p.m"
 * abbreviations with dots (to avoid false-positives on names like Anupam / Deepak).
 *
 * Used by: POST /api/payment/verify (supporter create), admin manual supporter
 * create, POST /api/suggestions (community suggestion submit), supporter
 * cleanup script.
 */

// \p{M} (combining marks) is required alongside \p{L}: Indic vowel signs /
// matras (e.g. the ಿ in ರವಿ, the ा in राम) are marks, not letters, so
// without it every Indic name that uses one was rejected (fixed 2026-09-27).
const NAME_REGEX = /^[\p{L}\p{M}\s.\-']+$/u;
const MAX_LEN = 40;
const MIN_LEN = 2;

const SPAM_PATTERNS: Array<{ pattern: RegExp; note: string }> = [
  { pattern: /since\s+\d{4}/i, note: "since-year" },
  { pattern: /\d+\s*%/, note: "percent" },
  // Require literal "p.a" / "p.m" with at least one dot OR preceded by whitespace/start.
  // Catches "14.5% p.a" but NOT "Anupam" or "Deepak".
  { pattern: /\bp\.a\.?\b/i, note: "p.a-abbrev" },
  { pattern: /\bp\.m\.?\b/i, note: "p.m-abbrev" },
  { pattern: /per\s+annum/i, note: "per-annum" },
  { pattern: /\bcall\s+\d/i, note: "call-phone" },
  { pattern: /whatsapp/i, note: "whatsapp" },
  { pattern: /\bcontact\b/i, note: "contact-word" },
  { pattern: /https?:\/\//i, note: "url" },
  { pattern: /www\./i, note: "www" },
  { pattern: /\.com\b|\.in\b|\.org\b/i, note: "tld" },
  { pattern: /\b\d{10}\b/, note: "10-digit-phone" },
  { pattern: /\+\d{2,3}/, note: "country-code" },
];

// Business-name suffix rejection (added 2026-04-25).
// Catches "SML Finance", "Globex Corp", "Apex Ventures" etc. in the name
// field. Preserves false-positive-free matching on common first names by
// requiring a word boundary + full-word match.
const BUSINESS_SUFFIXES = /\b(finance|financials|ltd|limited|pvt|corp|corporation|inc|incorporated|llc|company|enterprises|services|solutions|technologies|industries|associates|agency|holdings|ventures|capital|bank|insurance|advisory|consultancy|consultants)\b/i;

export type NameValidationResult =
  | { ok: true; cleaned: string }
  | { ok: false; reason: string };

export function validateContributorName(input: unknown): NameValidationResult {
  if (typeof input !== "string") {
    return { ok: false, reason: "Name must be text." };
  }
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (trimmed.length < MIN_LEN) {
    return { ok: false, reason: `Name must be at least ${MIN_LEN} characters.` };
  }
  if (trimmed.length > MAX_LEN) {
    return { ok: false, reason: `Name must be under ${MAX_LEN} characters.` };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return {
      ok: false,
      reason: "Name can only contain letters, spaces, hyphens, apostrophes, and periods.",
    };
  }
  if (BUSINESS_SUFFIXES.test(trimmed)) {
    return {
      ok: false,
      reason: "Please enter a personal name (first + last), not a business name.",
    };
  }
  for (const { pattern } of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        ok: false,
        reason:
          "Please enter your name only — no phone numbers, business names, or promotional text.",
      };
    }
  }

  return { ok: true, cleaned: trimmed };
}

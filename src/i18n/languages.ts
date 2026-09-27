/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Language registry — the ONE list of languages the site knows about
// ═══════════════════════════════════════════════════════════════════════
//  English plus the 22 languages of the Eighth Schedule of the
//  Constitution. Everything else (routing, the language menu, <html dir>,
//  number/date formatting, hreflang, sitemap) is derived from this list.
//
//  To switch a language on: add src/dictionaries/<code>.json (any keys it
//  lacks fall back to English), then change its `status` to "beta" or
//  "live". Full checklist: docs/I18N.md.
//
//  status:
//    live     complete translation, listed in the language menu
//    beta     partly translated (English fills the gaps), listed with a
//             "beta" tag
//    planned  not routed; /<code>/… redirects to English (src/proxy.ts)

export type LanguageStatus = "live" | "beta" | "planned";

export interface Language {
  /** URL segment and message-file name (BCP-47 language subtag). */
  code: string;
  /** Name in English. */
  english: string;
  /** Name in its own script — what the language menu shows. */
  native: string;
  /** Writing system; decides the font stack (globals.css :lang rules). */
  script:
    | "Latin" | "Devanagari" | "Bengali" | "Gujarati" | "Gurmukhi" | "Kannada" | "Malayalam"
    | "Odia" | "Tamil" | "Telugu" | "Arabic" | "OlChiki" | "MeeteiMayek";
  dir: "ltr" | "rtl";
  /** Locale for Intl number/date formatting (Indian digit grouping). */
  intl: string;
  status: LanguageStatus;
}

export const LANGUAGES: readonly Language[] = [
  { code: "en",  english: "English",   native: "English",    script: "Latin",       dir: "ltr", intl: "en-IN",  status: "live" },
  { code: "kn",  english: "Kannada",   native: "ಕನ್ನಡ",       script: "Kannada",     dir: "ltr", intl: "kn-IN",  status: "beta" },
  { code: "hi",  english: "Hindi",     native: "हिन्दी",        script: "Devanagari",  dir: "ltr", intl: "hi-IN",  status: "planned" },
  { code: "ta",  english: "Tamil",     native: "தமிழ்",        script: "Tamil",       dir: "ltr", intl: "ta-IN",  status: "planned" },
  { code: "te",  english: "Telugu",    native: "తెలుగు",       script: "Telugu",      dir: "ltr", intl: "te-IN",  status: "planned" },
  { code: "mr",  english: "Marathi",   native: "मराठी",        script: "Devanagari",  dir: "ltr", intl: "mr-IN",  status: "planned" },
  { code: "bn",  english: "Bengali",   native: "বাংলা",        script: "Bengali",     dir: "ltr", intl: "bn-IN",  status: "planned" },
  { code: "gu",  english: "Gujarati",  native: "ગુજરાતી",      script: "Gujarati",    dir: "ltr", intl: "gu-IN",  status: "planned" },
  { code: "ml",  english: "Malayalam", native: "മലയാളം",      script: "Malayalam",   dir: "ltr", intl: "ml-IN",  status: "planned" },
  { code: "pa",  english: "Punjabi",   native: "ਪੰਜਾਬੀ",       script: "Gurmukhi",    dir: "ltr", intl: "pa-IN",  status: "planned" },
  { code: "or",  english: "Odia",      native: "ଓଡ଼ିଆ",        script: "Odia",        dir: "ltr", intl: "or-IN",  status: "planned" },
  { code: "as",  english: "Assamese",  native: "অসমীয়া",      script: "Bengali",     dir: "ltr", intl: "as-IN",  status: "planned" },
  { code: "ur",  english: "Urdu",      native: "اردو",        script: "Arabic",      dir: "rtl", intl: "ur-IN",  status: "planned" },
  { code: "mai", english: "Maithili",  native: "मैथिली",       script: "Devanagari",  dir: "ltr", intl: "mai-IN", status: "planned" },
  { code: "sa",  english: "Sanskrit",  native: "संस्कृतम्",      script: "Devanagari",  dir: "ltr", intl: "sa-IN",  status: "planned" },
  { code: "ne",  english: "Nepali",    native: "नेपाली",       script: "Devanagari",  dir: "ltr", intl: "ne-IN",  status: "planned" },
  { code: "kok", english: "Konkani",   native: "कोंकणी",       script: "Devanagari",  dir: "ltr", intl: "kok-IN", status: "planned" },
  { code: "sd",  english: "Sindhi",    native: "سنڌي",        script: "Arabic",      dir: "rtl", intl: "sd-IN",  status: "planned" },
  { code: "doi", english: "Dogri",     native: "डोगरी",        script: "Devanagari",  dir: "ltr", intl: "doi-IN", status: "planned" },
  { code: "ks",  english: "Kashmiri",  native: "کٲشُر",        script: "Arabic",      dir: "rtl", intl: "ks-IN",  status: "planned" },
  { code: "mni", english: "Manipuri",  native: "ꯃꯤꯇꯩꯂꯣꯟ",     script: "MeeteiMayek", dir: "ltr", intl: "mni-IN", status: "planned" },
  { code: "brx", english: "Bodo",      native: "बड़ो",          script: "Devanagari",  dir: "ltr", intl: "brx-IN", status: "planned" },
  { code: "sat", english: "Santali",   native: "ᱥᱟᱱᱛᱟᱲᱤ",      script: "OlChiki",     dir: "ltr", intl: "sat-IN", status: "planned" },
] as const;

export const DEFAULT_LOCALE = "en";

/** Codes that get routes (/<code>/…): live + beta. */
export const ROUTED_LOCALES = LANGUAGES.filter((l) => l.status !== "planned").map((l) => l.code);

/** Codes that exist but are not switched on yet; the proxy redirects them to English. */
export const PLANNED_LOCALES = LANGUAGES.filter((l) => l.status === "planned").map((l) => l.code);

export function getLanguage(code: string | null | undefined): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Intl locale for formatting numbers and dates in a UI language. */
export function intlLocale(code: string | null | undefined): string {
  return getLanguage(code).intl;
}

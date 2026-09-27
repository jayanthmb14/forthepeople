/**
 * ForThePeople.in — self-hosted fonts.
 *
 * WHY THIS FILE EXISTS
 * Until September 2026 the fonts were loaded through `next/font/google`,
 * which downloads the font files from Google at BUILD time. On 26 Sep 2026
 * Vercel's build container could not complete that download and every
 * build failed with "next/font/google queries have exactly one entry",
 * even though the same commit built fine locally. Self-hosting removes the
 * build-time network dependency, stops shipping visitor IPs to Google,
 * and makes builds reproducible.
 *
 * The .woff2 files in src/fonts/ are the exact files Google Fonts serves
 * (variable fonts, one file per script subset). Licences: Plus Jakarta Sans,
 * JetBrains Mono, Cormorant Garamond and the Noto family are all SIL Open
 * Font License 1.1 — redistribution in this repo is permitted.
 *
 * HOW TO USE
 * import { plusJakarta, jetBrains, ... } from "@/lib/fonts" in src/app/layout.tsx
 * and put the `.variable` class names on <html>, exactly as before. The CSS
 * variable names are unchanged, so globals.css needs no edits.
 */
import localFont from "next/font/local";

export const plusJakarta = localFont({
  variable: "--font-plus-jakarta",
  display: "swap",
  src: [
    { path: "../fonts/plus-jakarta-sans-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-ext.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-italic.woff2", weight: "200 800", style: "italic" },
    { path: "../fonts/plus-jakarta-sans-latin-ext-italic.woff2", weight: "200 800", style: "italic" },
  ],
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Design v5 "Calm": Plus Jakarta Sans (above) is the face for everything —
// text, headings, numbers. Bricolage Grotesque is used for ONE thing only:
// the H1 of a page (`--ftp-font-h1`, `.ftp-h1`, `.ftp-page-title`). Variable
// weight 200–800 with optical sizing. Licence: SIL OFL 1.1.
export const bricolage = localFont({
  variable: "--font-bricolage",
  display: "swap",
  src: [
    { path: "../fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/bricolage-grotesque-latin-ext.woff2", weight: "200 800", style: "normal" },
  ],
  fallback: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
});

// JetBrains Mono: code-like text only (admin tools, IDs). Citizen-facing
// numbers use Plus Jakarta with tabular figures (`.ftp-num`).
export const jetBrains = localFont({
  variable: "--font-jetbrains",
  display: "swap",
  src: [
    { path: "../fonts/jetbrains-mono-latin.woff2", weight: "100 800", style: "normal" },
    { path: "../fonts/jetbrains-mono-latin-ext.woff2", weight: "100 800", style: "normal" },
  ],
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Heritage display serif — India hero H1, constitutional motto, language rotator only.
export const cormorant = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond-latin.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-ext.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-italic.woff2", weight: "300 700", style: "italic" },
    { path: "../fonts/cormorant-garamond-latin-ext-italic.woff2", weight: "300 700", style: "italic" },
  ],
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Regional scripts. Each family ships its script glyphs plus Latin so a
// mixed line (e.g. "ಮಂಡ್ಯ · Mandya") renders from one face.
//
// Preloading follows the routed languages (docs/I18N.md §4): Kannada and
// Devanagari (Hindi, beta) are preloaded; Tamil, Bengali and Telugu are
// not until their languages are switched on. A family is only USED where a
// stylesheet names its variable, e.g. `:lang(hi) { font-family:
// var(--font-plus-jakarta), var(--font-noto-devanagari), sans-serif }`
// (the :lang() stack in globals.css).
export const notoKannada = localFont({
  variable: "--font-noto-kannada",
  display: "swap",
  src: [
    { path: "../fonts/noto-sans-kannada-kannada.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/noto-sans-kannada-latin.woff2", weight: "100 900", style: "normal" },
  ],
  fallback: ["Noto Sans Kannada", "sans-serif"],
});

export const notoDevanagari = localFont({
  variable: "--font-noto-devanagari",
  display: "swap",
  src: [
    { path: "../fonts/noto-sans-devanagari-devanagari.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/noto-sans-devanagari-latin.woff2", weight: "100 900", style: "normal" },
  ],
  fallback: ["Noto Sans Devanagari", "sans-serif"],
});

export const notoTamil = localFont({
  variable: "--font-noto-tamil",
  display: "swap",
  src: [
    { path: "../fonts/noto-sans-tamil-tamil.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/noto-sans-tamil-latin.woff2", weight: "100 900", style: "normal" },
  ],
  fallback: ["Noto Sans Tamil", "sans-serif"],
  // Tamil is not a routed language yet (src/i18n/languages.ts): do not
  // make every visitor download it. Switch to true when Tamil goes beta.
  preload: false,
});

export const notoBengali = localFont({
  variable: "--font-noto-bengali",
  display: "swap",
  src: [
    { path: "../fonts/noto-sans-bengali-bengali.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/noto-sans-bengali-latin.woff2", weight: "100 900", style: "normal" },
  ],
  fallback: ["Noto Sans Bengali", "sans-serif"],
  preload: false, // not routed yet (see Tamil)
});

export const notoTelugu = localFont({
  variable: "--font-noto-telugu",
  display: "swap",
  src: [
    { path: "../fonts/noto-sans-telugu-telugu.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/noto-sans-telugu-latin.woff2", weight: "100 900", style: "normal" },
  ],
  fallback: ["Noto Sans Telugu", "sans-serif"],
  preload: false, // not routed yet (see Tamil)
});

/** All font variable classes, ready for the <html className>. */
export const fontVariableClasses = [
  plusJakarta.variable,
  bricolage.variable,
  jetBrains.variable,
  cormorant.variable,
  notoKannada.variable,
  notoDevanagari.variable,
  notoTamil.variable,
  notoBengali.variable,
  notoTelugu.variable,
].join(" ");

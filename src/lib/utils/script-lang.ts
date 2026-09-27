/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

/**
 * BCP-47 language code for a local-script name, picked from the Unicode
 * block of its first letter, so screen readers switch to the right voice
 * ("ಮಂಡ್ಯ" → kn). Devanagari is read as Hindi (Marathi names read fine with
 * it). Returns undefined for Latin text.
 */
export function scriptLang(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    if (c >= 0x0c80 && c <= 0x0cff) return "kn";
    if (c >= 0x0900 && c <= 0x097f) return "hi";
    if (c >= 0x0b80 && c <= 0x0bff) return "ta";
    if (c >= 0x0c00 && c <= 0x0c7f) return "te";
    if (c >= 0x0980 && c <= 0x09ff) return "bn";
    if (c >= 0x0d00 && c <= 0x0d7f) return "ml";
    if (c >= 0x0a80 && c <= 0x0aff) return "gu";
    if (c >= 0x0a00 && c <= 0x0a7f) return "pa";
    if (c >= 0x0b00 && c <= 0x0b7f) return "or";
    if (c >= 0x0600 && c <= 0x06ff) return "ur";
  }
  return undefined;
}

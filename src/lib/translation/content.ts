/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// What live text gets translated, and into which languages.
// Shared by the translate job (job.ts) and the read overlay (overlay.ts).
import { createHash } from "node:crypto";
import { DEFAULT_LOCALE, LANGUAGES, ROUTED_LOCALES } from "@/i18n/languages";

export type EntityType = "news" | "insight" | "moduleInsight" | "indiaNews";

/** Translated fields per table. English stays in the table itself. */
export const TRANSLATED_FIELDS: Record<EntityType, readonly string[]> = {
  news: ["title", "summary"], // NewsItem
  insight: ["headline", "summary"], // AIInsight
  moduleInsight: ["opinion", "recommendation"], // AIModuleInsight
  indiaNews: ["headline", "summary"], // IndiaModuleNews
};

/** Short, stable fingerprint of the English text a translation was made from. */
export function sourceHash(text: string): string {
  return createHash("sha1").update(text.trim()).digest("hex").slice(0, 16);
}

/**
 * The locale to overlay for a request, or null for English / unknown codes.
 * Only routed languages (live + beta) are accepted, so a crafted ?locale=
 * can never make the API do extra work.
 */
export function contentLocale(raw: string | null | undefined): string | null {
  if (!raw || raw === DEFAULT_LOCALE) return null;
  return ROUTED_LOCALES.includes(raw) ? raw : null;
}

/**
 * Languages the job translates into: every routed non-English language
 * (grows automatically when a language is switched on in the registry),
 * plus TRANSLATION_EXTRA_LOCALES — planned languages you want filled in
 * BEFORE switching them on, e.g. "hi,ta".
 */
export function translationTargets(): string[] {
  const extra = (process.env.TRANSLATION_EXTRA_LOCALES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((c) => c && c !== DEFAULT_LOCALE && LANGUAGES.some((l) => l.code === c));
  return [...new Set([...ROUTED_LOCALES.filter((c) => c !== DEFAULT_LOCALE), ...extra])];
}

/** True when Prisma says the ContentTranslation table has not been created yet. */
export function isMissingTable(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return code === "P2021" || /ContentTranslation.*does not exist|relation .*ContentTranslation/i.test(msg);
}

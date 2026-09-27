/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// next-intl request config: which messages a request gets.
//
// Messages for a language are its dictionary DEEP-MERGED over English, so a
// key that has not been translated yet shows the English text — never a raw
// key and never an empty string. Missing keys are not errors (a language in
// "beta" is expected to have gaps); they are logged in development only.
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import en from "../dictionaries/en.json";
import { PAGE_NAMESPACES } from "./namespaces";

type Messages = Record<string, unknown>;

function deepMerge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    if (v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)) {
      out[k] = deepMerge(b as Messages, v as Messages);
    } else if (typeof v === "string" && (v === "" || v.startsWith("TODO_TRANSLATE"))) {
      // untranslated placeholder → keep English
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function importJson(path: string): Promise<Messages | null> {
  try {
    const mod = (await import(`../dictionaries/${path}.json`)) as { default: Messages };
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * Messages = the shared file (dictionaries/<locale>.json) plus one namespace
 * per page file (dictionaries/<locale>/<ns>.json, listed in namespaces.ts),
 * each deep-merged over English so gaps show English.
 */
async function loadMessages(locale: string): Promise<Messages> {
  const base = en as Messages;
  const shared = locale === routing.defaultLocale ? base : deepMerge(base, (await importJson(locale)) ?? {});
  const pages: Messages = {};
  await Promise.all(
    PAGE_NAMESPACES.map(async (ns) => {
      const enPart = (await importJson(`en/${ns}`)) ?? {};
      const locPart = locale === routing.defaultLocale ? null : await importJson(`${locale}/${ns}`);
      pages[ns] = locPart ? deepMerge(enPart, locPart) : enPart;
    }),
  );
  return { ...shared, ...pages };
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "Asia/Kolkata",
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.warn("[i18n]", error.message);
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});

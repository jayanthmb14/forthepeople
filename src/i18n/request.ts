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

async function loadMessages(locale: string): Promise<Messages> {
  if (locale === routing.defaultLocale) return en as Messages;
  try {
    const mod = (await import(`../dictionaries/${locale}.json`)) as { default: Messages };
    return deepMerge(en as Messages, mod.default);
  } catch {
    return en as Messages;
  }
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

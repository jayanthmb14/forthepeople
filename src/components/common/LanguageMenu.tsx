/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// LanguageMenu — the header language switcher (Design v5.1).
//
// Always in the header row, on every width (never inside another menu):
//   PC / tablet  [🌐 English ▾]      phone  [🌐 EN ▾] / [🌐 हि ▾] / [🌐 ಕ ▾]
//
// Built entirely from the language registry (src/i18n/languages.ts): every
// "live" or "beta" language is listed in its own script; the "planned" ones
// sit behind one "🔒 N more Indian languages coming" line that opens to a
// locked list of their names. Switching keeps the current page:
// /kn/x/y ↔ /en/x/y. No language is typed in this file.
//
// Order (displayOrder below): the site's default language first, then the
// rest by English name — so today: English, हिन्दी (Hindi), ಕನ್ನಡ (Kannada),
// and the locked list in the same alphabetical order. A new language falls
// into place without editing this file.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe, Lock } from "lucide-react";
import { DEFAULT_LOCALE, LANGUAGES, ROUTED_LOCALES, getLanguage } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";
import { focusFirstItem, onMenuKeyDown, usePopover } from "@/components/home/use-popover";
import s from "./LanguageMenu.module.css";

/** Replace the locale segment of a path (works for 2- and 3-letter codes). */
export function switchLocalePath(pathname: string | null, code: string): string {
  const parts = (pathname ?? "/").split("/");
  if (parts.length > 1 && ROUTED_LOCALES.includes(parts[1])) parts[1] = code;
  else parts.splice(1, 0, code);
  const out = parts.join("/").replace(/\/+$/, "");
  return out || `/${code}`;
}

const byEnglishName = new Intl.Collator("en", { sensitivity: "base" });

/** Menu order: the default language first, then by English name. */
export function displayOrder(a: Language, b: Language): number {
  if (a.code === DEFAULT_LOCALE) return -1;
  if (b.code === DEFAULT_LOCALE) return 1;
  return byEnglishName.compare(a.english, b.english);
}

/** "EN" for Latin scripts, else the first letter with its vowel sign ("हि", "ಕ"). */
function shortLabel(l: Language): string {
  if (l.script === "Latin") return l.code.toUpperCase();
  return l.native.match(/^\P{M}\p{M}*/u)?.[0] ?? l.native.slice(0, 1);
}

export default function LanguageMenu() {
  const t = useTranslations("lang");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const current = getLanguage(locale);
  const routed = LANGUAGES.filter((l) => l.status !== "planned").sort(displayOrder);
  const planned = LANGUAGES.filter((l) => l.status === "planned").sort(displayOrder);

  const close = useCallback(() => setOpen(false), []);
  usePopover(open, close, wrap, button);

  return (
    <div ref={wrap} className={s.wrap}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("changeAria", { name: current.native })}
        onClick={() => setOpen((x) => !x)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            focusFirstItem(panel.current);
          }
        }}
        className={s.button}
      >
        <Globe size={16} aria-hidden />
        <span lang={current.code} className={s.long}>
          {current.native}
        </span>
        <span lang={current.code} className={s.short}>
          {shortLabel(current)}
        </span>
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div ref={panel} id={panelId} className={s.panel} role="group" aria-label={t("menuLabel")} onKeyDown={onMenuKeyDown}>
          <p className={s.title}>{t("menuLabel")}</p>
          <ul className={s.list}>
            {routed.map((l) => (
              <li key={l.code}>
                <Link
                  href={switchLocalePath(pathname, l.code)}
                  hrefLang={l.code}
                  lang={l.code}
                  aria-current={l.code === locale ? "true" : undefined}
                  className={s.item}
                  onClick={() => setOpen(false)}
                  data-menu-item
                >
                  <span className={s.native}>{l.native}</span>
                  {l.english !== l.native && (
                    <span className={s.english} lang="en">
                      {l.english}
                    </span>
                  )}
                  {l.status === "beta" && (
                    <span className={s.beta} title={t("betaNote")}>
                      {t("beta")}
                    </span>
                  )}
                  {l.code === locale && <Check size={16} aria-hidden className={s.check} />}
                </Link>
              </li>
            ))}
          </ul>
          {routed.some((l) => l.status === "beta") && <p className={s.note}>{t("betaNote")}</p>}
          {planned.length > 0 && (
            <details className={s.more}>
              <summary className={s.moreSummary} data-menu-item>
                <Lock size={14} aria-hidden className={s.lock} />
                <span>{t("more", { n: planned.length })}</span>
                <ChevronDown size={14} aria-hidden className={s.moreCaret} />
              </summary>
              <p className={s.lockedNote}>{t("lockedNote")}</p>
              <ul aria-label={t("comingList")} className={s.planned}>
                {planned.map((l) => (
                  <li key={l.code} lang={l.code} dir={l.dir}>
                    <Lock size={11} aria-hidden className={s.lockSmall} />
                    {l.native}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// LanguageMenu — the header language switcher (Design v5).
//
// Always in the header row, on every width (never inside another menu):
//   PC / tablet  [🌐 English ▾]      phone  [🌐 EN ▾] / [🌐 हि ▾] / [🌐 ಕ ▾]
//
// Built entirely from the language registry (src/i18n/languages.ts): every
// "live" or "beta" language is listed in its own script; the "planned" ones
// sit behind one quiet "N more Indian languages coming" line that opens to
// show their names. Switching keeps the current page: /kn/x/y ↔ /en/x/y.
// No language is typed in this file.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, PLANNED_LOCALES, ROUTED_LOCALES, getLanguage } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";
import s from "./LanguageMenu.module.css";

/** Replace the locale segment of a path (works for 2- and 3-letter codes). */
export function switchLocalePath(pathname: string | null, code: string): string {
  const parts = (pathname ?? "/").split("/");
  if (parts.length > 1 && ROUTED_LOCALES.includes(parts[1])) parts[1] = code;
  else parts.splice(1, 0, code);
  const out = parts.join("/").replace(/\/+$/, "");
  return out || `/${code}`;
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
  const current = getLanguage(locale);
  const routed = LANGUAGES.filter((l) => l.status !== "planned");
  const planned = LANGUAGES.filter((l) => l.status === "planned");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onFocus = (e: FocusEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  return (
    <div ref={wrap} className={s.wrap}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ftp-lang-menu"
        aria-label={t("changeAria", { name: current.native })}
        onClick={() => setOpen((x) => !x)}
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
        <div id="ftp-lang-menu" className={s.panel}>
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
                >
                  <span className={s.native}>{l.native}</span>
                  <span className={s.english} lang="en">
                    {l.english}
                  </span>
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
          {PLANNED_LOCALES.length > 0 && (
            <details className={s.more}>
              <summary className={s.moreSummary}>{t("more", { n: PLANNED_LOCALES.length })}</summary>
              <ul aria-label={t("comingList")} className={s.planned}>
                {planned.map((l) => (
                  <li key={l.code} lang={l.code} dir={l.dir} title={t("lockedNote")}>
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

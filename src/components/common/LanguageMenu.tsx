/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// LanguageMenu — the header language switcher (Design v4).
//
// Built entirely from the language registry (src/i18n/languages.ts): every
// "live" or "beta" language is listed in its own script; "planned" ones are
// counted ("20 more coming"). Switching keeps the current page: /kn/x/y ↔
// /en/x/y. No language is typed in this file.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, PLANNED_LOCALES, ROUTED_LOCALES, getLanguage } from "@/i18n/languages";

/** Replace the locale segment of a path (works for 2- and 3-letter codes). */
export function switchLocalePath(pathname: string | null, code: string): string {
  const parts = (pathname ?? "/").split("/");
  if (parts.length > 1 && ROUTED_LOCALES.includes(parts[1])) parts[1] = code;
  else parts.splice(1, 0, code);
  const out = parts.join("/").replace(/\/+$/, "");
  return out || `/${code}`;
}

export default function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("lang");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = getLanguage(locale);
  const routed = LANGUAGES.filter((l) => l.status !== "planned");

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
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ftp-lang-menu"
        onClick={() => setOpen((x) => !x)}
        className="ftp-lang-btn"
      >
        <Globe size={15} aria-hidden />
        <span lang={current.code}>{compact ? current.code.toUpperCase() : current.native}</span>
        <ChevronDown size={14} aria-hidden />
        <span className="sr-only">{t("menuLabel")}</span>
      </button>
      {open && (
        <div id="ftp-lang-menu" className="ftp-lang-panel">
          <p className="ftp-lang-title">{t("menuLabel")}</p>
          <ul>
            {routed.map((l) => (
              <li key={l.code}>
                <Link
                  href={switchLocalePath(pathname, l.code)}
                  hrefLang={l.code}
                  lang={l.code}
                  aria-current={l.code === locale ? "true" : undefined}
                  className="ftp-lang-item"
                  onClick={() => setOpen(false)}
                >
                  <span className="ftp-lang-native">{l.native}</span>
                  <span className="ftp-lang-english" lang="en">{l.english}</span>
                  {l.status === "beta" && (
                    <span className="ftp-lang-beta" title={t("betaNote")}>
                      {t("beta")}
                    </span>
                  )}
                  {l.code === locale && <Check size={15} aria-hidden className="ftp-lang-check" />}
                </Link>
              </li>
            ))}
          </ul>
          {PLANNED_LOCALES.length > 0 && <p className="ftp-lang-more">{t("more", { n: PLANNED_LOCALES.length })}</p>}
        </div>
      )}
    </div>
  );
}

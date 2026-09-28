"use client";

/**
 * LanguageRotator — "India" in each of the 22 scheduled languages
 * (Eighth Schedule of the Constitution), beside the hero title.
 *
 * Motion (Design v4: nothing moves forever): it starts on the page's own
 * language when that is in the list, steps through all 22 once, every
 * 2.4 s, and stops back where it started. prefers-reduced-motion keeps it
 * still. Screen readers hear one static label instead of 22 live updates
 * (the old aria-live region announced a new language every 3 s).
 *
 * Language names are translated (page_india "langs.*"); each script is
 * tagged with its language code so the right font and voice are used.
 */

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { INDIA_NS } from "../i18n";

const LANGUAGES = [
  { code: "hi", script: "भारत" },
  { code: "as", script: "ভাৰত" },
  { code: "bn", script: "ভারত" },
  { code: "brx", script: "भारत" },
  { code: "doi", script: "भारत" },
  { code: "gu", script: "ભારત" },
  { code: "kn", script: "ಭಾರತ" },
  { code: "ks", script: "بھارت" },
  { code: "kok", script: "भारत" },
  { code: "mai", script: "भारत" },
  { code: "ml", script: "ഇന്ത്യ" },
  { code: "mni", script: "ꯏꯟꯗꯤꯌꯥ" },
  { code: "mr", script: "भारत" },
  { code: "ne", script: "भारत" },
  { code: "or", script: "ଭାରତ" },
  { code: "pa", script: "ਭਾਰਤ" },
  { code: "sa", script: "भारतम्" },
  { code: "sat", script: "ᱥᱤᱧᱚᱛ" },
  { code: "sd", script: "भारत" },
  { code: "ta", script: "இந்தியா" },
  { code: "te", script: "భారత్" },
  { code: "ur", script: "بھارت" },
] as const;

const STEP_MS = 2400;

export function LanguageRotator() {
  const t = useTranslations(INDIA_NS);
  const locale = useLocale();
  const startIndex = Math.max(0, LANGUAGES.findIndex((l) => l.code === locale));
  const [steps, setSteps] = React.useState(0);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => setSteps((s) => s + 1), STEP_MS);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, []);

  // One full round, then stop back on the starting language.
  React.useEffect(() => {
    if (steps >= LANGUAGES.length && timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, [steps]);

  const current = LANGUAGES[(startIndex + Math.min(steps, LANGUAGES.length)) % LANGUAGES.length];

  return (
    <span
      role="img"
      aria-label={t("langs.aria", { n: LANGUAGES.length })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        minWidth: 180,
      }}
    >
      <span
        aria-hidden
        // The key restarts the fade for each new language.
        key={current.code}
        className="ftp-rotator"
        style={{
          fontSize: "19px",
          lineHeight: 1.3,
          color: "var(--color-text-primary)",
          display: "inline-flex",
          alignItems: "baseline",
          gap: "10px",
        }}
      >
        <span lang={current.code} dir={current.code === "ur" || current.code === "ks" ? "rtl" : undefined} style={{ fontWeight: 600 }}>
          {current.script}
        </span>
        <span style={{ fontSize: "14px", color: "var(--ftp-text-2)" }}>{t(`langs.${current.code}`)}</span>
      </span>

      <style>{`
        @keyframes ftp-rotator-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ftp-rotator { animation: ftp-rotator-in 180ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .ftp-rotator { animation: none; }
        }
      `}</style>
    </span>
  );
}

export default LanguageRotator;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "Skip to main content" for keyboard and screen-reader users, in the page
// language. Most pages have no #main-content, so it falls back to the first
// <main> (the district layout, home, state and India pages all have one).
"use client";

import { useTranslations } from "next-intl";

export default function SkipLink() {
  const t = useTranslations("header");
  return (
    <a
      href="#main-content"
      className="skip-nav"
      onClick={(e) => {
        const target = document.getElementById("main-content") ?? document.querySelector("main");
        if (!target) return;
        e.preventDefault();
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus();
        target.scrollIntoView();
      }}
    >
      {t("skip")}
    </a>
  );
}

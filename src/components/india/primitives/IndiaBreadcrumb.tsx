"use client";

/**
 * IndiaBreadcrumb — sticky breadcrumb row above the hero.
 *
 * File 48 §4.7.1 + Section 1 (functional dropdown) + Section 2 (sticky + inline pill).
 *
 * Layout: [Home] › [India] › [Select module ▾]   (all inline, no auto margin)
 *
 * Position: sticky at top:41px so the breadcrumb butts cleanly against the
 * bottom of the global header (Step 26 fix — was top:56px which left a 15 px
 * transparent strip visible while scrolling). The page-level scroll-progress
 * bar lives directly below this breadcrumb (sticky at top:100px, z-index one
 * less than the breadcrumb).
 *
 * i18n (Sep 2026): labels from the shared "india.breadcrumb" messages.
 *
 * Design v3 alignment (2026-09-27): colours are --ftp-* tokens, the row
 * sits on the same 16/24 px gutter as .ftp-container, icons are 14 px
 * Lucide. Height is unchanged (the sticky offsets below depend on it).
 */

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Home, ChevronRight, MapPin } from "lucide-react";
import { ModuleSelectorDropdown } from "./ModuleSelectorDropdown";

export interface IndiaBreadcrumbProps {
  locale: string;
  /** When set, the picker scopes to that super-category's modules (flat list). */
  superCategorySlug?: string;
}

export function IndiaBreadcrumb({ locale, superCategorySlug }: IndiaBreadcrumbProps) {
  const tb = useTranslations("india.breadcrumb");
  const t = { home: tb("home"), india: tb("india"), selectModule: tb("selectModule") };
  const aria = useTranslations("page_india-module")("crumbs.aria");

  return (
    <nav
      aria-label={aria}
      style={{
        position: "sticky",
        top: "41px",
        zIndex: 40,
        background: "var(--ftp-bg)",
        borderBottom: "1px solid var(--ftp-border)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        lineHeight: "20px",
        color: "var(--ftp-text-2)",
        padding: "8px clamp(16px, 4vw, 24px)", // 16 px on phones → 24 px, like .ftp-container
      }}
    >
      <Link
        href={`/${locale}`}
        style={{
          color: "var(--ftp-text-2)",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Home size={14} aria-hidden />
        {t.home}
      </Link>

      <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />

      <span
        aria-current="page"
        style={{
          color: "var(--ftp-text)",
          fontWeight: 500,
          fontSize: "13px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <MapPin size={14} aria-hidden style={{ color: "var(--ftp-brand)" }} />
        {t.india}
      </span>

      <ChevronRight size={14} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />

      <ModuleSelectorDropdown
        locale={locale}
        superCategorySlug={superCategorySlug}
        triggerLabel={t.selectModule}
      />
    </nav>
  );
}

export default IndiaBreadcrumb;

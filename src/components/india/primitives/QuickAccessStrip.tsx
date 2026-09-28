/**
 * QuickAccessStrip — one row of six quick links under the hero banner.
 *
 * Every card goes to a page that exists. (Until Sep 2026 four of the six
 * pointed at /india/districts, /india/states, /india/elections,
 * /india/rti-toolkit and /india/budget, which do not exist and returned
 * 404; "50+ central schemes" and "₹47.6L cr, FY26" were typed by hand.)
 * The district count comes from the registry (getPlatformFacts), never
 * typed by hand. Text from page_india "quick.*".
 *
 * Sync server component (useTranslations).
 */

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getPlatformFacts } from "@/lib/platform-facts";
import { BookOpenText, Clock, IndianRupee, MapPin, ThumbsUp, Vote, type LucideIcon } from "lucide-react";
import { INDIA_NS } from "../i18n";

interface QuickAccessCard {
  key: "districts" | "know" | "elections" | "budget" | "updates" | "vote";
  icon: LucideIcon;
  href: string;
  meta: string;
}

interface QuickAccessStripProps {
  locale: string;
}

export function QuickAccessStrip({ locale }: QuickAccessStripProps) {
  const t = useTranslations(`${INDIA_NS}.quick`);
  const { activeDistricts, totalIndiaDistricts } = getPlatformFacts();
  const cards: QuickAccessCard[] = [
    { key: "districts", icon: MapPin, href: `/${locale}`, meta: t("districts.meta", { n: activeDistricts, total: totalIndiaDistricts }) },
    { key: "know", icon: BookOpenText, href: `/${locale}/india/category/know-india`, meta: t("know.meta") },
    { key: "elections", icon: Vote, href: `/${locale}/india/elections-loksabha`, meta: t("elections.meta") },
    { key: "budget", icon: IndianRupee, href: `/${locale}/india/budget-union`, meta: t("budget.meta") },
    { key: "updates", icon: Clock, href: `/${locale}/india/updates`, meta: t("updates.meta") },
    { key: "vote", icon: ThumbsUp, href: `/${locale}/vote-district`, meta: t("vote.meta") },
  ];

  return (
    <nav aria-label={t("aria")}>
      <ul
        data-ftp-kpi-quickactions="1"
        style={{
          listStyle: "none",
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "1px",
          // Teal-tinted gap + border for the heritage palette
          background: "rgba(15, 110, 86, 0.30)",
          border: "0.5px solid rgba(15, 110, 86, 0.45)",
          borderRadius: "8px",
          padding: "1px",
          overflow: "hidden",
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.key} style={{ display: "flex" }}>
              <Link
                href={card.href}
                className="ftp-quick-access-card"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  background: "rgba(247, 253, 251, 0.96)",
                  borderRadius: "6px",
                  padding: "7px 9px",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                  transition: "transform var(--ftp-dur-fast), background var(--ftp-dur-fast)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icon size={12} aria-hidden style={{ color: "#0F6E56", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", lineHeight: "16px", fontWeight: 600 }}>{t(`${card.key}.label`)}</span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--ftp-font-sans)",
                    fontSize: "12px",
                    lineHeight: "15px",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--ftp-text-2)",
                  }}
                >
                  {card.meta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <style>{`
        .ftp-quick-access-card:hover {
          transform: translateY(-1px);
          background: rgba(15, 110, 86, 0.08) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-quick-access-card, .ftp-quick-access-card:hover { transform: none; transition: none; }
        }
      `}</style>
    </nav>
  );
}

export default QuickAccessStrip;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Rupee and percentage formatting for the money pages, in the reader's
// language. Amounts in the database are whole rupees; this turns them into
// "₹12.5 Cr" / "₹12.5 ಕೋಟಿ" with Indian digit grouping (useFormat). The
// unit words live in the "page_money" messages.
"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";

const CRORE = 10_000_000;
const LAKH = 100_000;
const LAKH_CRORE = CRORE * LAKH;

/** English source-registry text (getModuleSources) → message key. Official portal names are not listed: they stay as published. */
const SOURCE_KEY: Record<string, string> = {
  "State scheme portals": "stateSchemePortals",
  "News articles (Google News RSS + regional media)": "newsArticles",
  "Government press releases": "pressReleases",
  "State Industrial Dev. Corp.": "stateIndustrialCorp",
  "State Treasury / eGramSwaraj": "stateTreasury",
  "District Administration": "districtAdmin",
  "District NIC Portal": "districtNic",
  "State Government Directory": "stateDirectory",
  "District Industries Centre": "districtIndustries",
  "State PSC / Recruitment Boards": "statePsc",
  "Government public data portals": "govPortals",
};
const FREQ_KEY: Record<string, string> = {
  "When the source publishes": "whenPublished",
  Daily: "daily",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Annual: "annual",
};

/**
 * Translated source lines for SourcesFooter: descriptive names ("State
 * scheme portals") and refresh words ("Quarterly") are translated; official
 * portal names (PFMS, MyScheme.gov.in) stay as they are.
 */
export function useSourceText() {
  const t = useTranslations("page_money");
  return {
    name: (s: string) => (SOURCE_KEY[s] ? t(`source.${SOURCE_KEY[s]}`) : s),
    freq: (s: string | undefined) => (s && FREQ_KEY[s] ? t(`freq.${FREQ_KEY[s]}`) : s),
  };
}

export function useMoney() {
  const t = useTranslations("page_money");
  const f = useFormat();
  const num = (n: number, digits = 0) =>
    f.number(n, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return {
    /** Plain number with Indian grouping ("1,23,456"). */
    num,
    /** "₹12.34 Cr", "₹5.20 L", "₹4,500". `digits` = decimals for Cr / L. Dash for missing or ≤ 0. */
    short(value: number | string | bigint | null | undefined, digits = 2): string {
      if (value === null || value === undefined || value === "") return "—";
      const n = typeof value === "bigint" ? Number(value) : typeof value === "string" ? parseFloat(value) : value;
      if (!Number.isFinite(n) || n <= 0) return "—";
      if (n >= LAKH_CRORE) return t("unit.lakhCrore", { n: num(n / LAKH_CRORE, 2) });
      if (n >= CRORE) return t("unit.crore", { n: num(n / CRORE, digits) });
      if (n >= LAKH) return t("unit.lakh", { n: num(n / LAKH, digits) });
      return t("unit.rupees", { n: num(Math.round(n)) });
    },
    /** An amount already in crore: "₹120 Cr". */
    crore(croreValue: number, digits = 0): string {
      return t("unit.crore", { n: num(croreValue, digits) });
    },
    /** An amount already in lakh: "₹45 L". */
    lakh(lakhValue: number, digits = 0): string {
      return t("unit.lakh", { n: num(lakhValue, digits) });
    },
    /** Whole rupees: "₹12,500". */
    rupees(n: number): string {
      return t("unit.rupees", { n: num(Math.round(n)) });
    },
    /** A 0–1 share as "45%". */
    pct(share: number, digits = 0): string {
      return f.number(share, { style: "percent", maximumFractionDigits: digits });
    },
  };
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — words, rupees and dates in the reader's language.
 * One hook for every component in this folder: category / status / update
 * labels come from the "page_infrastructure" messages (unknown values from
 * the database are shown as published), rupees from useMoney(), dates from
 * useFormat() (IST).
 */

"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { useMoney } from "@/components/money/useMoney";
import { CATEGORY_KEY, normalizeCategory, statusStyle } from "./infra-utils";

const valid = (iso: string | null | undefined): iso is string => !!iso && !Number.isNaN(new Date(iso).getTime());

export function useInfraText() {
  const t = useTranslations("page_infrastructure");
  const f = useFormat();
  const m = useMoney();
  return {
    t,
    f,
    m,
    /** "Roads" → "ರಸ್ತೆಗಳು"; a category we do not know stays as published. */
    category(raw: string | null | undefined): string {
      const c = normalizeCategory(raw);
      const k = CATEGORY_KEY[c];
      return k ? t(`cat.${k}`) : c;
    },
    status(raw: string | null | undefined): string {
      return t(`status.${statusStyle(raw).key}`);
    },
    updateType(type: string): string {
      return t.has(`update.${type}`) ? t(`update.${type}`) : type;
    },
    scope(scope: string): string {
      return t.has(`scope.${scope}`) ? t(`scope.${scope}`) : scope;
    },
    /** Rupees as "₹120 Cr" / "₹45 L"; dash when unknown. */
    inr(rupees: number | null | undefined): string {
      return rupees == null ? "—" : m.short(rupees, 0);
    },
    monthYear(iso: string | null | undefined): string {
      return valid(iso) ? f.date(iso, { month: "short", year: "numeric" }) : "—";
    },
    fullDate(iso: string | null | undefined): string {
      return valid(iso) ? f.date(iso, { day: "2-digit", month: "short", year: "numeric" }) : "—";
    },
    /** "5 hours ago"; older than a week → "12 Sep". */
    ago(iso: string | null | undefined): string {
      return valid(iso) ? f.ago(iso) : "—";
    },
  };
}

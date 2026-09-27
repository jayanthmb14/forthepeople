/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  StaleDataNotice — one calm line at the top of a module page when its
//  main dataset is old, undated or not collected for this district.
// ═══════════════════════════════════════════════════════════════════════
//
//   late           "This data is 160 days old. The newest we have is from
//                   20 Apr 2026 (OpenWeatherMap). We could not find newer
//                   data."  (amber)
//   period, late   "This data is for FY 2024-25. It is the newest we have
//                   (…). We could not find newer data."  (amber)
//   unknown        "Date not published by the source. We cannot tell how
//                   old this data is."  (grey)
//   not collected  "We do not collect this data for Pune yet."  (grey; only
//                   when none of the page's datasets has rows)
//   estimate       "Some figures here are estimates, not official counts."
//
//  Current data shows nothing (the page header already shows its date).
//  Rendered by the district layout above every module page; the facts come
//  from /api/data/freshness through useFreshness (one request per district).
"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock, Info } from "lucide-react";
import { useFreshness } from "@/hooks/useFreshness";
import { useDistrictName, useFormat } from "@/i18n/client";
import { useSourceText } from "@/components/money/useMoney";
import { districtRoute } from "./path";
import { moduleSourceNames } from "./sources";

export default function StaleDataNotice({ stateSlug, districtSlug }: { stateSlug: string; districtSlug: string }) {
  const t = useTranslations("page_shell");
  const tv = useTranslations("page_verify");
  const f = useFormat();
  const src = useSourceText();
  const districtName = useDistrictName(stateSlug, districtSlug);
  const pathname = usePathname();
  const route = districtRoute(pathname);
  const fresh = useFreshness(stateSlug, districtSlug);

  if (route.kind !== "module" || !route.module) return null;
  const d = fresh.primary(route.module);
  if (!d) return null;

  const showEstimate = d.estimate && d.status !== "not_collected";
  if (d.status === "current" || d.status === "reference") {
    if (!showEstimate) return null;
    return (
      <p className="ftp-stale" data-tone="neutral" role="note">
        <Info size={16} aria-hidden className="ftp-stale-icon" />
        <span>{t("notice.estimate")}</span>
      </p>
    );
  }

  if (d.status === "not_collected") {
    // Only when the page has none of its data: the Bengaluru Urban police
    // page said "We do not collect this data" above 44 police stations
    // because its main dataset (NCRB crime) is empty (Sept 2026 audit).
    if (fresh.datasetsFor(route.module).some((x) => x.status !== "not_collected")) return null;
    return (
      <p className="ftp-stale" data-tone="neutral" role="note">
        <Info size={16} aria-hidden className="ftp-stale-icon" />
        <span>{t("notice.notCollected", { district: districtName })}</span>
      </p>
    );
  }

  if (d.status === "unknown") {
    return (
      <p className="ftp-stale" data-tone="neutral" role="note">
        <Info size={16} aria-hidden className="ftp-stale-icon" />
        <span>
          <strong>{t("notice.unknownTitle")}</strong> {t("notice.unknownBody")}{" "}
          <a href="#verify" className="ftp-stale-link">{t("notice.howWeCheck")}</a>
        </span>
      </p>
    );
  }

  // Late.
  const source = moduleSourceNames(route.module, stateSlug).slice(0, 2).map(src.name).join(", ");
  const periodText = d.period ? (d.periodKind === "fy" ? tv("periodFy", { period: d.period }) : d.period) : null;
  const dateText = d.dataDate ? f.date(d.dataDate, { day: "numeric", month: "short", year: "numeric" }) : null;
  const hours = d.ageHours ?? 0;

  let lead: string;
  let newest: string;
  if (periodText) {
    lead = t("notice.latePeriod", { period: periodText });
    newest = t("notice.newestPeriod", { source });
  } else {
    lead = hours < 48 ? t("notice.lateHours", { n: Math.round(hours) }) : t("notice.lateDays", { n: d.ageDays ?? 0 });
    newest = dateText ? t("notice.newestDate", { date: dateText, source }) : "";
  }

  return (
    <p className="ftp-stale" data-tone="late" role="note">
      <CalendarClock size={16} aria-hidden className="ftp-stale-icon" />
      <span>
        <strong>{lead}</strong> {newest} {t("notice.notFound")}
        {showEstimate ? ` ${t("notice.estimate")}` : ""}{" "}
        <a href="#verify" className="ftp-stale-link">{t("notice.howWeCheck")}</a>
      </span>
    </p>
  );
}

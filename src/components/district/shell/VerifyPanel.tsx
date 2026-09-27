/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  VerifyPanel — "Check this data", at the bottom of every district page
// ═══════════════════════════════════════════════════════════════════════
//
//  Module page: one card per dataset the page shows —
//    source · data date · we last checked · should update · on time? ·
//    how we get it (automatic feed / entered by hand / from news /
//    estimate / not collected here)
//  then "Check it yourself" (the official portal), ONE "Report a mistake"
//  button (prefilled with the page and "wrong data"), links to all sources
//  and the change log, and the independence line — once per page.
//
//  Overview: a summary ("21 up to date · 9 late · …") and, folded, one row
//  per topic with its data date, cadence and status.
//
//  Anchor #verify: the district bar's freshness link and the stale notice's
//  "How we check" link jump here. Facts from /api/data/freshness.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useFreshness, type DatasetFreshness } from "@/hooks/useFreshness";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { useSourceText } from "@/components/money/useMoney";
import { getDistrict } from "@/lib/constants/districts";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { DATASETS } from "@/lib/freshness";
import { placeName } from "@/i18n/place-name";
import { districtRoute } from "./path";
import { modulePortal, moduleSourceNames } from "./sources";
import ReportMistake from "./ReportMistake";

type Tv = ReturnType<typeof useTranslations>;

/** Status → pill tone (data attribute styled in district-shell.css). */
function StatusPill({ d, tv }: { d: DatasetFreshness; tv: Tv }) {
  const label = d.status === "late" ? tv("status.late", { n: d.lateByDays ?? 1 }) : tv(`status.${d.status}`);
  return (
    <span className="ftp-verify-pill" data-status={d.status}>
      {label}
    </span>
  );
}

function useDateText() {
  const f = useFormat();
  const tv = useTranslations("page_verify");
  return (d: DatasetFreshness): string => {
    if (d.period) return d.periodKind === "fy" ? tv("periodFy", { period: d.period }) : d.period;
    if (d.dataDate) return f.date(d.dataDate, { day: "numeric", month: "short", year: "numeric" });
    return d.status === "not_collected" || d.status === "reference" ? tv("none") : tv("noDate");
  };
}

export default function VerifyPanel({
  stateSlug,
  districtSlug,
  variant,
}: {
  stateSlug: string;
  districtSlug: string;
  /** "overview" lists every topic; otherwise the open module's datasets. */
  variant?: "overview";
}) {
  const tv = useTranslations("page_verify");
  const mt = useModuleText();
  const f = useFormat();
  const src = useSourceText();
  const locale = useLocale();
  const pathname = usePathname();
  const route = districtRoute(pathname);
  const fresh = useFreshness(stateSlug, districtSlug);
  const districtName = useDistrictName(stateSlug, districtSlug);
  const dateText = useDateText();

  const isOverview = variant === "overview";
  const moduleSlug = isOverview ? "overview" : route.module;
  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const taluk = route.taluk ? getDistrict(stateSlug, districtSlug)?.taluks.find((x) => x.slug === route.taluk) : undefined;
  const pageName = taluk ? placeName(taluk, locale) : mt.label(moduleSlug ?? "overview");
  const datasets = moduleSlug && !isOverview ? fresh.datasetsFor(moduleSlug) : [];
  // Known from the registry, so the intro does not flicker while loading.
  const hasDatasets = isOverview || DATASETS.some((d) => d.module === moduleSlug);
  const portal = moduleSlug && !isOverview ? modulePortal(moduleSlug, stateSlug, districtSlug) : null;
  const sources = moduleSlug && !isOverview ? moduleSourceNames(moduleSlug, stateSlug).map(src.name).join(", ") : "";

  const methodText = (d: DatasetFreshness) =>
    d.status === "not_collected"
      ? tv("method.none", { district: districtName })
      : d.estimate
        ? tv("method.estimate")
        : tv(`method.${d.method}`);

  // Overview: every module's main dataset, in sidebar order.
  const topics = isOverview
    ? SIDEBAR_MODULES.map((m) => fresh.primary(m.slug)).filter((x): x is DatasetFreshness => Boolean(x))
    : [];
  const count = (s: DatasetFreshness["status"]) => topics.filter((x) => x.status === s).length;

  return (
    <section id="verify" className="ftp-verify" aria-labelledby="ftp-verify-title">
      <h2 id="ftp-verify-title" className="ftp-verify-title">
        <ShieldCheck size={18} aria-hidden />
        {tv("title")}
      </h2>
      <p className="ftp-verify-intro">
        {isOverview ? tv("introOverview", { district: districtName }) : hasDatasets ? tv("intro") : tv("introNone")}
      </p>

      {hasDatasets && fresh.loading && fresh.datasets.length === 0 && (
        <p className="ftp-verify-intro" aria-live="polite">{tv("loading")}</p>
      )}
      {hasDatasets && fresh.error && fresh.datasets.length === 0 && <p className="ftp-verify-intro">{tv("failed")}</p>}

      {/* Module page: one card per dataset. */}
      {datasets.length > 0 && (
        <div className="ftp-verify-list">
          {datasets.map((d) => (
            <article key={d.key} className="ftp-verify-card">
              <div className="ftp-verify-card-head">
                <h3 className="ftp-verify-card-title">{tv(`dataset.${d.key}`)}</h3>
                <StatusPill d={d} tv={tv} />
              </div>
              <dl className="ftp-verify-dl">
                <div>
                  <dt>{tv("col.source")}</dt>
                  <dd>{sources || tv("none")}</dd>
                </div>
                <div>
                  <dt>{tv("col.date")}</dt>
                  <dd>{dateText(d)}</dd>
                </div>
                <div>
                  <dt>{tv("col.checked")}</dt>
                  <dd>{d.lastChecked ? f.date(d.lastChecked, { day: "numeric", month: "short", year: "numeric" }) : tv("none")}</dd>
                </div>
                <div>
                  <dt>{tv("col.every")}</dt>
                  <dd>{tv(`every.${d.every}`)}</dd>
                </div>
                <div>
                  <dt>{tv("col.how")}</dt>
                  <dd>{methodText(d)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      {/* Overview: a summary line, then every topic, folded. */}
      {isOverview && topics.length > 0 && (
        <>
          <p className="ftp-verify-summary">
            {[
              tv("summary.current", { n: count("current") + count("reference") }),
              count("late") > 0 ? tv("summary.late", { n: count("late") }) : null,
              count("unknown") > 0 ? tv("summary.unknown", { n: count("unknown") }) : null,
              count("not_collected") > 0 ? tv("summary.missing", { n: count("not_collected") }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <details className="ftp-verify-details">
            <summary>{tv("showAll")}</summary>
            <table className="ftp-verify-table">
              <thead>
                <tr>
                  <th scope="col">{tv("col.topic")}</th>
                  <th scope="col">{tv("col.date")}</th>
                  <th scope="col">{tv("col.every")}</th>
                  <th scope="col">{tv("col.status")}</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((d) => (
                  <tr key={d.key}>
                    <th scope="row">
                      <Link href={`${base}/${d.module}`}>{mt.label(d.module)}</Link>
                    </th>
                    <td data-label={tv("col.date")}>{dateText(d)}</td>
                    <td data-label={tv("col.every")}>{tv(`every.${d.every}`)}</td>
                    <td data-label={tv("col.status")}>
                      <StatusPill d={d} tv={tv} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      <div className="ftp-verify-actions">
        {portal && (
          <a className="ftp-verify-btn" href={portal} target="_blank" rel="noopener noreferrer" aria-label={tv("portalAria")}>
            <ExternalLink size={14} aria-hidden />
            {tv("checkYourself")}: {tv("portal")}
          </a>
        )}
        <ReportMistake
          stateSlug={stateSlug}
          districtSlug={districtSlug}
          module={route.kind === "taluk" ? null : (moduleSlug ?? null)}
          pageName={pageName}
          districtName={districtName}
        />
        {moduleSlug !== "data-sources" && (
          <Link className="ftp-verify-link" href={`${base}/data-sources`}>
            {tv("allSources", { district: districtName })}
          </Link>
        )}
        {moduleSlug !== "update-log" && (
          <Link className="ftp-verify-link" href={`${base}/update-log`}>
            {tv("changes")}
          </Link>
        )}
      </div>

      <p className="ftp-verify-note">{tv("independent")}</p>
    </section>
  );
}

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
//
//  v5.1 double-verification: when /api/data/verification answers, each
//  dataset card also says whether a second source was compared —
//  "Double-checked" (with each source that agreed or not, and when),
//  "One source only", "Sources disagree" or "Not double-checked yet" — and
//  the overview adds a summary line and a column. While that API or its
//  table is missing (404 / 500), nothing extra shows: the old panel.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, BadgeCheck, CircleDashed, CircleHelp, Check, ExternalLink, ShieldCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { useVerification } from "./useVerification";
import {
  newestCheck,
  summariseVerification,
  verificationFor,
  type DatasetVerification,
  type VerificationStatus,
} from "./verification";

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

const V_ICON: Record<VerificationStatus, LucideIcon> = {
  verified: BadgeCheck,
  "single-source": CircleDashed,
  disagreement: AlertTriangle,
  unchecked: CircleHelp,
};

/** "Double-checked" / "One source only" / "Sources disagree" / "Not double-checked yet". */
function VerifyChip({ v, td }: { v: DatasetVerification; td: Tv }) {
  const Icon = V_ICON[v.status];
  return (
    <span className="ftp-vchip" data-status={v.status}>
      <Icon size={13} aria-hidden />
      {td(`verify.chip.${v.status}`)}
    </span>
  );
}

/** The double-check block under a dataset card (module pages). */
function DoubleCheck({ v, td }: { v: DatasetVerification; td: Tv }) {
  const f = useFormat();
  const day = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const agreed = v.checks.filter((c) => c.agreed).length;
  const newest = newestCheck(v);
  const text =
    v.status === "verified"
      ? agreed >= 2
        ? td("verify.text.verified", { n: agreed })
        : td("verify.text.verifiedGeneric")
      : td(`verify.text.${v.status}`);
  return (
    <div className="ftp-vblock" data-status={v.status}>
      <div className="ftp-vblock-head">
        <VerifyChip v={v} td={td} />
        {newest && <span className="ftp-vblock-when">{td("verify.lastCompared", { date: day(newest) })}</span>}
      </div>
      <p className="ftp-vblock-text">{text}</p>
      {v.checks.length > 0 && (
        <ul className="ftp-vchecks">
          {v.checks.map((c, i) => (
            <li key={`${c.source}-${i}`} data-agreed={c.agreed ? "true" : "false"}>
              {c.agreed ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
              <span>
                {c.agreed ? td("verify.agrees", { source: c.source }) : td("verify.disagrees", { source: c.source })}
                {c.checkedAt && <span className="ftp-vchecks-when"> · {td("verify.checkedOn", { date: day(c.checkedAt) })}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const td = useTranslations("page_district-shell");
  const mt = useModuleText();
  const f = useFormat();
  const src = useSourceText();
  const locale = useLocale();
  const pathname = usePathname();
  const route = districtRoute(pathname);
  const fresh = useFreshness(stateSlug, districtSlug);
  const verification = useVerification(stateSlug, districtSlug);
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
  // Double-check summary over every dataset of the district (overview only).
  const vSummary = isOverview && verification ? summariseVerification(fresh.datasets.map((d) => verificationFor(verification, d))) : null;
  const vTotal = vSummary ? vSummary.verified + vSummary["single-source"] + vSummary.disagreement + vSummary.unchecked : 0;

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
              {(() => {
                const v = verificationFor(verification, d);
                return v ? <DoubleCheck v={v} td={td} /> : null;
              })()}
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
          {vSummary && vTotal > 0 && (
            <div className="ftp-vsummary">
              <span className="ftp-vsummary-title">{td("verify.summaryTitle")}</span>
              {(["verified", "single-source", "disagreement", "unchecked"] as const)
                .filter((k) => vSummary[k] > 0)
                .map((k) => (
                  <span key={k} className="ftp-vchip" data-status={k}>
                    {(() => {
                      const Icon = V_ICON[k];
                      return <Icon size={13} aria-hidden />;
                    })()}
                    {td(`verify.summary.${k}`, { n: vSummary[k] })}
                  </span>
                ))}
            </div>
          )}
          <details className="ftp-verify-details">
            <summary>{tv("showAll")}</summary>
            <table className="ftp-verify-table">
              <thead>
                <tr>
                  <th scope="col">{tv("col.topic")}</th>
                  <th scope="col">{tv("col.date")}</th>
                  <th scope="col">{tv("col.every")}</th>
                  <th scope="col">{tv("col.status")}</th>
                  {verification && <th scope="col">{td("verify.col")}</th>}
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
                    <td data-label={tv("col.status")} data-plain="true">
                      <StatusPill d={d} tv={tv} />
                    </td>
                    {verification && (
                      <td data-label={td("verify.col")}>
                        {(() => {
                          const v = verificationFor(verification, d);
                          return v ? <VerifyChip v={v} td={td} /> : <span className="ftp-verify-none">{tv("none")}</span>;
                        })()}
                      </td>
                    )}
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

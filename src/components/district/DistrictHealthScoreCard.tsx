/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  District Health Score — data hook + breakdown (Design v3)
// ═══════════════════════════════════════════════════════════
//
//  Two pieces live here:
//
//   1. useHealthScore(districtSlug) — ONE cached request to
//      /api/data/health-score, shared by everything on the page
//      (React Query de-duplicates by the query key). The identity card
//      uses it for the KpiRing grade; the breakdown below uses it too.
//
//   2. <DistrictHealthScoreCard> — the report card, folded by default
//      (v5): grade, score and date on one line — and, once the score has
//      expired, a plain note that it may not match the page. Renders
//      nothing until a score exists.
//
//  The score text, weights and the "indicative only" warning are kept
//  word for word from v2 — only the presentation changed.
"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { KpiRing, ProgressBar } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

interface CategoryData {
  score: number;
  weight: number;
}

export interface HealthScoreData {
  overallScore: number;
  grade: string;
  trend: string | null;
  previousScore: number | null;
  categories: Record<string, CategoryData>;
  breakdown: Record<string, {
    score: number;
    weight: number;
    weightedScore: number;
    subMetrics: Record<string, { value: number; max: number; score: number; label: string; noData?: boolean }>;
  }>;
  generatedAt: string;
  /** When the score stops being valid; the overview says so after this date. */
  expiresAt?: string | null;
}

/** The 10 categories, in display order, each with a hue (v5: no emoji). */
const CATEGORY_CONFIG: Array<{ key: string; label: string; hue: string }> = [
  { key: "governance",      label: "Governance",     hue: "indigo" },
  { key: "education",       label: "Education",      hue: "violet" },
  { key: "health",          label: "Healthcare",     hue: "rose" },
  { key: "infrastructure",  label: "Infrastructure", hue: "orange" },
  { key: "waterSanitation", label: "Water",          hue: "sky" },
  { key: "economy",         label: "Economy",        hue: "amber" },
  { key: "safety",          label: "Safety",         hue: "blue" },
  { key: "agriculture",     label: "Agriculture",    hue: "green" },
  { key: "digitalAccess",   label: "Digital",        hue: "cyan" },
  { key: "citizenWelfare",  label: "Welfare",        hue: "pink" },
];

/**
 * Fetch the district health score once per page (5-minute cache).
 * Returns null data when the district has no score yet.
 */
export function useHealthScore(districtSlug: string) {
  return useQuery<HealthScoreData | null>({
    queryKey: ["health-score", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/data/health-score?district=${districtSlug}`);
      if (!res.ok) return null;
      const d = (await res.json()) as { overallScore?: number } & HealthScoreData;
      return d.overallScore ? d : null;
    },
    enabled: Boolean(districtSlug),
    staleTime: 5 * 60_000,
  });
}

/**
 * Small grade block for the identity card: KpiRing + "Health score 54/100"
 * + trend arrow. Renders nothing while loading or when there is no score.
 *
 * @prop compact  Ring only, no link (for use inside a card that is already
 *                a link, e.g. the state page's district cards).
 */
export function HealthScoreRing({ districtSlug, size = 64, compact = false }: { districtSlug: string; size?: number; compact?: boolean }) {
  const { data } = useHealthScore(districtSlug);
  const th = useTranslations("health");
  if (!data) return null;
  if (compact) return <KpiRing score={data.overallScore} grade={data.grade} size={size} />;
  const TrendIcon =
    data.trend === "improving" ? ArrowUpRight : data.trend === "declining" ? ArrowDownRight : data.trend === "stable" ? Minus : null;
  return (
    <a
      href="#health-score"
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", minHeight: 44 }}
      aria-label={th("ringAria", { score: data.overallScore, grade: data.grade })}
    >
      <KpiRing score={data.overallScore} grade={data.grade} size={size} />
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span className="ftp-label">{th("score")}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <span className="ftp-num">{data.overallScore}</span>
          <span style={{ color: "var(--ftp-text-2)" }}>/ 100</span>
          {TrendIcon && <TrendIcon size={14} aria-hidden style={{ color: "var(--ftp-text-2)" }} />}
        </span>
      </span>
    </a>
  );
}

/**
 * The report card on the overview (v5): folded by default. The summary line
 * gives the grade, the score and when it was computed; once the score has
 * expired it says so plainly ("… not recomputed since, so it may not match
 * the data on this page"). Opening it shows the 10 areas as thin bars and,
 * further folded, how the grade is calculated.
 */
export function DistrictHealthScoreCard({ districtSlug }: { districtSlug: string }) {
  const { data } = useHealthScore(districtSlug);
  const t = useTranslations("overview");
  const th = useTranslations("health");
  const to = useTranslations("page_overview");
  // Sub-measure names are stored in English by src/lib/health-score.ts; show
  // them in the reader's language ("health.subLabels", keyed by the English
  // text), else as stored. Sept 2026 audit: 29 labels stayed English on /hi, /kn.
  const subLabel = (label: string) => (th.has(`subLabels.${label}`) ? th(`subLabels.${label}`) : label);
  const f = useFormat();
  if (!data) return null;

  const rows = CATEGORY_CONFIG.map((cat) => {
    const bd = data.breakdown?.[cat.key];
    const cd = data.categories?.[cat.key];
    if (!bd && !cd) return null;
    return { cat, bd, score: bd?.score ?? cd?.score ?? 0 };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const computed = f.date(data.generatedAt, { day: "numeric", month: "short", year: "numeric" });
  // Read once per render; the card only needs day precision.
  // eslint-disable-next-line react-hooks/purity -- expiry is a render-time comparison with today
  const expired = data.expiresAt ? new Date(data.expiresAt).getTime() < Date.now() : false;
  const score = Math.round(data.overallScore * 10) / 10;

  return (
    <section id="health-score" aria-label={t("reportCard")} className="ftp-report-card-v5">
      <details>
        <summary className="ftp-rc-summary">
          <KpiRing score={data.overallScore} grade={data.grade} size={48} />
          <span className="ftp-rc-text">
            <span className="ftp-rc-title">{to("v5.report.summary", { grade: data.grade, score: f.number(score) })}</span>
            <span className="ftp-rc-sub" data-expired={expired ? "true" : undefined}>
              {expired ? to("v5.report.expired", { date: computed }) : to("v5.report.computed", { date: computed })}
              {data.previousScore !== null ? ` ${to("v5.report.prev", { prev: f.number(Math.round(data.previousScore * 10) / 10) })}` : ""}
            </span>
          </span>
          {/* v5.1: the ten areas as a tiny row of bars in their own colours —
              a picture of the card before it is opened. */}
          <span className="ftp-rc-mini" aria-hidden>
            {rows.map(({ cat, score: s }) => (
              <span key={cat.key} className={`ftp-hue-${cat.hue}`}>
                <span className="ftp-grow-y" style={{ height: `${Math.max(8, Math.min(100, s))}%` }} />
              </span>
            ))}
          </span>
          <span className="ftp-rc-open">{to("v5.report.open")}</span>
        </summary>

        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "12px 0 0" }}>
          {t("gradeLine", { grade: data.grade, score: data.overallScore })}
          {t("gradeNote")}
        </p>

        {/* Ten areas, each a thin bar in its own hue. */}
        <ul
          style={{
            listStyle: "none",
            margin: "12px 0 0",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))",
            gap: 10,
          }}
        >
          {rows.map(({ cat, score: s }) => (
            <li
              key={cat.key}
              className={`ftp-hue-${cat.hue}`}
              style={{ padding: "10px 12px", borderRadius: 12, background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ftp-text)" }}>{th(cat.key)}</span>
                <span className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)" }}>{s}</span>
              </div>
              <ProgressBar value={s} max={100} height={6} />
            </li>
          ))}
        </ul>

        {/* The method, on demand. */}
        <details style={{ marginTop: 12 }}>
          <summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--ftp-brand)" }}>
            {t("howGraded")}
          </summary>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 12px" }}>
            {th("method")}
          </p>
          <p className="ftp-body" style={{ margin: "0 0 12px" }}>
            <span style={{ fontWeight: 600, color: "var(--ftp-warn)" }}>{th("important")} </span>
            {th("caveat")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
            {rows.map(({ cat, bd, score: s }) => (
              <div key={cat.key} style={{ border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)", padding: "10px 12px", background: "var(--ftp-surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <span>{th(cat.key)}</span>
                  <span className="ftp-num">{s}/100</span>
                </div>
                {bd && (
                  <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 6 }}>
                    {th("weightLine", { weight: bd.weight, points: bd.weightedScore })}
                  </div>
                )}
                {bd?.subMetrics &&
                  Object.entries(bd.subMetrics).map(([key, metric]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
                      <span style={{ color: "var(--ftp-text-2)" }}>{subLabel(metric.label)}</span>
                      <span className="ftp-num" style={{ whiteSpace: "nowrap" }}>
                        {/* A measure with no data behind it shows a dash, never its placeholder number. */}
                        {metric.noData ? "—" : (
                          <>
                            {metric.value}
                            {metric.max > 0 ? `/${metric.max}` : ""}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </details>
      </details>
    </section>
  );
}

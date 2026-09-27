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
//   2. <DistrictHealthScoreCard> — a quiet, collapsible "How is the
//      grade calculated?" card with the 10 category scores as thin
//      progress bars. Renders nothing until a score exists.
//
//  The score text, weights and the "indicative only" warning are kept
//  word for word from v2 — only the presentation changed.
"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AsOfText, Card, KpiRing, ProgressBar } from "@/components/district/ui";

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
    subMetrics: Record<string, { value: number; max: number; score: number; label: string }>;
  }>;
  generatedAt: string;
}

/** The 10 categories, in display order: emoji + hue for the v4 report card. */
const CATEGORY_CONFIG: Array<{ key: string; label: string; emoji: string; hue: string }> = [
  { key: "governance",      label: "Governance",     emoji: "🏛️", hue: "indigo" },
  { key: "education",       label: "Education",      emoji: "🎓", hue: "violet" },
  { key: "health",          label: "Healthcare",     emoji: "🏥", hue: "rose" },
  { key: "infrastructure",  label: "Infrastructure", emoji: "🏗️", hue: "orange" },
  { key: "waterSanitation", label: "Water",          emoji: "💧", hue: "sky" },
  { key: "economy",         label: "Economy",        emoji: "💰", hue: "amber" },
  { key: "safety",          label: "Safety",         emoji: "🛡️", hue: "blue" },
  { key: "agriculture",     label: "Agriculture",    emoji: "🌾", hue: "green" },
  { key: "digitalAccess",   label: "Digital",        emoji: "📱", hue: "cyan" },
  { key: "citizenWelfare",  label: "Welfare",        emoji: "🤝", hue: "pink" },
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
  if (!data) return null;
  if (compact) return <KpiRing score={data.overallScore} grade={data.grade} size={size} />;
  const TrendIcon =
    data.trend === "improving" ? ArrowUpRight : data.trend === "declining" ? ArrowDownRight : data.trend === "stable" ? Minus : null;
  return (
    <a
      href="#health-score"
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", minHeight: 44 }}
      aria-label={`District health score ${data.overallScore} out of 100, grade ${data.grade}. See how it is calculated.`}
    >
      <KpiRing score={data.overallScore} grade={data.grade} size={size} />
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span className="ftp-label">Health score</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <span className="ftp-num">{data.overallScore}</span>
          <span style={{ color: "var(--ftp-text-2)" }}>/ 100</span>
          {TrendIcon && <TrendIcon size={14} aria-label={data.trend ?? undefined} style={{ color: "var(--ftp-text-2)" }} />}
        </span>
      </span>
    </a>
  );
}

/**
 * The breakdown card. Collapsed by default (a native <details>) so the
 * overview stays calm; opening it shows the 10 categories and, for each,
 * its weight and sub-metrics.
 */
export function DistrictHealthScoreCard({ districtSlug }: { districtSlug: string }) {
  const { data } = useHealthScore(districtSlug);
  if (!data) return null;

  const rows = CATEGORY_CONFIG.map((cat) => {
    const bd = data.breakdown?.[cat.key];
    const cd = data.categories?.[cat.key];
    if (!bd && !cd) return null;
    return { cat, bd, score: bd?.score ?? cd?.score ?? 0 };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <Card as="section" padding={18} id="health-score" aria-label="District report card" className="ftp-hue-blue" tinted>
      {/* Header: the grade ring, what it is, and when it was computed. */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <KpiRing score={data.overallScore} grade={data.grade} size={72} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
            <span className="ftp-emoji" aria-hidden>🩺 </span>District report card
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
            Grade <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>{data.grade}</strong>, a score of{" "}
            <span className="ftp-num">{data.overallScore}</span> out of 100
            {data.previousScore !== null && (
              <>
                {" "}(<span className="ftp-num">{data.previousScore}</span> last week)
              </>
            )}
            . It is a rough guide built from the data we have, not an official rating.
          </p>
        </div>
        <AsOfText asOf={data.generatedAt} prefix="Computed" />
      </div>

      {/* Ten categories, each in its own colour. */}
      <ul
        style={{
          listStyle: "none",
          margin: "16px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))",
          gap: 10,
        }}
      >
        {rows.map(({ cat, score }) => (
          <li
            key={cat.key}
            className={`ftp-hue-${cat.hue}`}
            style={{ padding: "10px 12px", borderRadius: 14, background: "#fff", border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 26, height: 26, fontSize: 14, borderRadius: 8 }}>
                {cat.emoji}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ftp-text)" }}>{cat.label}</span>
              <span className="ftp-num" style={{ fontSize: 13, color: "var(--hue-deep)" }}>{score}</span>
            </div>
            <ProgressBar value={score} max={100} height={7} />
          </li>
        ))}
      </ul>

      {/* The method, on demand. */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--hue-deep)" }}>
          How is the grade calculated?
        </summary>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "4px 0 12px" }}>
          The District Health Score combines 10 governance categories with different weights (total 100%).
          Scores are computed from live database records. Updated weekly.
        </p>
        <p className="ftp-body" style={{ margin: "0 0 12px" }}>
          <span style={{ fontWeight: 600, color: "var(--ftp-warn)" }}>Important: </span>
          This score is indicative and continuously evolving. As more data modules are populated and verified for this district, the score will change. Categories with insufficient data use baseline estimates and are not fully representative. Do not use this score for official comparisons or policy decisions.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
          {rows.map(({ cat, bd, score }) => (
            <div key={cat.key} style={{ border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)", padding: "10px 12px", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <span>
                  <span className="ftp-emoji" aria-hidden>{cat.emoji} </span>
                  {cat.label}
                </span>
                <span className="ftp-num">{score}/100</span>
              </div>
              {bd && (
                <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 6 }}>
                  Weight <span className="ftp-num">{bd.weight}%</span>, adds <span className="ftp-num">{bd.weightedScore}</span> points
                </div>
              )}
              {bd?.subMetrics &&
                Object.entries(bd.subMetrics).map(([key, metric]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
                    <span style={{ color: "var(--ftp-text-2)" }}>{metric.label}</span>
                    <span className="ftp-num" style={{ whiteSpace: "nowrap" }}>
                      {metric.value}
                      {metric.max > 0 ? `/${metric.max}` : ""}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}

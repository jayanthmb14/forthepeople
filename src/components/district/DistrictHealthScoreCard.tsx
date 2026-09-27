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
import {
  ArrowDownRight, ArrowUpRight, Minus,
  Landmark, GraduationCap, HeartPulse, HardHat, Droplets, Banknote,
  Shield, Wheat, Smartphone, HandHeart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

/** The 10 categories, in display order, with a Lucide icon each. */
const CATEGORY_CONFIG: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "governance",      label: "Governance",     icon: Landmark },
  { key: "education",       label: "Education",      icon: GraduationCap },
  { key: "health",          label: "Healthcare",     icon: HeartPulse },
  { key: "infrastructure",  label: "Infrastructure", icon: HardHat },
  { key: "waterSanitation", label: "Water",          icon: Droplets },
  { key: "economy",         label: "Economy",        icon: Banknote },
  { key: "safety",          label: "Safety",         icon: Shield },
  { key: "agriculture",     label: "Agriculture",    icon: Wheat },
  { key: "digitalAccess",   label: "Digital",        icon: Smartphone },
  { key: "citizenWelfare",  label: "Welfare",        icon: HandHeart },
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

  return (
    <Card as="section" padding={0} id="health-score" aria-label="District health score breakdown">
      <details>
        <summary
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "12px 16px", minHeight: 44, cursor: "pointer", listStyle: "none", flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="ftp-title">How is the grade calculated?</span>
            <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
              {data.grade} · {data.overallScore}/100
            </span>
            {data.previousScore !== null && (
              <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                was <span className="ftp-num">{data.previousScore}</span> last week
              </span>
            )}
          </span>
          <AsOfText asOf={data.generatedAt} prefix="Computed" />
        </summary>

        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--ftp-border)" }}>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "12px 0" }}>
            The District Health Score combines 10 governance categories with different weights (total 100%).
            Scores are computed from live database records. Updated weekly.
          </p>
          <p className="ftp-body" style={{ margin: "0 0 16px" }}>
            <span style={{ fontWeight: 500, color: "var(--ftp-warn)" }}>Important: </span>
            This score is indicative and continuously evolving. As more data modules are populated and verified for this district, the score will change. Categories with insufficient data use baseline estimates and are not fully representative. Do not use this score for official comparisons or policy decisions.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
              gap: 12,
            }}
          >
            {CATEGORY_CONFIG.map((cat) => {
              const bd = data.breakdown?.[cat.key];
              const cd = data.categories?.[cat.key];
              if (!bd && !cd) return null;
              const score = bd?.score ?? cd?.score ?? 0;
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  style={{
                    border: "1px solid var(--ftp-border)",
                    borderRadius: "var(--ftp-radius-tile)",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--ftp-text)" }}>
                      <Icon size={14} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                      {cat.label}
                    </span>
                    <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text)" }}>{score}/100</span>
                  </div>
                  <ProgressBar value={score} max={100} />
                  {bd && (
                    <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 6 }}>
                      Weight: <span className="ftp-num">{bd.weight}%</span> → <span className="ftp-num">{bd.weightedScore}</span> pts
                    </div>
                  )}
                  {bd?.subMetrics &&
                    Object.entries(bd.subMetrics).map(([key, metric]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, lineHeight: "16px", marginTop: 2 }}>
                        <span style={{ color: "var(--ftp-text-2)" }}>{metric.label}</span>
                        <span className="ftp-num" style={{ color: "var(--ftp-text)", whiteSpace: "nowrap" }}>
                          {metric.value}
                          {metric.max > 0 ? `/${metric.max}` : ""}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "12px 0 0" }}>
            Indicative score based on currently available data. Will update as more modules are populated for this district.
          </p>
        </div>
      </details>
    </Card>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Info, X } from "lucide-react";

interface CategoryData {
  score: number;
  weight: number;
}

interface HealthScoreData {
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

const CATEGORY_CONFIG = [
  { key: "governance",      label: "Governance",      icon: "🏛️", color: "#2563EB" },
  { key: "education",       label: "Education",       icon: "🎓", color: "#7C3AED" },
  { key: "health",          label: "Healthcare",      icon: "🏥", color: "#DC2626" },
  { key: "infrastructure",  label: "Infrastructure",  icon: "🏗️", color: "#D97706" },
  { key: "waterSanitation", label: "Water",           icon: "💧", color: "#0891B2" },
  { key: "economy",         label: "Economy",         icon: "💰", color: "#16A34A" },
  { key: "safety",          label: "Safety",          icon: "👮", color: "#4338CA" },
  { key: "agriculture",     label: "Agriculture",     icon: "🌾", color: "#65A30D" },
  { key: "digitalAccess",   label: "Digital",         icon: "📱", color: "#0EA5E9" },
  { key: "citizenWelfare",  label: "Welfare",         icon: "🤝", color: "#E11D48" },
];

function gradeColor(score: number): string {
  if (score >= 70) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export function DistrictHealthScoreCard({ districtSlug }: { districtSlug: string }) {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    fetch(`/api/data/health-score?district=${districtSlug}`)
      .then((r) => r.json())
      .then((d: { overallScore?: number } & HealthScoreData) => {
        if (d.overallScore) setData(d);
      })
      .catch(() => {});
  }, [districtSlug]);

  if (!data) return null;

  const color = gradeColor(data.overallScore);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E8E8E4",
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Grade badge */}
          <div
            style={{
              width: 52, height: 52, borderRadius: 12,
              background: color, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20,
              flexShrink: 0,
            }}
          >
            {data.grade}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1A1A1A" }}>District Health Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 22, fontWeight: 700, color }}>
                {data.overallScore}
              </span>
              <span style={{ fontSize: 12, color: "#9B9B9B" }}>/ 100</span>
              {data.trend === "improving" && <TrendingUp size={14} color="#16A34A" />}
              {data.trend === "declining" && <TrendingDown size={14} color="#DC2626" />}
              {data.trend === "stable"    && <Minus size={14} color="#9B9B9B" />}
              {data.previousScore !== null && (
                <span style={{ fontSize: 11, color: "#9B9B9B" }}>
                  (was {data.previousScore} last week)
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, color: "#2563EB", background: "none", border: "none",
            cursor: "pointer", padding: "6px 8px", minHeight: 44, borderRadius: 8,
          }}
        >
          {showBreakdown ? <X size={13} /> : <Info size={13} />}
          {showBreakdown ? "Hide" : "How is this calculated?"}
        </button>
      </div>

      {/* Category bars grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px 12px",
          marginBottom: showBreakdown ? 16 : 0,
        }}
        className="health-grid"
      >
        {CATEGORY_CONFIG.map((cat) => {
          const catData = data.categories[cat.key];
          if (!catData) return null;
          return (
            <div key={cat.key} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{cat.icon}</div>
              <div style={{ fontSize: 10, color: "#6B6B6B", marginBottom: 3, lineHeight: 1.2 }}>{cat.label}</div>
              <div style={{ width: "100%", height: 4, background: "#F0F0EC", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", borderRadius: 2, transition: "width 0.6s ease",
                    width: `${catData.score}%`,
                    background: cat.color,
                  }}
                />
              </div>
              <div
                style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 700, marginTop: 2, color: cat.color }}
              >
                {catData.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable breakdown */}
      {showBreakdown && (
        <div style={{ borderTop: "1px solid #E8E8E4", paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 12, lineHeight: 1.5 }}>
            The District Health Score combines 10 governance categories with different weights (total 100%).
            Scores are computed from live database records. Updated weekly.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CATEGORY_CONFIG.map((cat) => {
              const bd = (data.breakdown as Record<string, typeof data.breakdown[string]>)[cat.key];
              if (!bd) return null;
              return (
                <div
                  key={cat.key}
                  style={{
                    background: "#F8FAFC", borderRadius: 10, padding: "10px 12px",
                    border: "1px solid #F0F0EC",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 700, color: cat.color }}>
                      {bd.score}/100
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#9B9B9B", marginBottom: 6 }}>
                    Weight: {bd.weight}% → {bd.weightedScore} pts
                  </div>
                  {bd.subMetrics && Object.entries(bd.subMetrics).map(([key, metric]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 2 }}>
                      <span style={{ color: "#6B6B6B", marginRight: 8 }}>{metric.label}</span>
                      <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#1A1A1A", whiteSpace: "nowrap" }}>
                        {metric.value}{metric.max > 0 ? `/${metric.max}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 10 }}>
            Last computed: {new Date(data.generatedAt).toLocaleDateString("en-IN")}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 500px) {
          .health-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 340px) {
          .health-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useState } from "react";

type Severity = "good" | "watch" | "alert" | "critical";

interface ModuleInsight {
  opinion: string;
  severity: Severity;
  recommendation: string;
  generatedAt: string;
  expiresAt?: string | null;
  fromCache?: boolean;
  aiProvider?: string;
  aiModel?: string;
}

function formatInsightTiming(generatedAt: string, expiresAt?: string | null) {
  const now = Date.now();
  const generated = new Date(generatedAt).getTime();
  const minutesAgo = Math.floor((now - generated) / 60000);
  const hoursAgo = Math.floor(minutesAgo / 60);

  let lastUpdated: string;
  if (minutesAgo < 5) lastUpdated = "just now";
  else if (minutesAgo < 60) lastUpdated = `${minutesAgo}m ago`;
  else if (hoursAgo < 24) lastUpdated = `${hoursAgo}h ago`;
  else if (hoursAgo < 48) lastUpdated = "yesterday";
  else lastUpdated = `${Math.floor(hoursAgo / 24)} days ago`;

  let nextRefresh: string;
  // Stale insights (>14 days old) shouldn't promise an imminent refresh —
  // the cron only re-runs when underlying data changes, so the previous
  // "Refreshing soon" copy was lying. Be honest instead.
  const isStale = hoursAgo > 14 * 24;
  if (expiresAt) {
    const msUntil = new Date(expiresAt).getTime() - now;
    if (msUntil <= 0) {
      nextRefresh = isStale
        ? `Last analysis: ${lastUpdated}. Will refresh when data changes.`
        : "Refreshing soon";
    } else {
      const hUntil = Math.floor(msUntil / 3600000);
      const mUntil = Math.floor((msUntil % 3600000) / 60000);
      if (hUntil < 1) nextRefresh = `Next refresh in ${mUntil}m`;
      else if (hUntil < 24) nextRefresh = `Next refresh in ${hUntil}h`;
      else nextRefresh = `Next refresh in ${Math.floor(hUntil / 24)}d`;
    }
  } else {
    nextRefresh = isStale
      ? `Last analysis: ${lastUpdated}. Will refresh when data changes.`
      : "Updated periodically";
  }

  return { lastUpdated, nextRefresh, isStale };
}

interface AIInsightCardProps {
  module: string;
  district: string;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string; icon: string }> = {
  good:     { label: "Good",     color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "✓" },
  watch:    { label: "Watch",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "◉" },
  alert:    { label: "Alert",    color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "!" },
  critical: { label: "Critical", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "⚠" },
};

export default function AIInsightCard({ module, district }: AIInsightCardProps) {
  const [insight, setInsight] = useState<ModuleInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/data/insight?module=${module}&district=${district}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setInsight(json.insight ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [module, district]);

  if (loading) {
    return (
      <div
        style={{
          background: "#F5F5F0",
          border: "1px solid #E8E8E4",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E8E8E4" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 200, height: 12, background: "#E8E8E4", borderRadius: 4, marginBottom: 6 }} />
          <div style={{ width: 300, height: 10, background: "#F0F0EC", borderRadius: 4 }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
      </div>
    );
  }

  if (!insight) return null;

  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.watch;
  const timing = insight.generatedAt ? formatInsightTiming(insight.generatedAt, insight.expiresAt) : null;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Icon */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: cfg.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#FFF",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6B6B" }}>
              AI Analysis
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: cfg.color,
                background: cfg.border,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {cfg.label}
            </span>
            {timing && (
              <span style={{ fontSize: 10, color: "#9B9B9B", marginLeft: "auto" }}>
                {timing.lastUpdated}
              </span>
            )}
          </div>

          {/* Opinion text */}
          <p style={{ fontSize: 13, color: "#1A1A1A", margin: 0, lineHeight: 1.55 }}>
            {insight.opinion}
          </p>

          {/* Recommendation (expandable) */}
          <button
            onClick={() => setExpanded((x) => !x)}
            style={{
              marginTop: 8,
              fontSize: 12,
              color: cfg.color,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {expanded ? "▾" : "▸"} {expanded ? "Hide recommendation" : "See recommendation"}
          </button>

          {expanded && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.6)",
                borderRadius: 8,
                fontSize: 12,
                color: "#374151",
                borderLeft: `3px solid ${cfg.color}`,
              }}
            >
              {insight.recommendation}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#9B9B9B" }}>
          📰 Source-verified by {insight.aiProvider === "anthropic" ? "Claude AI" : "Gemini AI"}
          {insight.aiModel ? ` (${insight.aiModel})` : ""} · ForThePeople.in
        </span>
        <span style={{ fontSize: 10, color: "#9B9B9B" }}>
          🕐 {timing
              ? (timing.isStale
                  ? timing.nextRefresh
                  : `Analysis from ${timing.lastUpdated} · ${timing.nextRefresh}`)
              : ""}
        </span>
      </div>
    </div>
  );
}

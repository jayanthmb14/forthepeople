/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  AIInsightCard — the short AI reading of a module's data.
//  Used on ~30 module pages; props are unchanged ({ module, district }).
//
//  Design v3: a plain kit Card. The severity shows as a Pill (tinted
//  label) — no coloured box, no left stripe. The footer keeps the
//  provider credit and the honest timing line ("Analysis from 3h ago ·
//  Next refresh in 5h", or "Will refresh when data changes" for old ones).
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Clock, Sparkles } from "lucide-react";
import { Card, Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

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

/** Severity → label + kit Pill tone. */
const SEVERITY_CONFIG: Record<Severity, { label: string; tone: Tone }> = {
  good:     { label: "Good",     tone: "live" },
  watch:    { label: "Watch",    tone: "warn" },
  alert:    { label: "Alert",    tone: "danger" },
  critical: { label: "Critical", tone: "danger" },
};

export default function AIInsightCard({ module, district }: AIInsightCardProps) {
  // The answer is stored together with the module/district it belongs to,
  // so switching page shows the skeleton again without a synchronous
  // setState inside the effect (React Compiler rule).
  const requestKey = `${module}|${district}`;
  const [result, setResult] = useState<{ key: string; insight: ModuleInsight | null } | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/data/insight?module=${module}&district=${district}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setResult({ key: requestKey, insight: json.insight ?? null });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, insight: null });
      });

    return () => { cancelled = true; };
  }, [module, district, requestKey]);

  const loading = result?.key !== requestKey;
  const insight = loading ? null : result.insight;

  if (loading) {
    // Flat skeleton (kit .ftp-skeleton fade, off under reduced motion).
    return (
      <div aria-busy="true" style={{ marginBottom: 20 }}>
        <div className="ftp-skeleton" style={{ height: 76, borderRadius: "var(--ftp-radius-card)" }} />
        <span className="sr-only">Loading AI analysis</span>
      </div>
    );
  }

  if (!insight) return null;

  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.watch;
  const timing = insight.generatedAt ? formatInsightTiming(insight.generatedAt, insight.expiresAt) : null;

  return (
    <Card as="section" aria-label="AI analysis" style={{ marginBottom: 20 }}>
      {/* Header row: label · severity pill · age */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <Sparkles size={14} aria-hidden style={{ color: "var(--ftp-features)" }} />
        <span className="ftp-label">AI analysis</span>
        <Pill tone={cfg.tone}>{cfg.label}</Pill>
        {timing && (
          <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginLeft: "auto" }} suppressHydrationWarning>
            {timing.lastUpdated}
          </span>
        )}
      </div>

      {/* Opinion text */}
      <p className="ftp-body" style={{ margin: 0 }}>{insight.opinion}</p>

      {/* Recommendation (expandable) */}
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        aria-expanded={expanded}
        style={{
          marginTop: 4,
          minHeight: 44,
          fontSize: 13,
          color: "var(--ftp-brand)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontWeight: 500,
          fontFamily: "var(--ftp-font-sans)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        {expanded ? "Hide recommendation" : "See recommendation"}
      </button>

      {expanded && (
        <p className="ftp-body" style={{ margin: "0 0 4px", paddingLeft: 18, color: "var(--ftp-text)" }}>
          {insight.recommendation}
        </p>
      )}

      {/* Footer: provider credit + honest timing */}
      <div
        style={{
          marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ftp-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
          fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)",
        }}
      >
        <span>
          Source-verified by {insight.aiProvider === "anthropic" ? "Claude AI" : "Gemini AI"}
          {insight.aiModel ? ` (${insight.aiModel})` : ""} · ForThePeople.in
        </span>
        {timing && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} suppressHydrationWarning>
            <Clock size={11} aria-hidden />
            {timing.isStale ? timing.nextRefresh : `Analysis from ${timing.lastUpdated} · ${timing.nextRefresh}`}
          </span>
        )}
      </div>
    </Card>
  );
}

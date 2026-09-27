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

import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
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

type Tr = (key: string, values?: Record<string, string | number>) => string;

/** Timing lines for the card, in the reader's language (messages "ai"). */
function formatInsightTiming(generatedAt: string, expiresAt: string | null | undefined, t: Tr) {
  const now = Date.now();
  const generated = new Date(generatedAt).getTime();
  const minutesAgo = Math.floor((now - generated) / 60000);
  const hoursAgo = Math.floor(minutesAgo / 60);

  let lastUpdated: string;
  if (minutesAgo < 5) lastUpdated = t("justNow");
  else if (minutesAgo < 60) lastUpdated = t("minsAgo", { n: minutesAgo });
  else if (hoursAgo < 24) lastUpdated = t("hoursAgo", { n: hoursAgo });
  else if (hoursAgo < 48) lastUpdated = t("yesterday");
  else lastUpdated = t("daysAgo", { n: Math.floor(hoursAgo / 24) });

  let nextRefresh: string;
  // Stale insights (>14 days old) shouldn't promise an imminent refresh —
  // the cron only re-runs when underlying data changes. Be honest instead.
  const isStale = hoursAgo > 14 * 24;
  if (expiresAt) {
    const msUntil = new Date(expiresAt).getTime() - now;
    if (msUntil <= 0) {
      nextRefresh = isStale ? t("lastAnalysis", { when: lastUpdated }) : t("refreshingSoon");
    } else {
      const hUntil = Math.floor(msUntil / 3600000);
      const mUntil = Math.floor((msUntil % 3600000) / 60000);
      if (hUntil < 1) nextRefresh = t("nextInM", { n: mUntil });
      else if (hUntil < 24) nextRefresh = t("nextInH", { n: hUntil });
      else nextRefresh = t("nextInD", { n: Math.floor(hUntil / 24) });
    }
  } else {
    nextRefresh = isStale ? t("lastAnalysis", { when: lastUpdated }) : t("periodic");
  }

  return { lastUpdated, nextRefresh, isStale };
}

/** After this many days an analysis is folded away by default: the figures
 *  on the page may have moved on, and an old paragraph shown in full above
 *  newer numbers reads as current. */
const OLD_INSIGHT_DAYS = 45;

interface AIInsightCardProps {
  module: string;
  district: string;
}

/** Severity → label + kit Pill tone. */
// label = message key in the "ai" namespace
const SEVERITY_CONFIG: Record<Severity, { label: string; tone: Tone }> = {
  good:     { label: "sevGood",     tone: "live" },
  watch:    { label: "sevWatch",    tone: "warn" },
  alert:    { label: "sevAlert",    tone: "danger" },
  critical: { label: "sevCritical", tone: "danger" },
};

export default function AIInsightCard({ module, district }: AIInsightCardProps) {
  const t = useTranslations("ai");
  const { intl } = useFormat();
  // The answer is stored together with the module/district it belongs to,
  // so switching page shows the skeleton again without a synchronous
  // setState inside the effect (React Compiler rule).
  const requestKey = `${module}|${district}`;
  const [result, setResult] = useState<{ key: string; insight: ModuleInsight | null } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showOld, setShowOld] = useState(false);

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
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  if (!insight) return null;

  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.watch;
  const timing = insight.generatedAt ? formatInsightTiming(insight.generatedAt, insight.expiresAt, t) : null;
  const generatedMs = insight.generatedAt ? new Date(insight.generatedAt).getTime() : NaN;
  // eslint-disable-next-line react-hooks/purity -- age is a render-time read, like the "N days ago" label above
  const ageDays = Number.isFinite(generatedMs) ? (Date.now() - generatedMs) / 86_400_000 : 0;
  const isOld = ageDays > OLD_INSIGHT_DAYS;

  if (isOld && !showOld) {
    const on = new Date(generatedMs).toLocaleDateString(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    return (
      <Card as="section" aria-label={t("title")} padding={14} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Sparkles size={14} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
          <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }} suppressHydrationWarning>
            {t("oldNote", { date: on })}
          </span>
          <button
            type="button"
            onClick={() => setShowOld(true)}
            style={{
              marginLeft: "auto", minHeight: 44, padding: 0, border: "none", background: "transparent",
              color: "var(--ftp-brand)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--ftp-font-sans)",
            }}
          >
            {t("showIt")}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" aria-label={t("title")} style={{ marginBottom: 20 }}>
      {/* Header row: label · severity pill · age */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <Sparkles size={14} aria-hidden style={{ color: "var(--ftp-features)" }} />
        <span className="ftp-label">{t("title")}</span>
        <Pill tone={cfg.tone}>{t(cfg.label)}</Pill>
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
        {expanded ? t("hideRec") : t("seeRec")}
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
          {t("writtenBy", { who: insight.aiProvider === "anthropic" ? "Claude AI" : "Gemini AI" })}
          {insight.aiModel ? ` (${insight.aiModel})` : ""} · ForThePeople.in
        </span>
        {timing && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} suppressHydrationWarning>
            <Clock size={11} aria-hidden />
            {timing.isStale ? timing.nextRefresh : t("analysisFrom", { when: timing.lastUpdated, next: timing.nextRefresh })}
          </span>
        )}
      </div>
    </Card>
  );
}

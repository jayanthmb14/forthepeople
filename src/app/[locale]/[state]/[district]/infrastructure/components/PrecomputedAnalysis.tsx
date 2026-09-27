/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — cached AI analysis for one project (never triggers AI on render).
 * A plain Card with a Sparkles icon in the features accent. The analysis
 * text is shown as the AI wrote it; the headings and notes around it are
 * translated. Sub-headings are sentence case (no tracked capitals).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/district/ui";

export interface InfraAnalysis {
  citizenImpact: string[];
  accountability: string[];
  notes: string;
  sources: number;
  generatedAt: string;
  cached: boolean;
  unavailable?: boolean;
  /**
   * Which AI model wrote this analysis, if the cached row records it.
   * The UI prints it as-is; it never hard-codes a model name (the model
   * list lives only in src/lib/ai-provider.ts and changes often).
   */
  model?: string | null;
}

/** Small heading used inside the analysis card. */
const SUBHEAD: React.CSSProperties = {
  fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)", marginBottom: 4,
};
const LIST: React.CSSProperties = {
  margin: "0 0 10px", paddingLeft: 16, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)",
};

/**
 * Pre-computed analysis reader. NEVER triggers AI on render — the
 * analysis is generated offline by /api/cron/generate-insights and
 * cached in Redis for 24h. If no cache entry exists, the UI renders a
 * calm "Analysis will be available soon" placeholder instead of a
 * click-to-spend button.
 */
export default function PrecomputedAnalysis({ projectId }: { projectId: string }) {
  const t = useTranslations("page_infrastructure");
  const { data, isFetching } = useQuery<InfraAnalysis>({
    queryKey: ["infra-analysis", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/data/infra-analysis?projectId=${projectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  if (isFetching && !data) {
    return (
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
        {t("analysis.loading")}
      </p>
    );
  }
  if (!data || data.unavailable) {
    return (
      <Card padding={14}>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          {t("analysis.soon")}
        </p>
      </Card>
    );
  }

  return (
    <Card padding={14}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Sparkles size={14} aria-hidden style={{ color: "var(--ftp-features)" }} />
        <span style={{ ...SUBHEAD, marginBottom: 0, fontSize: 13, color: "var(--ftp-text)" }}>{t("analysis.title")}</span>
      </div>
      {data.citizenImpact?.length > 0 && (
        <>
          <div style={SUBHEAD}>{t("analysis.citizens")}</div>
          <ul style={LIST}>
            {data.citizenImpact.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
      {data.accountability?.length > 0 && (
        <>
          <div style={SUBHEAD}>{t("analysis.accountability")}</div>
          <ul style={LIST}>
            {data.accountability.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
      {data.notes && <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{data.notes}</div>}
      <div style={{ marginTop: 8, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {t("analysis.sources", { n: data.sources })}{" "}
        {data.model ? t("analysis.byModel", { model: data.model }) : t("analysis.byAi")}
      </div>
    </Card>
  );
}

/**
 * RelevantNewsSection — file 45 §5 standard pattern.
 *
 * Queries IndiaModuleNews; if empty, returns null (hide the whole section,
 * per file 45 §10 empty-state rule). Headlines and summaries are live
 * data: the stored translation is shown when it exists (localizeRows),
 * otherwise the English, marked lang="en".
 */

import * as React from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeRows } from "@/lib/translation/overlay";
import { SourcePill, type SourcePillVariant } from "@/components/india/primitives/SourcePill";
import { domainOf, fmtDate } from "@/components/india/format";

export interface RelevantNewsSectionProps {
  moduleSlug: string;
  locale: string;
  isSensitiveModule?: boolean;
  className?: string;
}

function pillVariant(sourceTier: string): SourcePillVariant {
  if (sourceTier === "tier_1_government") return "gov";
  if (sourceTier === "tier_2_major") return "major-outlet";
  return "specialist";
}

export async function RelevantNewsSection({ moduleSlug, locale, className }: RelevantNewsSectionProps) {
  let news: Array<{
    id: string;
    headline: string;
    summary: string;
    source: string;
    sourceUrl: string;
    sourceTier: string;
    publishedAt: Date;
    lang?: string;
  }> = [];
  try {
    const rows = await prisma.indiaModuleNews.findMany({
      where: { moduleSlug, status: "active" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, headline: true, summary: true, source: true, sourceUrl: true, sourceTier: true, publishedAt: true },
    });
    news = await localizeRows("indiaNews", rows, locale === "en" ? null : locale);
  } catch {
    news = [];
  }
  if (news.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "page_india-module" });

  return (
    <section className={className} style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>
          📰
        </span>
        <h2 className="ftp-h2" style={{ fontSize: 20, lineHeight: "26px" }}>
          {t("data.news.title")}
        </h2>
        <span
          style={{
            fontSize: 12,
            background: "rgba(60, 52, 137, 0.10)",
            color: "#3C3489",
            padding: "1px 8px",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          {t("data.news.ai")}
        </span>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        {news.map((n) => (
          <li
            key={n.id}
            style={{
              border: "1px solid var(--ftp-border)",
              borderRadius: "var(--ftp-radius-card)",
              padding: "14px 16px",
              background: "var(--ftp-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <SourcePill domain={domainOf(n.sourceUrl) || n.source} variant={pillVariant(n.sourceTier)} />
              <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{fmtDate(locale, n.publishedAt)}</span>
            </div>
            <div lang={n.lang}>
              <h3 style={{ fontSize: 15, fontWeight: 550, margin: "0 0 4px", lineHeight: 1.45 }}>{n.headline}</h3>
              <p style={{ fontSize: 13, color: "var(--ftp-text-2)", lineHeight: 1.6, margin: "0 0 8px" }}>{n.summary}</p>
            </div>
            <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--hue-deep)", fontWeight: 600 }}>
              {t("data.news.readAt", { site: domainOf(n.sourceUrl) })}
            </a>
          </li>
        ))}
      </ul>

      <p
        role="note"
        style={{
          marginTop: 12,
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: "18px",
          color: "var(--ftp-text-2)",
          background: "rgba(60, 52, 137, 0.05)",
          borderInlineStart: "3px solid #3C3489",
          borderRadius: 10,
        }}
      >
        {t("data.news.about")}
      </p>
    </section>
  );
}

export default RelevantNewsSection;

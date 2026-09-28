/**
 * RelevantNewsSection — file 45 §5 standard pattern.
 *
 * Queries IndiaModuleNews; if empty, returns null (hide the whole section,
 * per file 45 §10 empty-state rule). Headlines and summaries are live
 * data: the stored translation is shown when it exists (localizeRows),
 * otherwise the English, marked lang="en".
 *
 * v5.6 (Sept 2026): the same quiet list as the district news page
 * (NewsList): the headline on one line, the AI summary on one grey line,
 * then "site · date" and the kind of source as a tiny neutral tag (in words,
 * not colour). The row is the link to the original. No hex colours.
 */

import * as React from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { localizeRows } from "@/lib/translation/overlay";
import { domainOf, fmtDate } from "@/components/india/format";
import { Glyph } from "@/components/graphics";
import NewsList from "@/components/news/NewsList";

export interface RelevantNewsSectionProps {
  moduleSlug: string;
  locale: string;
  isSensitiveModule?: boolean;
  className?: string;
}

/** The kind of source, as a key under page_india-module.data.news. */
function tierKey(sourceTier: string): "tierGov" | "tierMajor" | "tierSpecialist" {
  if (sourceTier === "tier_1_government") return "tierGov";
  if (sourceTier === "tier_2_major") return "tierMajor";
  return "tierSpecialist";
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
  const tn = await getTranslations({ locale, namespace: "moduleNews" });

  return (
    <section className={className} style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10 }}>
          <Glyph name="general" size={19} />
        </span>
        <h2 className="ftp-h2" style={{ fontSize: 20, lineHeight: "26px" }}>
          {t("data.news.title")}
        </h2>
        <span
          style={{
            fontSize: 12,
            lineHeight: "18px",
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border)",
            color: "var(--ftp-text-2)",
            padding: "0 8px",
            borderRadius: 999,
            fontWeight: 500,
          }}
        >
          {t("data.news.ai")}
        </span>
      </div>

      <NewsList
        newTabLabel={tn("opensOriginal")}
        items={news.map((n) => {
          const site = domainOf(n.sourceUrl) || n.source;
          return {
            id: n.id,
            headline: n.headline,
            summary: n.summary,
            lang: n.lang,
            href: n.sourceUrl,
            meta: [
              site,
              <time key="when" dateTime={new Date(n.publishedAt).toISOString()}>
                {fmtDate(locale, n.publishedAt)}
              </time>,
            ],
            tag: t(`data.news.${tierKey(n.sourceTier)}`),
          };
        })}
      />

      <p
        role="note"
        style={{
          marginTop: 12,
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: "18px",
          color: "var(--ftp-text-2)",
          background: "var(--ftp-surface-2)",
          borderInlineStart: "3px solid var(--ftp-border-strong)",
          borderRadius: 10,
        }}
      >
        {t("data.news.about")}
      </p>
    </section>
  );
}

export default RelevantNewsSection;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ModuleNews — "Related news" block at the bottom of every module page
// ═══════════════════════════════════════════════════════════════════════
//
//  Design v3 "Civic Ledger" (CONCEPT-v3 §5, Module page). Fetches the
//  district's news once and keeps only the articles the AI news pipeline
//  tagged for THIS module (targetModule === module) whose own words back
//  that tag (related, from src/lib/related-news.ts). Renders nothing when
//  there are none — an empty "Related news" heading helps no one.
//
//  v5.6 (Sept 2026): the same quiet list as the news page (NewsList,
//  src/components/news): one row per story, the headline on one line, then
//  "publisher · when" in small grey text. The whole row is the link to the
//  original article when we have one (big touch target on phones). No
//  emoji, no colours other than tokens.
//
"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "@/components/district/ui";
import NewsList from "@/components/news/NewsList";

interface NewsItem {
  id: string;
  headline: string;
  summary?: string | null;
  source: string;
  /** The paper or site, when the feed names it (else `source`). */
  publisher?: string | null;
  url?: string | null;
  category: string;
  publishedAt: string;
  targetModule?: string | null;
  /** True when the story's own words back its district and module tags. */
  related?: boolean;
  /** Language of headline/summary: the page language once translated, else "en". */
  lang?: string;
}

/**
 * How old an article is, in words. Under a week we say "5h ago" / "3d ago";
 * older articles get their date ("12 Sep") because "41d ago" is hard to read.
 */

/** News feeds sometimes leave HTML entities in headlines — tidy them up. */
function cleanHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface ModuleNewsProps {
  district: string;
  state: string;
  locale: string;
  /** Module slug, e.g. "crops". Only articles tagged for it are shown. */
  module: string;
  /** Maximum number of articles (default 5). */
  limit?: number;
}

export default function ModuleNews({ district, state, locale, module, limit = 5 }: ModuleNewsProps) {
  const t = useTranslations("moduleNews");
  const f = useFormat();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Stored translations for this language (translated once in the backend).
    fetch(`/api/data/news?district=${district}&state=${state}&locale=${locale}`)
      .then((r) => r.json())
      .then((json) => {
        const items: NewsItem[] = json.data ?? [];
        // `related` (set by the news API from the English text): the story
        // names this district, no other state, and fits the module
        // (src/lib/related-news.ts; Sept 2026 audit).
        const filtered = items
          .filter((n) => n.targetModule === module && n.related === true)
          .slice(0, limit);
        setNews(filtered);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [district, state, locale, module, limit]);

  // Nothing tagged for this module (or still loading) → render nothing.
  if (!loaded || news.length === 0) return null;

  const base = `/${locale}/${state}/${district}`;

  return (
    <Section
      title={t("relatedNews")}
      action={
        <Link
          href={`${base}/news`}
          style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-brand)", textDecoration: "none", fontWeight: 500 }}
        >
          {t("viewAllNews")}
        </Link>
      }
    >
      <NewsList
        newTabLabel={t("opensOriginal")}
        items={news.map((n) => ({
          id: n.id,
          headline: cleanHtml(n.headline),
          lang: n.lang ?? "en",
          href: n.url,
          meta: [
            (n.publisher || n.source || "").trim(),
            <time key="when" dateTime={n.publishedAt} suppressHydrationWarning>
              {f.ago(n.publishedAt)}
            </time>,
          ],
        }))}
      />
    </Section>
  );
}

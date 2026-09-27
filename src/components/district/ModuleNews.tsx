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
//  tagged for THIS module (targetModule === module). Renders nothing when
//  there are none — an empty "Related news" heading helps no one.
//
//  Each article is a quiet Card: source + date on top (so a reader knows
//  where and when it came from), the headline below. The whole card is the
//  link to the original article when we have one (big touch target on
//  phones). No emoji, no colours other than tokens.
//
"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Section, Card } from "@/components/district/ui";
import { timeAgoLabel, asOfLabel } from "@/lib/utils/timeAgo";

interface NewsItem {
  id: string;
  headline: string;
  summary?: string | null;
  source: string;
  url?: string | null;
  category: string;
  publishedAt: string;
  targetModule?: string | null;
}

/**
 * How old an article is, in words. Under a week we say "5h ago" / "3d ago";
 * older articles get their date ("12 Sep") because "41d ago" is hard to read.
 */
function publishedLabel(iso: string): string {
  const { label } = timeAgoLabel(iso);
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days < 7 ? label : asOfLabel(iso, { prefix: "" });
}

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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/data/news?district=${district}&state=${state}`)
      .then((r) => r.json())
      .then((json) => {
        const items: NewsItem[] = json.data ?? [];
        const filtered = items
          .filter((n) => n.targetModule === module)
          .slice(0, limit);
        setNews(filtered);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [district, state, module, limit]);

  // Nothing tagged for this module (or still loading) → render nothing.
  if (!loaded || news.length === 0) return null;

  const base = `/${locale}/${state}/${district}`;

  return (
    <Section
      title="Related news"
      action={
        <Link
          href={`${base}/news`}
          style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-brand)", textDecoration: "none", fontWeight: 500 }}
        >
          View all news →
        </Link>
      }
    >
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {news.map((n) => {
          // Card body: "Source · 5h ago" line, then the headline.
          const body = (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minHeight: 44 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="ftp-label" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                  <span>{n.source}</span>
                  <span aria-hidden> · </span>
                  <time dateTime={n.publishedAt} className="ftp-num" style={{ fontWeight: 400 }}>
                    {publishedLabel(n.publishedAt)}
                  </time>
                </p>
                <p className="ftp-title" style={{ fontSize: 13, lineHeight: "20px", marginTop: 2 }}>
                  {cleanHtml(n.headline)}
                </p>
              </div>
              {n.url && (
                <ExternalLink size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 2 }} />
              )}
            </div>
          );

          return (
            <li key={n.id}>
              {n.url ? (
                // External article: the whole card is the link. Uses a plain
                // <a> (not Card href) because it leaves the site in a new tab.
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ftp-card-link"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    background: "var(--ftp-surface)",
                    border: "1px solid var(--ftp-border)",
                    borderRadius: "var(--ftp-radius-card)",
                    padding: "12px 16px",
                  }}
                >
                  {body}
                  <span className="sr-only"> (opens the original article in a new tab)</span>
                </a>
              ) : (
                <Card padding={12} style={{ padding: "12px 16px" }}>
                  {body}
                </Card>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

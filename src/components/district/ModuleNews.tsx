/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { SectionLabel } from "@/components/district/ui";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

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
  module: string;
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

  if (!loaded || news.length === 0) return null;

  const base = `/${locale}/${state}/${district}`;

  return (
    <div style={{ marginTop: 32 }}>
      <SectionLabel>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Newspaper size={14} /> Related News
        </span>
      </SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {news.map((n) => (
          <div key={n.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={10} />{timeAgo(n.publishedAt)}
                  </span>
                  <span style={{ fontSize: 11, color: "#9B9B9B" }}>{n.source}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4 }}>
                  {cleanHtml(n.headline)}
                </div>
              </div>
              {n.url && (
                <a href={n.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#2563EB", textDecoration: "none", flexShrink: 0,
                }}>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Link href={`${base}/news`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
          View all news →
        </Link>
      </div>
    </div>
  );
}

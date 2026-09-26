/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import Link from "next/link";
import { use, useState } from "react";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { useNews, useAIInsight } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock, AIInsightBanner } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

const CAT_COLORS: Record<string, string> = {
  politics: "#DC2626", development: "#2563EB", agriculture: "#16A34A", crime: "#7C3AED",
  health: "#0891B2", education: "#D97706", infrastructure: "#059669", sports: "#EA580C",
  weather: "#2563EB", economy: "#B45309",
};

// Module tag config: icon, label, color classes
const MODULE_TAGS: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
  "leaders":            { icon: "👥", label: "Leadership",    bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  "infrastructure":     { icon: "🏗️", label: "Infrastructure",bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "budget":             { icon: "💰", label: "Budget",         bg: "#FEFCE8", text: "#A16207", border: "#FDE68A" },
  "water":              { icon: "🚰", label: "Water & Dams",   bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
  "crops":              { icon: "🌾", label: "Crop Prices",    bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "weather":            { icon: "🌤️", label: "Weather",        bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "police":             { icon: "👮", label: "Police",         bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "elections":          { icon: "📊", label: "Elections",      bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "education":          { icon: "🎓", label: "Schools",        bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "health":             { icon: "🏥", label: "Health",         bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  "transport":          { icon: "🚌", label: "Transport",      bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "schemes":            { icon: "📋", label: "Schemes",        bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "housing":            { icon: "🏠", label: "Housing",        bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
  "power":              { icon: "⚡", label: "Power",          bg: "#FEFCE8", text: "#A16207", border: "#FDE68A" },
  "courts":             { icon: "⚖️", label: "Courts",         bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
  "industries":         { icon: "🏭", label: "Industries",     bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  "jjm":                { icon: "💧", label: "JJM Water",      bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
  "gram-panchayat":     { icon: "🏘️", label: "Gram Panchayat", bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "alerts":             { icon: "⚠️", label: "Alerts",         bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "famous-personalities": { icon: "🌟", label: "Personalities", bg: "#FDF4FF", text: "#7E22CE", border: "#E9D5FF" },
  "citizen-corner":     { icon: "🗣️", label: "Citizens",       bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  "offices":            { icon: "🏛️", label: "Offices",        bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
  "rti":                { icon: "📄", label: "RTI",            bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "sugar-factory":      { icon: "🏭", label: "Sugar Factory",  bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "soil":               { icon: "🌱", label: "Soil Health",    bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "population":         { icon: "👤", label: "Population",     bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "news":               { icon: "📰", label: "General",        bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
};

function cleanHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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

function ModuleTag({ targetModule, moduleAction, base }: { targetModule: string; moduleAction?: string | null; base: string }) {
  const tag = MODULE_TAGS[targetModule];
  if (!tag) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
      <Link
        href={`${base}/${targetModule}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: tag.bg, color: tag.text,
          border: `1px solid ${tag.border}`,
          textDecoration: "none",
        }}
      >
        <span>{tag.icon}</span>
        {tag.label}
      </Link>
      {moduleAction && (
        <span style={{ fontSize: 11, color: "#9B9B9B" }}>→ {moduleAction}</span>
      )}
    </div>
  );
}

function NewsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useNews(district, state);
  const { data: aiInsight } = useAIInsight(district, "news");
  const [filter, setFilter] = useState("all");

  const news = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Newspaper} title="Local News" description="Latest news and developments from the district" backHref={base} liveTag />
      {(() => { const _src = getModuleSources("news", state); return <DataSourceBanner moduleName="news" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="news" district={district} />
      {aiInsight && (
        <AIInsightBanner
          headline={aiInsight.headline}
          summary={aiInsight.summary}
          sentiment={aiInsight.sentiment}
          confidence={aiInsight.confidence}
          sourceUrls={aiInsight.sourceUrls}
          createdAt={aiInsight.createdAt}
        />
      )}
      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && news.length === 0 && (
        <NoDataCard module="news" district={district} state={state} />
      )}

      {!isLoading && news.length > 0 && (
        <>
          {/* Category filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {categories.map((c) => {
              const color = c !== "all" ? (CAT_COLORS[c.toLowerCase()] ?? "#6B7280") : "#2563EB";
              return (
                <button key={c} onClick={() => setFilter(c)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: filter === c ? color : "#F5F5F0",
                  color: filter === c ? "#FFF" : "#6B6B6B",
                  border: filter === c ? `1px solid ${color}` : "1px solid #E8E8E4",
                }}>
                  {c === "all" ? `All (${news.length})` : `${c} (${news.filter(n => n.category === c).length})`}
                </button>
              );
            })}
          </div>

          {/* Featured news (first item) */}
          {filtered.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {(() => {
                const n = filtered[0];
                const color = CAT_COLORS[n.category.toLowerCase()] ?? "#2563EB";
                return (
                  <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: `${color}15`, color }}>{n.category}</span>
                          <span style={{ fontSize: 11, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{timeAgo(n.publishedAt)}</span>
                          <span style={{ fontSize: 11, color: "#9B9B9B" }}>{n.publisher ?? n.source}</span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.4, marginBottom: n.summary ? 8 : 0 }}>{cleanHtml(n.headline)}</div>
                        {n.summary && n.summary !== n.headline && <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6 }}>{cleanHtml(n.summary)}</div>}
                        {n.targetModule && <ModuleTag targetModule={n.targetModule} moduleAction={n.moduleAction} base={base} />}
                      </div>
                      {n.url && (
                        <a href={n.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "7px 12px",
                          background: color, color: "#FFF", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          textDecoration: "none", flexShrink: 0,
                        }}>
                          Read <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Rest of news */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.slice(1).map((n) => {
              const color = CAT_COLORS[n.category.toLowerCase()] ?? "#6B7280";
              return (
                <div key={n.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 8, background: `${color}15`, color }}>{n.category}</span>
                        <span style={{ fontSize: 11, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{timeAgo(n.publishedAt)}</span>
                        <span style={{ fontSize: 11, color: "#9B9B9B" }}>{n.publisher ?? n.source}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, marginBottom: n.summary ? 4 : 0 }}>{cleanHtml(n.headline)}</div>
                      {n.summary && n.summary !== n.headline && <div style={{ fontSize: 12, color: "#9B9B9B", lineHeight: 1.5 }}>{cleanHtml(n.summary)}</div>}
                      {n.targetModule && <ModuleTag targetModule={n.targetModule} moduleAction={n.moduleAction} base={base} />}
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function NewsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="News & Media">
      <NewsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

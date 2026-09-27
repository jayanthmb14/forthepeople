/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  News & Updates — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Order on the page:
//    PageHeader (module emoji band, freshness, source)
//    → AI summary cards (unchanged data hooks)
//    → StatStrip of emoji tiles (articles, topics, linked to a page)
//    → the picture: an "In simple words" line + a pictogram of how many
//      stories point to a data page, and one bar per topic. Every number
//      is counted from the same feed that is listed below.
//    → topic Chips → featured article (tinted) → the rest as quiet cards
//    → SourcesFooter → Toolbar (Share, Compare)
//
//  Every article card shows WHERE it came from (publisher / source) and
//  WHEN (relative time under a week, the date after that). Module tags
//  carry that module's emoji and hue, and link to the module.
//
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import Link from "next/link";
import { use, useState } from "react";
import { Newspaper, ExternalLink, Share2, GitCompare } from "lucide-react";
import { useNews, useAIInsight } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import {
  PageHeader, LoadingShell, ErrorBlock, AIInsightBanner, StatStrip, StatTile,
  Section, Card, Chips, EmptyState, ProgressBar, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { timeAgoLabel, asOfLabel } from "@/lib/utils/timeAgo";

// Module tags: the AI news pipeline tags each article with the module it
// is about (targetModule). The key is that slug (the link target, unchanged);
// `hue` is the sidebar module whose colour the tag borrows, `emoji` its chip.
const MODULE_TAGS: Record<string, { emoji: string; label: string; hue: string }> = {
  "leaders":              { emoji: "👥", label: "Leadership",     hue: "leadership" },
  "infrastructure":       { emoji: "🏗️", label: "Infrastructure", hue: "infrastructure" },
  "budget":               { emoji: "💰", label: "Budget",         hue: "finance" },
  "water":                { emoji: "🚰", label: "Water & Dams",   hue: "water" },
  "crops":                { emoji: "🌾", label: "Crop Prices",    hue: "crops" },
  "weather":              { emoji: "🌦️", label: "Weather",        hue: "weather" },
  "police":               { emoji: "👮", label: "Police",         hue: "police" },
  "elections":            { emoji: "🗳️", label: "Elections",      hue: "elections" },
  "education":            { emoji: "🎓", label: "Schools",        hue: "schools" },
  "health":               { emoji: "🏥", label: "Health",         hue: "health" },
  "transport":            { emoji: "🚌", label: "Transport",      hue: "transport" },
  "schemes":              { emoji: "📋", label: "Schemes",        hue: "schemes" },
  "housing":              { emoji: "🏠", label: "Housing",        hue: "housing" },
  "power":                { emoji: "⚡", label: "Power",          hue: "power" },
  "courts":               { emoji: "⚖️", label: "Courts",         hue: "courts" },
  "industries":           { emoji: "🏭", label: "Industries",     hue: "industries" },
  "jjm":                  { emoji: "💧", label: "JJM Water",      hue: "jjm" },
  "gram-panchayat":       { emoji: "🏘️", label: "Gram Panchayat", hue: "gram-panchayat" },
  "alerts":               { emoji: "⚠️", label: "Alerts",         hue: "alerts" },
  "famous-personalities": { emoji: "🌟", label: "Personalities",  hue: "famous-personalities" },
  "citizen-corner":       { emoji: "🤝", label: "Citizens",       hue: "citizen-corner" },
  "offices":              { emoji: "🏢", label: "Offices",        hue: "offices" },
  "rti":                  { emoji: "🏛️", label: "RTI",            hue: "rti" },
  "sugar-factory":        { emoji: "🏭", label: "Sugar Factory",  hue: "industries" },
  "soil":                 { emoji: "🌱", label: "Soil Health",    hue: "farm" },
  "population":           { emoji: "📈", label: "Population",     hue: "population" },
  "news":                 { emoji: "📰", label: "General",        hue: "news" },
};

/** News feeds sometimes leave HTML entities in text — tidy them up. */
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

/** Category slugs arrive lower-case ("development"); show them in sentence case. */
function topicLabel(category: string): string {
  const t = category.replace(/[-_]/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : category;
}

/** "5h ago" / "3d ago" under a week; the date ("12 Sep") after that. */
function publishedLabel(iso: string): string {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days < 7 ? timeAgoLabel(iso).label : asOfLabel(iso, { prefix: "" });
}

/** A small pill in the current hue (tint background, deep text). */
function HuePill({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--ftp-radius-pill)",
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {emoji && <span className="ftp-emoji" aria-hidden style={{ fontSize: 13 }}>{emoji}</span>}
      {children}
    </span>
  );
}

/** Small link under a headline pointing at the module the article is about. */
function ModuleTag({ targetModule, moduleAction, base }: { targetModule: string; moduleAction?: string | null; base: string }) {
  const tag = MODULE_TAGS[targetModule];
  if (!tag) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <Link href={`${base}/${targetModule}`} className={hueClass(tag.hue)} style={{ textDecoration: "none" }}>
        <HuePill emoji={tag.emoji}>{tag.label}</HuePill>
      </Link>
      {moduleAction && (
        <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{moduleAction}</span>
      )}
    </div>
  );
}

/** Topic pill, publisher and time — shown above every headline. */
function ArticleMeta({ source, publishedAt, category }: { source: string; publishedAt: string; category: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
      <HuePill>{topicLabel(category)}</HuePill>
      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{source}</span>
      <time dateTime={publishedAt} className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 400, color: "var(--ftp-text-2)" }}>
        {publishedLabel(publishedAt)}
      </time>
    </div>
  );
}

/** Headline — an external link when we have the article URL, plain text otherwise. */
function Headline({ text, url, featured }: { text: string; url?: string | null; featured?: boolean }) {
  const style: React.CSSProperties = {
    fontSize: featured ? 18 : 14,
    lineHeight: featured ? "25px" : "21px",
    fontWeight: featured ? 650 : 600,
    color: "var(--ftp-text)",
    margin: 0,
  };
  const className = featured ? "ftp-display" : undefined;
  if (!url) return <p className={className} style={style}>{text}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ ...style, display: "flex", alignItems: "flex-start", gap: 8, textDecoration: "none", minHeight: 44 }}
    >
      <span style={{ flex: 1 }}>{text}</span>
      <ExternalLink size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 3 }} />
      <span className="sr-only"> (opens the original article in a new tab)</span>
    </a>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? "Link copied" : "Share"}</ToolbarButton>;
}

function NewsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useNews(district, state);
  const { data: aiInsight } = useAIInsight(district, "news");
  const freshness = useFreshness(state, district).forModule("news");
  const [filter, setFilter] = useState("all");

  const news = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);
  const sources = getModuleSources("news", state);
  const districtName = district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Headline numbers — all derived from the same list shown below.
  const latest = news.reduce<string | null>((max, n) => (!max || n.publishedAt > max ? n.publishedAt : max), null);
  const linkedCount = news.filter((n) => n.targetModule && MODULE_TAGS[n.targetModule]).length;

  // The picture: stories per topic, biggest first (counted from `news`).
  const topicCounts = categories
    .filter((c) => c !== "all")
    .map((c) => ({ category: c, count: news.filter((n) => n.category === c).length }))
    .sort((a, b) => b.count - a.count);
  const topTopic = topicCounts[0];
  const linkedOfTen = news.length > 0 ? (linkedCount / news.length) * 10 : 0;
  // A picture needs a few stories to mean anything; one article is not a pattern.
  const showPicture = news.length >= 3;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Newspaper}
        title="Local News"
        description="Latest news and developments from the district"
        backHref={base}
        accent={getModuleAccent("news")}
        freshness={freshness?.asOf ? { asOf: freshness.asOf, status: freshness.status } : undefined}
        source={{ label: "Google News RSS" }}
      />

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
        <div style={{ marginBottom: 20 }}>
          <EmptyState
            emoji="📰"
            title="Local news being collected"
            body={`News articles from regional media sources for ${districtName} are collected via Google News RSS. Articles will appear here once the news pipeline starts covering this district.`}
            action={
              <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
              </p>
            }
          />
        </div>
      )}

      {!isLoading && news.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="📰" label="Articles" value={news.length} sub="In the current feed" asOf={latest} />
            <StatTile emoji="🏷️" label="Topics" value={categories.length - 1} sub="Kinds of story" />
            <StatTile emoji="🔗" label="Linked to a data page" value={linkedCount} sub="Tagged by topic" />
          </StatStrip>

          {showPicture && topTopic && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🗞️">
                  The feed has <strong>{news.length}</strong> news stories about {districtName} right now; the most common topic is{" "}
                  <strong>{topicLabel(topTopic.category).toLowerCase()}</strong> ({topTopic.count}{" "}
                  {topTopic.count === 1 ? "story" : "stories"}), and <strong>{linkedCount}</strong>{" "}
                  {linkedCount === 1 ? "story links" : "stories link"} to a page here with the numbers behind it.
                </Explainer>
                <Pictogram
                  filled={linkedOfTen}
                  emoji="📰"
                  label={`About ${Math.round(linkedOfTen)} of every 10 stories link to a data page on this site.`}
                />
              </Card>
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                  What the news is about
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topicCounts.slice(0, 5).map((t) => (
                    <ProgressBar
                      key={t.category}
                      value={t.count}
                      max={news.length}
                      label={`${topicLabel(t.category)} (${t.count})`}
                      height={8}
                    />
                  ))}
                </div>
                {topicCounts.length > 5 && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    {topicCounts.length - 5} more {topicCounts.length - 5 === 1 ? "topic" : "topics"} in the filter below.
                  </p>
                )}
              </Card>
            </div>
          )}

          <Section title="Latest articles" emoji="🗞️">
            {/* Category filter */}
            <div style={{ marginBottom: 16 }}>
              <Chips
                label="Filter news by category"
                value={filter}
                onChange={setFilter}
                items={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? "All" : topicLabel(c),
                  count: c === "all" ? news.length : news.filter((n) => n.category === c).length,
                }))}
              />
            </div>

            {/* Featured article (first in the filtered list) */}
            {filtered.length > 0 && (() => {
              const n = filtered[0];
              return (
                <Card as="article" tinted padding={20} style={{ marginBottom: 12 }}>
                  <ArticleMeta source={n.publisher ?? n.source} publishedAt={n.publishedAt} category={n.category} />
                  <Headline text={cleanHtml(n.headline)} url={n.url} featured />
                  {n.summary && n.summary !== n.headline && (
                    <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4, fontSize: 14, lineHeight: "21px" }}>{cleanHtml(n.summary)}</p>
                  )}
                  {n.targetModule && <ModuleTag targetModule={n.targetModule} moduleAction={n.moduleAction} base={base} />}
                </Card>
              );
            })()}

            {/* Rest of the list */}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.slice(1).map((n) => (
                <Card as="li" key={n.id} padding={16}>
                  <ArticleMeta source={n.publisher ?? n.source} publishedAt={n.publishedAt} category={n.category} />
                  <Headline text={cleanHtml(n.headline)} url={n.url} />
                  {n.summary && n.summary !== n.headline && (
                    <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: "2px 0 0" }}>{cleanHtml(n.summary)}</p>
                  )}
                  {n.targetModule && <ModuleTag targetModule={n.targetModule} moduleAction={n.moduleAction} base={base} />}
                </Card>
              ))}
            </ul>
          </Section>
        </>
      )}

      <SourcesFooter sources={sources.sources.map((name) => ({ name, frequency: sources.frequency }))} />
      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=news&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
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

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
//    → the pictures, all counted from the same feed that is listed below:
//        · an "In simple words" line + a pictogram of how many stories
//          point to a data page, and one bar per topic (with its emoji);
//        · "Who reported it": a ring of stories per publisher (top five,
//          the rest together), with a table view.
//    → topic Chips → featured article (tinted) → the rest as quiet cards
//    → SourcesFooter → Toolbar (Share, Compare)
//
//  Every article card shows WHERE it came from (publisher / source) and
//  WHEN (relative time under a week, the date after that). Module tags
//  carry that module's emoji and hue, and link to the module.
//
//  i18n: every interface string is in src/dictionaries/<locale>/page_news.json
//  (namespace "page_news"). Headlines, summaries and publisher names are
//  live data and are shown as the API returns them.
//
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import Link from "next/link";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Newspaper, ExternalLink, Share2, GitCompare } from "lucide-react";
import { useNews, useAIInsight } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import {
  PageHeader, LoadingShell, ErrorBlock, AIInsightBanner, StatStrip, StatTile,
  Section, Card, Chips, EmptyState, ProgressBar, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { OTHER_SHADE, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { useDistrictName } from "@/components/community/usePlaceName";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { useFormat, useModuleText } from "@/i18n/client";

/** The page_news translator, handed to small helpers. */
type T = ReturnType<typeof useTranslations>;

// Module tags: the AI news pipeline tags each article with the module it
// is about (targetModule). The key is that slug (the link target, unchanged);
// `hue` is the sidebar module whose colour the tag borrows, `emoji` its chip.
// The label is page_news.moduleTags.<slug>.
const MODULE_TAGS: Record<string, { emoji: string; hue: string }> = {
  "leaders":              { emoji: "👥", hue: "leadership" },
  "infrastructure":       { emoji: "🏗️", hue: "infrastructure" },
  "budget":               { emoji: "💰", hue: "finance" },
  "water":                { emoji: "🚰", hue: "water" },
  "crops":                { emoji: "🌾", hue: "crops" },
  "weather":              { emoji: "🌦️", hue: "weather" },
  "police":               { emoji: "👮", hue: "police" },
  "elections":            { emoji: "🗳️", hue: "elections" },
  "education":            { emoji: "🎓", hue: "schools" },
  "health":               { emoji: "🏥", hue: "health" },
  "transport":            { emoji: "🚌", hue: "transport" },
  "schemes":              { emoji: "📋", hue: "schemes" },
  "housing":              { emoji: "🏠", hue: "housing" },
  "power":                { emoji: "⚡", hue: "power" },
  "courts":               { emoji: "⚖️", hue: "courts" },
  "industries":           { emoji: "🏭", hue: "industries" },
  "jjm":                  { emoji: "💧", hue: "jjm" },
  "gram-panchayat":       { emoji: "🏘️", hue: "gram-panchayat" },
  "alerts":               { emoji: "⚠️", hue: "alerts" },
  "famous-personalities": { emoji: "🌟", hue: "famous-personalities" },
  "citizen-corner":       { emoji: "🤝", hue: "citizen-corner" },
  "offices":              { emoji: "🏢", hue: "offices" },
  "rti":                  { emoji: "🏛️", hue: "rti" },
  "sugar-factory":        { emoji: "🏭", hue: "industries" },
  "soil":                 { emoji: "🌱", hue: "farm" },
  "population":           { emoji: "📈", hue: "population" },
  "news":                 { emoji: "📰", hue: "news" },
};

// Topic (the feed's keyword category) → emoji chip. The categories come
// from the news job's keyword list; anything new falls back to 📰.
const TOPIC_EMOJI: Record<string, string> = {
  politics: "🏛️",
  development: "🏗️",
  agriculture: "🌾",
  crime: "🚨",
  health: "🏥",
  education: "🎓",
  infrastructure: "🛣️",
  weather: "🌦️",
  general: "📰",
};

/** How many publishers get their own slice before the rest are grouped. */
const TOP_PUBLISHERS = 5;

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

/** Translated topic name; an unknown category is shown in sentence case. */
function topicLabel(t: T, category: string): string {
  const key = `topics.${category}`;
  if (t.has(key)) return t(key);
  const s = category.replace(/[-_]/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : category;
}

function topicEmoji(category: string): string {
  return TOPIC_EMOJI[category] ?? "📰";
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
  const t = useTranslations("page_news");
  const tag = MODULE_TAGS[targetModule];
  if (!tag) return null;
  const key = `moduleTags.${targetModule}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <Link href={`${base}/${targetModule}`} className={hueClass(tag.hue)} style={{ textDecoration: "none" }}>
        <HuePill emoji={tag.emoji}>{t.has(key) ? t(key) : targetModule}</HuePill>
      </Link>
      {moduleAction && (
        <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{moduleAction}</span>
      )}
    </div>
  );
}

/** Topic pill, publisher and time — shown above every headline. */
function ArticleMeta({ source, publishedAt, category }: { source: string; publishedAt: string; category: string }) {
  const t = useTranslations("page_news");
  const f = useFormat();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
      <HuePill emoji={topicEmoji(category)}>{topicLabel(t, category)}</HuePill>
      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--ftp-text-2)" }}>{source}</span>
      <time
        dateTime={publishedAt}
        className="ftp-num"
        style={{ fontSize: 12, lineHeight: "16px", fontWeight: 400, color: "var(--ftp-text-2)" }}
        suppressHydrationWarning
      >
        {f.ago(publishedAt)}
      </time>
    </div>
  );
}

/** Headline — an external link when we have the article URL, plain text otherwise. */
function Headline({ text, url, featured }: { text: string; url?: string | null; featured?: boolean }) {
  const tn = useTranslations("moduleNews");
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
      <span className="sr-only"> {tn("opensOriginal")}</span>
    </a>
  );
}

/** Share button: the phone's share sheet when available, else copy the link. */
function SharePageButton() {
  const tf = useTranslations("pageFooter");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  }
  return <ToolbarButton icon={Share2} onClick={share}>{copied ? tf("copied") : tf("share")}</ToolbarButton>;
}

function NewsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_news");
  const tNo = useTranslations("noData");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useNews(district, state);
  const { data: aiInsight } = useAIInsight(district, "news");
  const freshness = useFreshness(state, district).forModule("news");
  const [filter, setFilter] = useState("all");
  const districtName = useDistrictName(state, district);

  const news = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter);

  // Headline numbers — all derived from the same list shown below.
  const latest = news.reduce<string | null>((max, n) => (!max || n.publishedAt > max ? n.publishedAt : max), null);
  const linkedCount = news.filter((n) => n.targetModule && MODULE_TAGS[n.targetModule]).length;

  // Picture 1: stories per topic, biggest first (counted from `news`).
  const topicCounts = categories
    .filter((c) => c !== "all")
    .map((c) => ({ category: c, count: news.filter((n) => n.category === c).length }))
    .sort((a, b) => b.count - a.count);
  const topTopic = topicCounts[0];
  const linkedOfTen = news.length > 0 ? (linkedCount / news.length) * 10 : 0;
  // A picture needs a few stories to mean anything; one article is not a pattern.
  const showPicture = news.length >= 3;

  // Picture 2: stories per publisher (the name shown on each card).
  const byPublisher = new Map<string, number>();
  for (const n of news) {
    const name = (n.publisher ?? n.source ?? "").trim();
    if (name) byPublisher.set(name, (byPublisher.get(name) ?? 0) + 1);
  }
  const publisherCounts = Array.from(byPublisher, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const restCount = publisherCounts.slice(TOP_PUBLISHERS).reduce((s, p) => s + p.count, 0);
  const publisherSlices: DonutSlice[] = [
    ...publisherCounts.slice(0, TOP_PUBLISHERS).map((p) => ({ key: p.name, label: p.name, value: p.count })),
    ...(restCount > 0 ? [{ key: "__other", label: t("otherPublishers"), value: restCount, color: OTHER_SHADE }] : []),
  ];
  const publishedTotal = publisherCounts.reduce((s, p) => s + p.count, 0);
  // Two publishers at least, or the ring is one solid circle.
  const showPublishers = showPicture && publisherCounts.length >= 2;
  const topPublisher = publisherCounts[0];

  const bold = (c: React.ReactNode) => <strong>{c}</strong>;

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      <PageHeader
        icon={Newspaper}
        title={t("title")}
        description={t("description")}
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
          <EmptyState emoji="📰" title={tNo("news.title")} body={tNo("news.body", { district: districtName })} />
        </div>
      )}

      {!isLoading && news.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="📰" label={t("statArticles")} value={f.number(news.length)} sub={t("statArticlesSub")} asOf={latest} />
            <StatTile emoji="🏷️" label={t("statTopics")} value={f.number(categories.length - 1)} sub={t("statTopicsSub")} />
            <StatTile emoji="🔗" label={t("statLinked")} value={f.number(linkedCount)} sub={t("statLinkedSub")} />
          </StatStrip>

          {showPicture && topTopic && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🗞️">
                  {t.rich("simple", {
                    count: news.length,
                    district: districtName,
                    topic: topicLabel(t, topTopic.category),
                    topicCount: topTopic.count,
                    linked: linkedCount,
                    b: bold,
                  })}
                </Explainer>
                <Pictogram filled={linkedOfTen} emoji="📰" label={t("linkedPicto", { n: Math.round(linkedOfTen) })} />
              </Card>
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}>
                  {t("aboutTitle")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topicCounts.slice(0, 5).map((tc) => (
                    <div key={tc.category} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <span className="ftp-emoji" aria-hidden style={{ fontSize: 18, marginBottom: 1 }}>{topicEmoji(tc.category)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ProgressBar
                          value={tc.count}
                          max={news.length}
                          label={t("topicBar", { topic: topicLabel(t, tc.category), n: f.number(tc.count) })}
                          height={8}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {topicCounts.length > 5 && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    {t("moreTopics", { n: topicCounts.length - 5 })}
                  </p>
                )}
              </Card>
            </div>
          )}

          {showPublishers && topPublisher && (
            <div style={{ marginTop: 16 }}>
              <ChartCard
                title={t("publishersTitle")}
                emoji="🗞️"
                units={t("publishersUnits")}
                simple={t.rich("publishersSimple", {
                  name: topPublisher.name,
                  n: f.number(topPublisher.count),
                  total: f.number(publishedTotal),
                  b: bold,
                })}
                source={{ label: "Google News RSS" }}
                asOf={latest}
                table={publisherSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
              >
                <ShareDonut
                  slices={publisherSlices}
                  centerValue={f.number(publishedTotal)}
                  centerLabel={t("storiesWord", { n: publishedTotal })}
                  ariaLabel={t("publishersAria", {
                    name: topPublisher.name,
                    n: f.number(topPublisher.count),
                    total: f.number(publishedTotal),
                  })}
                />
              </ChartCard>
            </div>
          )}

          <Section title={t("latestTitle")} emoji="🗞️">
            {/* Topic filter */}
            <div style={{ marginBottom: 16 }}>
              <Chips
                label={t("filterLabel")}
                value={filter}
                onChange={setFilter}
                items={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? t("all") : topicLabel(t, c),
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

      <SourcesFooter
        sources={[
          { name: "Google News RSS", frequency: t("frequency") },
          { name: t("sourceRegional"), frequency: t("frequency") },
        ]}
      />
      <Toolbar>
        <SharePageButton />
        <ToolbarButton icon={GitCompare} href={`/${locale}/compare?module=news&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function NewsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("news")}>
      <NewsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  News & Updates — Design v3 "Civic Ledger" module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Order on the page:
//    PageHeader (icon, H1, freshness, source)
//    → AI summary cards (unchanged data hooks)
//    → StatStrip (how many articles, categories, linked to a module)
//    → category Chips → featured article → the rest as quiet cards
//    → SourcesFooter → Toolbar (Share, Compare)
//
//  Every article card shows WHERE it came from (publisher / source) and
//  WHEN (relative time under a week, the date after that). Module tags use
//  Lucide icons — no emoji — and link to the module the article is about.
//
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import Link from "next/link";
import { use, useState } from "react";
import {
  Newspaper, ExternalLink, Share2, GitCompare,
  Users, HardHat, PiggyBank, Waves, Wheat, Cloud, Shield, Vote, GraduationCap,
  Heart, Bus, ScrollText, Home, Zap, Scale, Factory, Droplets, Building, AlertTriangle,
  Star, Handshake, Building2, ClipboardList, Sprout, BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNews, useAIInsight } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import {
  PageHeader, LoadingShell, ErrorBlock, AIInsightBanner, StatStrip, StatTile,
  Section, Card, Pill, Chips, SourcesFooter, Toolbar, ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { timeAgoLabel, asOfLabel } from "@/lib/utils/timeAgo";

// Module tags: the AI news pipeline tags each article with the module it
// is about (targetModule). The key is that slug; the value is the label
// and Lucide icon shown on the small link under the headline.
const MODULE_TAGS: Record<string, { icon: LucideIcon; label: string }> = {
  "leaders":              { icon: Users,         label: "Leadership" },
  "infrastructure":       { icon: HardHat,       label: "Infrastructure" },
  "budget":               { icon: PiggyBank,     label: "Budget" },
  "water":                { icon: Waves,         label: "Water & Dams" },
  "crops":                { icon: Wheat,         label: "Crop Prices" },
  "weather":              { icon: Cloud,         label: "Weather" },
  "police":               { icon: Shield,        label: "Police" },
  "elections":            { icon: Vote,          label: "Elections" },
  "education":            { icon: GraduationCap, label: "Schools" },
  "health":               { icon: Heart,         label: "Health" },
  "transport":            { icon: Bus,           label: "Transport" },
  "schemes":              { icon: ScrollText,    label: "Schemes" },
  "housing":              { icon: Home,          label: "Housing" },
  "power":                { icon: Zap,           label: "Power" },
  "courts":               { icon: Scale,         label: "Courts" },
  "industries":           { icon: Factory,       label: "Industries" },
  "jjm":                  { icon: Droplets,      label: "JJM Water" },
  "gram-panchayat":       { icon: Building,      label: "Gram Panchayat" },
  "alerts":               { icon: AlertTriangle, label: "Alerts" },
  "famous-personalities": { icon: Star,          label: "Personalities" },
  "citizen-corner":       { icon: Handshake,     label: "Citizens" },
  "offices":              { icon: Building2,     label: "Offices" },
  "rti":                  { icon: ClipboardList, label: "RTI" },
  "sugar-factory":        { icon: Factory,       label: "Sugar Factory" },
  "soil":                 { icon: Sprout,        label: "Soil Health" },
  "population":           { icon: BarChart3,     label: "Population" },
  "news":                 { icon: Newspaper,     label: "General" },
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

/** "5h ago" / "3d ago" under a week; the date ("12 Sep") after that. */
function publishedLabel(iso: string): string {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days < 7 ? timeAgoLabel(iso).label : asOfLabel(iso, { prefix: "" });
}

/** Small link under a headline pointing at the module the article is about. */
function ModuleTag({ targetModule, moduleAction, base }: { targetModule: string; moduleAction?: string | null; base: string }) {
  const tag = MODULE_TAGS[targetModule];
  if (!tag) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      <Link href={`${base}/${targetModule}`} style={{ textDecoration: "none" }}>
        <Pill tone="brand" icon={tag.icon}>{tag.label}</Pill>
      </Link>
      {moduleAction && (
        <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>→ {moduleAction}</span>
      )}
    </div>
  );
}

/** "Publisher · 5h ago" line + category pill, shown above every headline. */
function ArticleMeta({ source, publishedAt, category }: { source: string; publishedAt: string; category: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
      <Pill>{category}</Pill>
      <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {source}
        <span aria-hidden> · </span>
        <time dateTime={publishedAt} className="ftp-num" style={{ fontWeight: 400 }}>{publishedLabel(publishedAt)}</time>
      </span>
    </div>
  );
}

/** Headline — an external link when we have the article URL, plain text otherwise. */
function Headline({ text, url, featured }: { text: string; url?: string | null; featured?: boolean }) {
  const style: React.CSSProperties = {
    fontSize: featured ? 15 : 13,
    lineHeight: featured ? "22px" : "20px",
    fontWeight: 500,
    color: "var(--ftp-text)",
    margin: 0,
  };
  if (!url) return <p style={style}>{text}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...style, display: "flex", alignItems: "flex-start", gap: 8, textDecoration: "none", minHeight: 44 }}
    >
      <span style={{ flex: 1 }}>{text}</span>
      <ExternalLink size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 2 }} />
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

  // Headline numbers — all derived from the same list shown below.
  const latest = news.reduce<string | null>((max, n) => (!max || n.publishedAt > max ? n.publishedAt : max), null);
  const linkedCount = news.filter((n) => n.targetModule && MODULE_TAGS[n.targetModule]).length;

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
        <NoDataCard module="news" district={district} state={state} />
      )}

      {!isLoading && news.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile label="Articles" value={news.length} sub="In the current feed" asOf={latest} />
            <StatTile label="Categories" value={categories.length - 1} />
            <StatTile label="Linked to a module" value={linkedCount} sub="Tagged by topic" />
          </StatStrip>

          <Section title="Latest articles">
            {/* Category filter */}
            <div style={{ marginBottom: 16 }}>
              <Chips
                label="Filter news by category"
                value={filter}
                onChange={setFilter}
                items={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? "All" : c,
                  count: c === "all" ? news.length : news.filter((n) => n.category === c).length,
                }))}
              />
            </div>

            {/* Featured article (first in the filtered list) */}
            {filtered.length > 0 && (() => {
              const n = filtered[0];
              return (
                <Card as="article" padding={20} style={{ marginBottom: 12 }}>
                  <ArticleMeta source={n.publisher ?? n.source} publishedAt={n.publishedAt} category={n.category} />
                  <Headline text={cleanHtml(n.headline)} url={n.url} featured />
                  {n.summary && n.summary !== n.headline && (
                    <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{cleanHtml(n.summary)}</p>
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

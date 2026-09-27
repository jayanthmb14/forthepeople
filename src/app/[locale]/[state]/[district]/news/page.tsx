/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local news — "What are the papers saying about my district today?"
//  (docs/LAYOUT.md recipe; docs/MODULE-MAP.md: News = what the papers say,
//  Alerts = official warnings)
// ═══════════════════════════════════════════════════════════════════════
//
//  ModulePage → PageHeader (freshness of the feed, source) →
//  Explainer (how many stories, the biggest topic, how fresh the newest is)
//  → 4 StatTiles → ONE picture: "What the news is about", a tile per topic
//  (name, count, a bar for its share). The tiles are also the filter: tap
//  one to see only that topic → the stories, grouped by topic, as TapCards
//  (headline, publisher, time, a line of summary) → tapping a story opens a
//  DetailSheet: the summary, publisher, date and time, topic, the data page
//  it is about, and "Open the story" → AI summary → charts (2 per row on
//  laptop/PC): who reported it, and when the stories came out → Share /
//  Compare. No emoji: each topic has its own crafted glyph and pastel
//  colour (src/components/graphics), on its tile, its group heading and
//  every story card, so crime, weather and farming look different at a
//  glance. Sources are in the layout's verification panel; reports go
//  through the site-wide "Report a problem" button.
//
//  v5.3: headlines read quietly — story cards use TapCard density="compact"
//  (15 px regular-weight titles, 14 px on phones, no shadow, less padding),
//  a smaller glyph, smaller topic headings and a smaller sheet title.
//
//  Every story says WHERE it came from and WHEN. Headlines and summaries are
//  live data (translated once in the backend when a translation exists; the
//  row's `lang` says which language it is in).
//
//  i18n: page_news (en / kn / hi).
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import Link from "next/link";
import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Newspaper, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNews, type NewsItem } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import {
  ModulePage, PageHeader, LoadingShell, ErrorBlock, StatStrip, StatTile, Section,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, CHART_AXIS, Explainer, chartTooltipStyle } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { OTHER_SHADE, ShareDonut, type DonutSlice } from "@/components/community/CommunityVisuals";
import { TapCard } from "@/components/community/TapCard";
import { cleanText, useNow } from "@/components/community/pageTools";
import { PageActions } from "@/components/district/page-kit";
import AIInsightCard from "@/components/common/AIInsightCard";
import { hueClass } from "@/lib/design/hues";
import {
  CategoryGlyph,
  GlyphEmptyState,
  GlyphStack,
  glyphPick,
  newsStoryGlyph,
  newsTopicGlyph,
  type GlyphPick,
} from "@/components/graphics";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

/** A story as the API returns it; `lang` is set when a stored translation was swapped in. */
type Story = NewsItem & { lang?: string };

/** The page_news translator, handed to small helpers. */
type T = ReturnType<typeof useTranslations>;

// Module tags: the news pipeline tags each story with the module it is about
// (targetModule). Key = that slug (the link target); `hue` = the module whose
// colour the tag borrows; label = page_news.moduleTags.<slug>.
const MODULE_TAGS: Record<string, { hue: string }> = {
  "leaders":              { hue: "leadership" },
  "infrastructure":       { hue: "infrastructure" },
  "budget":               { hue: "finance" },
  "water":                { hue: "water" },
  "crops":                { hue: "crops" },
  "weather":              { hue: "weather" },
  "police":               { hue: "police" },
  "elections":            { hue: "elections" },
  "education":            { hue: "schools" },
  "health":               { hue: "health" },
  "transport":            { hue: "transport" },
  "schemes":              { hue: "schemes" },
  "housing":              { hue: "housing" },
  "power":                { hue: "power" },
  "courts":               { hue: "courts" },
  "industries":           { hue: "industries" },
  "jjm":                  { hue: "jjm" },
  "gram-panchayat":       { hue: "gram-panchayat" },
  "alerts":               { hue: "alerts" },
  "famous-personalities": { hue: "famous-personalities" },
  "citizen-corner":       { hue: "citizen-corner" },
  "offices":              { hue: "offices" },
  "rti":                  { hue: "rti" },
  "exams":                { hue: "exams" },
  "sugar-factory":        { hue: "industries" },
  "soil":                 { hue: "farm" },
  "population":           { hue: "population" },
  "news":                 { hue: "news" },
};

/**
 * A module tag that points at a real data page. "news" is the pipeline's
 * "no particular page" tag, so it is neither a link nor a pill.
 */
function linksToPage(slug: string | null | undefined): slug is string {
  return Boolean(slug && slug !== "news" && MODULE_TAGS[slug]);
}

/** Module tags that are not a page of their own link to the page that holds them. */
const TAG_ROUTE: Record<string, string> = {
  leaders: "leadership",
  budget: "finance",
  education: "schools",
  "sugar-factory": "industries",
  soil: "farm",
};

/** How many publishers get their own slice before the rest are grouped. */
const TOP_PUBLISHERS = 5;
/** Days shown in "When the stories came out". */
const TIMELINE_DAYS = 14;

function topicOf(n: Story): string {
  return n.category || "general";
}

/** Translated topic name; an unknown category is shown in sentence case. */
function topicLabel(t: T, category: string): string {
  const key = `topics.${category}`;
  if (t.has(key)) return t(key);
  const s = category.replace(/[-_]/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : category;
}

function publisherOf(n: Story): string {
  return (n.publisher ?? n.source ?? "").trim();
}

/** A small pill in a module's hue: "Water and dams". */
function ModulePill({ slug }: { slug: string }) {
  const t = useTranslations("page_news");
  const tag = MODULE_TAGS[slug];
  if (!tag) return null;
  const key = `moduleTags.${slug}`;
  return (
    <span
      className={hueClass(tag.hue)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 24,
        padding: "0 9px",
        borderRadius: "var(--ftp-radius-pill)",
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
        color: "var(--hue-deep)",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {t.has(key) ? t(key) : slug}
    </span>
  );
}

/**
 * One topic tile in the picture, in the topic's own pastel colour with its
 * glyph (or, for "All stories", the busiest topics' glyphs stacked). It is
 * also the filter button for that topic.
 */
function TopicTile({
  label,
  count,
  total,
  active,
  onClick,
  pick,
  stack,
}: {
  label: string;
  count: number;
  total: number;
  active: boolean;
  onClick: () => void;
  /** The topic's glyph; its hue colours the whole tile. */
  pick?: GlyphPick;
  /** For "All stories": the glyphs of the busiest topics. */
  stack?: GlyphPick[];
}) {
  const f = useFormat();
  const share = total > 0 ? count / total : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`ftp-card-link${pick ? ` ${hueClass(pick.hue)}` : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 8,
        minHeight: 44,
        padding: "12px 12px 10px",
        borderRadius: 14,
        border: `2px solid ${active ? "var(--hue)" : "color-mix(in srgb, var(--hue) 18%, var(--ftp-border))"}`,
        background: active
          ? "var(--hue-tint)"
          : "linear-gradient(160deg, var(--ftp-surface) 45%, color-mix(in srgb, var(--hue-tint) 85%, var(--ftp-surface)))",
        cursor: "pointer",
        textAlign: "start",
        font: "inherit",
        color: "var(--ftp-text)",
        minWidth: 0,
      }}
    >
      {/* Picture and count on top, the name on its own line (it wraps at word breaks, never mid-word). */}
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
        {pick && <CategoryGlyph pick={pick} size={36} chip />}
        {!pick && stack && <GlyphStack picks={stack} size={32} />}
        <span className="ftp-bignum" style={{ fontSize: 20, lineHeight: 1, color: "var(--hue-deep)" }}>{f.number(count)}</span>
      </span>
      <span style={{ minWidth: 0, fontSize: 13, lineHeight: "18px", fontWeight: 600, overflowWrap: "break-word" }}>{label}</span>
      <span aria-hidden style={{ height: 6, borderRadius: 99, background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
        <span className="ftp-grow-x" style={{ display: "block", height: "100%", width: `${Math.max(4, Math.round(share * 100))}%`, borderRadius: 99, background: "linear-gradient(90deg, var(--hue-pop), var(--hue))" }} />
      </span>
    </button>
  );
}

/** One story as a card; tapping it opens the detail sheet. */
function StoryCard({ n, onOpen }: { n: Story; onOpen: (n: Story) => void }) {
  const t = useTranslations("page_news");
  const f = useFormat();
  const headline = cleanText(n.headline);
  const summary = n.summary ? cleanText(n.summary) : "";
  const showSummary = summary && summary !== headline && !headline.startsWith(summary);
  return (
    <TapCard
      density="compact"
      onOpen={() => onOpen(n)}
      leading={<CategoryGlyph pick={newsStoryGlyph(n)} size={32} chip />}
      title={headline}
      titleLang={n.lang}
      subtitle={
        <span suppressHydrationWarning>
          {t("byLine", { publisher: publisherOf(n) || t("unknownPublisher"), when: f.ago(n.publishedAt) })}
        </span>
      }
      hint={t("readMore")}
    >
      {showSummary && (
        <p
          lang={n.lang}
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: "19px",
            color: "var(--ftp-text-2)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </p>
      )}
      {linksToPage(n.targetModule) && (
        <div>
          <ModulePill slug={n.targetModule} />
        </div>
      )}
    </TapCard>
  );
}

const sheetButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 14,
  fontWeight: 650,
  textDecoration: "none",
  flex: "1 1 auto",
};

/** Everything about one story. */
function StorySheet({ n, base, onClose }: { n: Story; base: string; onClose: () => void }) {
  const t = useTranslations("page_news");
  const mt = useModuleText();
  const f = useFormat();
  const headline = cleanText(n.headline);
  const summary = n.summary ? cleanText(n.summary) : "";
  const tag = linksToPage(n.targetModule) ? MODULE_TAGS[n.targetModule] : undefined;
  const route = tag && n.targetModule ? TAG_ROUTE[n.targetModule] ?? n.targetModule : null;
  const topic = topicOf(n);
  const english = f.locale !== "en" && (!n.lang || n.lang === "en");

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={<span style={{ fontSize: 17, lineHeight: "24px", fontWeight: 600 }}>{headline}</span>}
      titleLang={n.lang}
      subtitle={publisherOf(n) || undefined}
      media={<CategoryGlyph pick={newsStoryGlyph(n)} size={44} chip />}
      hueClassName={hueClass("news")}
      footer={
        <>
          {n.url && (
            <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ ...sheetButton, background: "var(--hue)", color: "var(--ftp-surface)", border: "1px solid var(--hue)" }}>
              {t("openStory")}
              <ExternalLink size={14} aria-hidden />
            </a>
          )}
          {tag && route && (
            <Link href={`${base}/${route}`} className={hueClass(tag.hue)} style={{ ...sheetButton, background: "var(--ftp-surface)", color: "var(--hue-deep)", border: "1px solid var(--ftp-border)" }}>
              {t("seePage", { page: mt.label(route) })}
            </Link>
          )}
        </>
      }
    >
      {summary && summary !== headline && (
        <p lang={n.lang} className="ftp-prose" style={{ margin: 0, fontSize: 15, lineHeight: "24px", color: "var(--ftp-text)" }}>
          {summary}
        </p>
      )}
      <DetailList
        rows={[
          { label: t("sheet.publisher"), value: publisherOf(n) || t("unknownPublisher") },
          {
            label: t("sheet.published"),
            value: (
              <span suppressHydrationWarning>
                {t("sheet.publishedValue", {
                  date: f.date(n.publishedAt, { day: "numeric", month: "long", year: "numeric" }),
                  time: f.time(n.publishedAt, { hour: "numeric", minute: "2-digit" }),
                  ago: f.ago(n.publishedAt),
                })}
              </span>
            ),
          },
          { label: t("sheet.topic"), value: topicLabel(t, topic) },
          { label: t("sheet.about"), value: n.targetModule && tag ? <ModulePill slug={n.targetModule} /> : null },
          { label: t("sheet.change"), value: n.moduleAction ?? null },
        ]}
      />
      {english && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {t("sheet.inEnglish")}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        {t("sheet.note")}
      </p>
    </DetailSheet>
  );
}

function NewsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_news");
  const tNo = useTranslations("noData");
  const f = useFormat();
  const now = useNow();
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useNews(district, state);
  const freshness = useFreshness(state, district).forModule("news");
  const districtName = useDistrictName(state, district);
  const [topic, setTopic] = useState("all");
  const [selected, setSelected] = useState<Story | null>(null);
  const close = useCallback(() => setSelected(null), []);

  const news = (data?.data ?? []) as Story[];

  // Topics, biggest first (counted from the same list shown below).
  const topicCounts = Array.from(
    news.reduce((m, n) => m.set(topicOf(n), (m.get(topicOf(n)) ?? 0) + 1), new Map<string, number>()),
    ([category, count]) => ({ category, count }),
  ).sort((a, b) => b.count - a.count);
  const topTopic = topicCounts[0];
  const activeTopic = topic === "all" || topicCounts.some((c) => c.category === topic) ? topic : "all";
  const groups = topicCounts
    .filter((c) => activeTopic === "all" || c.category === activeTopic)
    .map((c) => ({ ...c, stories: news.filter((n) => topicOf(n) === c.category) }));

  const latest = news.reduce<string | null>((max, n) => (!max || n.publishedAt > max ? n.publishedAt : max), null);
  // Stories tagged with a real data page ("news" = no particular page).
  const linkedCount = news.filter((n) => linksToPage(n.targetModule)).length;

  // Publishers (the name shown on each card).
  const byPublisher = new Map<string, number>();
  for (const n of news) {
    const name = publisherOf(n);
    if (name) byPublisher.set(name, (byPublisher.get(name) ?? 0) + 1);
  }
  const publisherCounts = Array.from(byPublisher, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const restCount = publisherCounts.slice(TOP_PUBLISHERS).reduce((s, p) => s + p.count, 0);
  const publisherSlices: DonutSlice[] = [
    ...publisherCounts.slice(0, TOP_PUBLISHERS).map((p) => ({ key: p.name, label: p.name, value: p.count })),
    ...(restCount > 0 ? [{ key: "__other", label: t("otherPublishers"), value: restCount, color: OTHER_SHADE }] : []),
  ];
  const publishedTotal = publisherCounts.reduce((s, p) => s + p.count, 0);
  const showPublishers = news.length >= 3 && publisherCounts.length >= 2;
  const topPublisher = publisherCounts[0];

  // When the stories came out: one bar per day for the last TIMELINE_DAYS days (IST).
  const dayKey = (d: string | number) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const days = Array.from({ length: TIMELINE_DAYS }, (_, i) => {
    const ms = now - (TIMELINE_DAYS - 1 - i) * 86_400_000;
    return { key: dayKey(ms), ms };
  });
  const perDay = days.map((d) => ({
    key: d.key,
    label: f.date(d.ms, { day: "numeric", month: "short" }),
    stories: news.filter((n) => dayKey(n.publishedAt) === d.key).length,
  }));
  const inWindow = perDay.reduce((s, d) => s + d.stories, 0);
  const activeDays = perDay.filter((d) => d.stories > 0).length;
  const busiest = [...perDay].sort((a, b) => b.stories - a.stories)[0];
  const showDays = inWindow >= 3 && activeDays >= 2;

  const bold = (c: React.ReactNode) => <strong>{c}</strong>;

  return (
    <ModulePage>
      <PageHeader
        icon={Newspaper}
        title={t("title")}
        description={t("description")}
        backHref={base}
        freshness={freshness?.asOf ? { asOf: freshness.asOf, status: freshness.status } : latest ? { asOf: latest } : undefined}
        source={{ label: "Google News RSS" }}
      />

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && news.length === 0 && (
        <GlyphEmptyState
          pick={glyphPick("general")}
          companions={[glyphPick("weather"), glyphPick("farming")]}
          title={tNo("news.title")}
          body={tNo("news.body", { district: districtName })}
        />
      )}

      {!isLoading && news.length > 0 && (
        <>
          <Explainer>
            {topTopic && latest
              ? t.rich("simple", {
                  count: news.length,
                  district: districtName,
                  topic: topicLabel(t, topTopic.category),
                  topicCount: topTopic.count,
                  newest: f.ago(latest),
                  b: bold,
                })
              : null}
          </Explainer>

          <StatStrip cols={4}>
            <StatTile label={t("statArticles")} value={f.number(news.length)} sub={t("statArticlesSub")} asOf={latest} />
            <StatTile
              label={t("statTopics")}
              value={f.number(topicCounts.length)}
              sub={topTopic ? t("statTopicsSub", { topic: topicLabel(t, topTopic.category) }) : undefined}
            />
            <StatTile label={t("statPublishers")} value={f.number(publisherCounts.length)} sub={t("statPublishersSub")} />
            <StatTile label={t("statLinked")} value={f.number(linkedCount)} sub={t("statLinkedSub")} />
          </StatStrip>

          {/* The one picture: what the news is about. Each tile is also the topic filter. */}
          <Section title={t("aboutTitle")}>
            <p className="ftp-prose" style={{ margin: "-4px 0 12px", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("aboutIntro")}</p>
            <div role="group" aria-label={t("filterLabel")} className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "min(148px, calc(50% - 5px))", gap: 10 }}>
              <TopicTile
                label={t("all")}
                count={news.length}
                total={news.length}
                active={activeTopic === "all"}
                onClick={() => setTopic("all")}
                stack={topicCounts.slice(0, 3).map((c) => newsTopicGlyph(c.category))}
              />
              {topicCounts.map((c) => (
                <TopicTile
                  key={c.category}
                  label={topicLabel(t, c.category)}
                  count={c.count}
                  total={news.length}
                  active={activeTopic === c.category}
                  onClick={() => setTopic(c.category)}
                  pick={newsTopicGlyph(c.category)}
                />
              ))}
            </div>
          </Section>

          {/* The stories, grouped by topic. */}
          {groups.map((g) => (
            <Section
              key={g.category}
              title={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <CategoryGlyph pick={newsTopicGlyph(g.category)} size={28} chip />
                  <span style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650 }}>
                    {topicLabel(t, g.category)}{" "}
                    <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{t("groupCount", { n: f.number(g.count) })}</span>
                  </span>
                </span>
              }
            >
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "300px", gap: 12 }}>
                {g.stories.map((n) => (
                  <StoryCard key={n.id} n={n} onOpen={setSelected} />
                ))}
              </div>
            </Section>
          ))}

          <div style={{ marginTop: 20 }}>
            <AIInsightCard module="news" district={district} />
          </div>

          {/* Charts: 2 per row on laptop and PC. */}
          {(showPublishers || showDays) && (
            <Section title={t("chartsTitle")}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {showPublishers && topPublisher && (
                  <ChartCard
                    title={t("publishersTitle")}
                    units={t("publishersUnits")}
                    simple={t.rich("publishersSimple", { name: topPublisher.name, n: f.number(topPublisher.count), total: f.number(publishedTotal), b: bold })}
                    source={{ label: "Google News RSS" }}
                    asOf={latest}
                    table={publisherSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
                  >
                    <ShareDonut
                      slices={publisherSlices}
                      centerValue={f.number(publishedTotal)}
                      centerLabel={t("storiesWord", { n: publishedTotal })}
                      ariaLabel={t("publishersAria", { name: topPublisher.name, n: f.number(topPublisher.count), total: f.number(publishedTotal) })}
                    />
                  </ChartCard>
                )}
                {showDays && busiest && (
                  <ChartCard
                    title={t("daysTitle")}
                    units={t("daysUnits", { n: TIMELINE_DAYS })}
                    simple={t.rich("daysSimple", { day: busiest.label, n: busiest.stories, count: f.number(busiest.stories), b: bold })}
                    source={{ label: "Google News RSS" }}
                    asOf={latest}
                    table={perDay.map((d) => ({ label: d.label, value: f.number(d.stories) }))}
                  >
                    <div style={{ width: "100%", height: 230 }} role="img" aria-label={t("daysAria", { n: TIMELINE_DAYS, total: f.number(inWindow) })}>
                      <ResponsiveContainer>
                        <BarChart data={perDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                          <ChartGradients />
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                          <XAxis dataKey="label" tick={CHART_AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                          <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [f.number(Number(v)), t("storiesWord", { n: Number(v) })]} />
                          <Bar dataKey="stories" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="news" />
      </div>

      {selected && <StorySheet n={selected} base={base} onClose={close} />}
    </ModulePage>
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

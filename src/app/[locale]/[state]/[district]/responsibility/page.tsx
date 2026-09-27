/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  What you can do — module page (v4.1, docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//  The question: "What can I do for my district, right now?"
//  The answer, in one sentence: "In the last 2 weeks most news about
//  Mandya was about water (5 stories), so saving water is at the top."
//
//  ModulePage → PageHeader → Explainer → 4 StatTiles → the picture
//  (TopicBars: this fortnight's news by topic) → "Because of what's in the
//  news" (one action card per busy topic, with the headline that triggered
//  it; tap → steps, why, the headlines, helpline) → all the things you can
//  do, as tappable cards, with the areas that are in the news first (tap →
//  why, who to tell, call / website, source) → areas ring → CSV · Share ·
//  Compare. No emoji: topics and areas are words. Emergency numbers are on
//  "Helplines & your rights"; sources are in the layout's verification
//  panel.
//
//  Responsibilities change with the news: /api/data/responsibility-news
//  counts the district's last 14 days of news by topic with a plain rule
//  table (src/lib/civic/news-topics.ts), no AI. When there is no news, the
//  page says so and keeps its usual order.
//
//  Data paths for the actions, unchanged: researched district actions from
//  /api/data/responsibility, else the general guide (responsibility-
//  content.ts, English reference text). Interface text: the
//  "page_responsibility" namespace.
"use client";

import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Flame, Megaphone } from "lucide-react";
import {
  Card,
  Chips,
  LoadingShell,
  ModulePage,
  PageHeader,
  Section,
  StatStrip,
  StatTile,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { IconPictogram, PageActions } from "@/components/district/page-kit";
import { HueDonut } from "@/components/district/civic/HueDonut";
import {
  ActionCard,
  ActionSheet,
  AreaCard,
  AreaSheet,
  TopicBars,
  TopicCard,
  TopicSheet,
  useTopicText,
  type ResearchItem,
} from "@/components/district/civic/ResponsibilityParts";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { getResponsibilityContent } from "@/lib/constants/responsibility-content";
import { topicRule } from "@/lib/civic/news-topics";
import type { NewsTopicCount, ResponsibilityNewsPayload } from "@/app/api/data/responsibility-news/route";
import knDict from "@/dictionaries/kn.json";

type DistrictSpecificSection = {
  section: string;
  icon: string;
  order: number;
  items: ResearchItem[];
};

type ResponsibilityApiResponse = {
  data: {
    districtName: string;
    districtSlug: string;
    sections: DistrictSpecificSection[];
    itemCount: number;
  } | null;
  fallback: "generic" | null;
};

/** Topic cards shown in "Because of what's in the news". */
const TOP_TOPICS = 4;

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface AreaCount {
  key: string;
  label: string;
  value: number;
}

/** Chart: how the actions spread across areas (hidden with fewer than two areas). */
function AreasRing({ areas }: { areas: AreaCount[] }) {
  const t = useTranslations("page_responsibility");
  const f = useFormat();
  const total = areas.reduce((n, a) => n + a.value, 0);
  if (areas.length < 2 || total === 0) return null;
  const sorted = [...areas].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const tied = sorted.filter((a) => a.value === top.value).length;
  const simple =
    tied === sorted.length
      ? t("chartEven", { n: f.number(top.value) })
      : tied > 1
        ? t("chartTied", { count: f.number(tied), n: f.number(top.value) })
        : t.rich("chartTop", { top: top.label, n: f.number(top.value), total: f.number(total), b: (c) => <strong>{c}</strong> });
  const summary = sorted.map((a) => `${a.label}: ${f.number(a.value)}`).join(", ");
  return (
    <ChartCard
      title={t("chartTitle")}
      units={t("chartUnits")}
      simple={simple}
      table={sorted.map((a) => ({ label: a.label, value: f.number(a.value) }))}
    >
      <HueDonut
        slices={areas.map((a) => ({ key: a.key, label: a.label, value: a.value }))}
        centerValue={f.number(total)}
        centerLabel={t("chartCenter", { n: total })}
        ariaLabel={t("chartAria", { summary })}
        otherLabel={t("otherAreas")}
      />
    </ChartCard>
  );
}

export default function ResponsibilityPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_responsibility");
  const mt = useModuleText();
  const f = useFormat();
  const topicText = useTopicText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const [area, setArea] = useState("all");
  const [topicOpen, setTopicOpen] = useState<NewsTopicCount | null>(null);
  const [actionOpen, setActionOpen] = useState<{ item: ResearchItem; area: string } | null>(null);
  const [areaOpen, setAreaOpen] = useState<{ title: string; items: string[] } | null>(null);
  const closeTopic = useCallback(() => setTopicOpen(null), []);
  const closeAction = useCallback(() => setActionOpen(null), []);
  const closeArea = useCallback(() => setAreaOpen(null), []);

  const { data: apiData, isLoading } = useQuery<ResponsibilityApiResponse>({
    queryKey: ["responsibility", state, district],
    queryFn: () => fetch(`/api/data/responsibility?state=${state}&district=${district}`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  const { data: newsResp, isLoading: newsLoading, isError: newsError } = useQuery<{ data: ResponsibilityNewsPayload | null }>({
    queryKey: ["responsibility-news", state, district, locale],
    queryFn: () => fetch(`/api/data/responsibility-news?state=${state}&district=${district}&locale=${locale}`).then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const districtSpecific = apiData?.data && apiData.data.sections.length > 0 ? apiData.data : null;
  const genericContent = getResponsibilityContent(district);
  const titleLocal = state === "karnataka" ? knDict.modules.responsibility : undefined;
  const moduleTitle = mt.label("responsibility");
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  // ── News → topics ─────────────────────────────────────────────────
  const news = newsResp?.data ?? null;
  const newsFailed = newsError || (newsResp !== undefined && !news);
  const topics = news?.topics ?? [];
  const topTopics = topics.slice(0, TOP_TOPICS);
  const lead = topTopics[0] ?? null;
  // An area of actions is "in the news" when a busy topic points at it.
  const areaInNews = (title: string) => topTopics.some((x) => topicRule(x.topic)?.areas?.test(title));
  const newsRank = (title: string) => {
    const i = topTopics.findIndex((x) => topicRule(x.topic)?.areas?.test(title));
    return i === -1 ? TOP_TOPICS : i;
  };

  // ── Actions ───────────────────────────────────────────────────────
  const specificSections = districtSpecific
    ? [...districtSpecific.sections].sort((a, c) => newsRank(a.section) - newsRank(c.section) || a.order - c.order)
    : [];
  const specificItems = specificSections.flatMap((s) => s.items);
  const withContact = specificItems.filter((item) => item.reportTo?.name).length;
  const contactShare = specificItems.length > 0 ? withContact / specificItems.length : 0;

  const genericActionSections = genericContent.sections
    .filter((s) => !s.isProjection)
    .map((s, i) => ({ ...s, i }))
    .sort((a, c) => newsRank(a.title) - newsRank(c.title) || a.i - c.i);
  const genericProjection = genericContent.sections.find((s) => s.isProjection) ?? null;
  const genericActionCount = genericActionSections.reduce((n, s) => n + s.items.length, 0);

  const actionCount = districtSpecific ? districtSpecific.itemCount : genericActionCount;
  const areaCount = districtSpecific ? districtSpecific.sections.length : genericActionSections.length;
  const areas: AreaCount[] = districtSpecific
    ? specificSections.map((s) => ({ key: s.section, label: s.section, value: s.items.length }))
    : genericActionSections.map((s) => ({ key: s.title, label: s.title, value: s.items.length }));

  const onCsv = () =>
    districtSpecific
      ? downloadCsv(
          `${district}-responsibility.csv`,
          districtSpecific.sections.flatMap((s) =>
            s.items.map((item) => ({
              section: s.section,
              action: item.action,
              why_relevant: item.whyRelevant,
              report_to: item.reportTo?.name ?? "",
              report_url: item.reportTo?.url ?? "",
              report_phone: item.reportTo?.phone ?? "",
              source: item.sourceNotes ?? "",
            })),
          ),
        )
      : downloadCsv(
          `${district}-responsibility.csv`,
          genericContent.sections.flatMap((s) => s.items.map((item) => ({ section: s.title, action: item }))),
        );

  const chipItems = [
    { value: "all", label: t("all"), count: actionCount },
    ...areas.map((a) => ({ value: a.key, label: a.label, count: a.value })),
  ];

  return (
    <ModulePage>
      <PageHeader
        icon={Flame}
        title={moduleTitle}
        titleLocal={titleLocal}
        description={districtSpecific ? t("descSpecific", { name: districtName }) : t("descGeneric", { name: districtName })}
        backHref={base}
        freshness={news?.latestAt ? { asOf: news.latestAt, thresholdHours: 48 } : undefined}
      />

      {!isLoading && !newsLoading && (
        <Explainer>
          {lead
            ? t.rich("simpleNews", {
                name: districtName,
                topic: topicText.label(lead.topic),
                n: lead.count,
                action: topicText.action(lead.topic),
                b,
              })
            : districtSpecific
              ? t.rich("simpleSpecific", { n: actionCount, areas: areaCount, name: districtName, b })
              : t.rich("simpleGeneric", { n: genericActionCount, areas: areaCount, name: districtName, b })}
        </Explainer>
      )}

      {(isLoading || newsLoading) && <LoadingShell rows={3} />}

      {!isLoading && (
        <StatStrip>
          {news && <StatTile label={t("tileNews")} value={f.number(news.totalStories)} sub={t("tileNewsSub", { n: news.topicalStories })} />}
          {lead && (
            <StatTile
              label={t("tileTopTopic")}
              value={topicText.label(lead.topic)}
              sub={t("tileTopTopicSub", { n: lead.count })}
              countUp={false}
            />
          )}
          <StatTile label={t("tileActions")} value={f.number(actionCount)} sub={t("tileActionsSub", { areas: areaCount })} />
          {districtSpecific ? (
            <StatTile label={t("tileContacts")} value={f.number(withContact)} sub={t("tileContactsSub")} />
          ) : (
            <StatTile label={t("tileAreas")} value={f.number(areaCount)} sub={t("tileAreasSub")} />
          )}
        </StatStrip>
      )}

      {/* The picture: what the news is about. Without news, the contact
          pictogram (researched districts) explains the list instead. */}
      {topics.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <TopicBars topics={topics} name={districtName} latestAt={news?.latestAt ?? null} />
          </Card>
        </div>
      ) : (
        districtSpecific &&
        withContact > 0 && (
          <div style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <IconPictogram icon={Megaphone} filled={contactShare * 10} label={t("pictogramContact", { n: Math.round(contactShare * 10) })} />
            </Card>
          </div>
        )
      )}

      {/* Because of what's in the news */}
      {!newsLoading && (
        <Section title={t("newsTitle")}>
          {topTopics.length > 0 ? (
            <>
              <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
                {t("newsLead", { name: districtName })}
              </p>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
                {topTopics.map((x) => (
                  <TopicCard key={x.topic} x={x} onOpen={setTopicOpen} />
                ))}
              </div>
            </>
          ) : (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
              {newsFailed ? t("newsError") : t("newsNone", { name: districtName })}
            </p>
          )}
        </Section>
      )}

      {/* All the things you can do */}
      {!isLoading && (
        <Section title={t("allTitle")}>
          <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
            {topTopics.length > 0 ? t("allLeadNews") : t("allLead")}
          </p>
          {districtSpecific ? (
            <>
              {areas.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <Chips label={t("chipsLabel")} value={area} onChange={setArea} items={chipItems} />
                </div>
              )}
              <div className="ftp-grid">
                {specificSections
                  .filter((s) => area === "all" || s.section === area)
                  .flatMap((s) => {
                    const inNews = areaInNews(s.section);
                    return s.items.map((item, idx) => (
                      <ActionCard
                        key={`${s.section}-${idx}`}
                        item={item}
                        area={s.section}
                        inNews={inNews}
                        onOpen={() => setActionOpen({ item, area: s.section })}
                      />
                    ));
                  })}
              </div>
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 16 }}>
                {t("footSpecific")}
              </p>
            </>
          ) : (
            <>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
                {genericActionSections.map((s) => {
                  return (
                    <AreaCard
                      key={s.title}
                      title={s.title}
                      items={s.items}
                      inNews={areaInNews(s.title)}
                      onOpen={() => setAreaOpen({ title: s.title, items: s.items })}
                    />
                  );
                })}
              </div>
              {genericProjection && (
                <div style={{ marginTop: 16 }}>
                  <Card tinted padding={18}>
                    <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
                      {genericProjection.title}
                    </p>
                    <p className="ftp-body" style={{ margin: "4px 0 10px", color: "var(--ftp-text-2)" }}>
                      {t("projectionLead", { name: districtName })}
                    </p>
                    <ul className="ftp-prose" style={{ margin: 0, paddingInlineStart: 20, display: "grid", gap: 6, fontSize: 14, lineHeight: "21px" }}>
                      {genericProjection.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 16 }}>
                {t("footGeneric", { name: districtName })}
              </p>
            </>
          )}
        </Section>
      )}

      {/* How the actions spread across areas (hidden with fewer than two). */}
      {!isLoading && areas.length >= 2 && (
        <div style={{ marginTop: 28, maxWidth: 640 }}>
          <AreasRing areas={areas} />
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="responsibility" onCsv={isLoading ? undefined : onCsv} csvLabel={t("downloadCsv")} />
      </div>

      <TopicSheet x={topicOpen} onClose={closeTopic} name={districtName} base={base} />
      <ActionSheet open={actionOpen} onClose={closeAction} />
      <AreaSheet open={areaOpen} onClose={closeArea} />
    </ModulePage>
  );
}

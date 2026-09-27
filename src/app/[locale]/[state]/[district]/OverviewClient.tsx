/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  District overview — v5 "calm", v5.1 "Warm Calm"
// ═══════════════════════════════════════════════════════════
//
//  What a visitor needs first, then details, then the fine print:
//
//   Above the fold
//   1. District hero  — a pastel sky in the district's colours, its
//                       landmark drawing, the name (+ local script), the
//                       state and taluk count, one or two tagline chips.
//                       The state and taluk switchers are in the bar above.
//   2. Number tiles   — colourful tiles: warnings (only when active),
//                       people, projects, budget (says "Old year" when it
//                       is), next election with a countdown, report card
//                       (only while current), MP. Overview only (v5.1).
//   3. Warning banner — only while a high or critical warning is active.
//
//   Below
//   4. Leaders, people, projects and money — four picture cards
//      (OverviewCard: drawn mark, pastel wash, one visual each) + tenders.
//   5. Recent news and notices — three headlines, the next state or
//      district exam, and weather / mandi in one honest line each
//      ("the last reading is from 20 Apr, 160 days ago").
//   6. Taluks as compact chips.
//   7. Report card, folded.
//   8. All topics, folded (the sidebar and drawer already list them).
//   9. Check this data (VerifyPanel, with the double-check status of each
//      dataset when the verification API is live), then supporters last.
//
//  Removed in v5: the "Today" tiles, the 37-tile module grid, the identity
//  card's census tiles, freshness pills and health ring, the tenders
//  "Locked" card, the map, the "Report an issue" paragraph.
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, BookOpen, ExternalLink, MapPin, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFormat, useModuleText } from "@/i18n/client";
import { placeName, placeNamePair } from "@/i18n/place-name";
import { getDistrict } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { getGroupedModules } from "@/lib/constants/sidebar-modules";
import { getDistrictHue, hueClass } from "@/lib/design/hues";
import { ageInDays, calendarDaysAgoIST } from "@/lib/utils/timeAgo";
import { useAlerts, useCropPrices, useExams, useNews } from "@/hooks/useRealtimeData";
import TodayWeatherTile from "@/components/district/TodayWeatherTile";
import type { ExamsData, LocalAlert } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import { Card, ModulePage, Section } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DistrictSponsorBanner from "@/components/common/DistrictSponsorBanner";
import { useModuleGroupName } from "@/components/layout/useModuleGroups";
import { DistrictHealthScoreCard } from "@/components/district/DistrictHealthScoreCard";
import DistrictIdentityCard from "@/components/district/DistrictIdentityCard";
import InfraSnippet from "@/components/district/InfraSnippet";
import LeadersSnippet from "@/components/district/LeadersSnippet";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
import PopulationSnippet from "@/components/district/PopulationSnippet";
import TenderSnippet from "@/components/district/TenderSnippet";
import GlanceRow from "@/components/district/shell/GlanceRow";
import MoneySnippet from "@/components/district/shell/MoneySnippet";
import VerifyPanel from "@/components/district/shell/VerifyPanel";
import type { DistrictBadge } from "@/lib/constants/districts";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  stateName: string;
  districtData: {
    name: string;
    nameLocal?: string;
    tagline?: string;
    population?: number | null;
    area?: number | null;
    talukCount?: number;
    villageCount?: number | null;
    literacy?: number | null;
    sexRatio?: number | null;
    active: boolean;
    badges?: DistrictBadge[];
    taluks: Array<{ slug: string; name: string; nameLocal?: string; tagline?: string }>;
  };
}

// Mandi prices count as "now" for 7 days, a headline for 30 days. Older
// ones are named with their age instead. (Weather: TodayWeatherTile.)
const MANDI_MAX_DAYS = 7;
const NEWS_MAX_DAYS = 30;
const SERIOUS = new Set(["critical", "high", "severe"]);

type Exam = ExamsData["stateExams"][number];

/**
 * The next state or district exam (or open application deadline). National
 * exams are left out: they are not news about this district.
 */
function pickNextExam(data: ExamsData | undefined): { exam: Exam; date: string; kind: "exam" | "apply" } | null {
  if (!data) return null;
  const nowMs = Date.now();
  const local = [...(data.districtExams ?? []), ...(data.stateExams ?? []).filter((e) => e.level !== "national")];
  const upcoming: Array<{ exam: Exam; date: string; kind: "exam" | "apply" }> = [];
  for (const exam of local) {
    if (exam.examDate && new Date(exam.examDate).getTime() >= nowMs) upcoming.push({ exam, date: exam.examDate, kind: "exam" });
    else if (exam.endDate && new Date(exam.endDate).getTime() >= nowMs) upcoming.push({ exam, date: exam.endDate, kind: "apply" });
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}

/** The most serious active warning, only if it is high or critical. */
function pickSeriousAlert(alerts: LocalAlert[]): LocalAlert | null {
  const rank: Record<string, number> = { critical: 0, high: 1, severe: 1 };
  const serious = alerts.filter((a) => a.active !== false && SERIOUS.has((a.severity ?? "").toLowerCase()));
  serious.sort((a, b) => (rank[a.severity.toLowerCase()] ?? 9) - (rank[b.severity.toLowerCase()] ?? 9));
  return serious[0] ?? null;
}

/** One line in "Recent news and notices": a small icon in the module hue + text, linking to the module. */
function NoticeLine({ href, module, icon: Icon, children }: { href: string; module: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className={hueClass(module)}>
      <Link href={href} className="ftp-ov-line">
        <span className="ftp-ov-line-icon" aria-hidden>
          <Icon size={14} />
        </span>
        <span>{children}</span>
      </Link>
    </li>
  );
}

export default function OverviewClient({ locale, stateSlug, districtSlug, stateName, districtData }: Props) {
  const t = useTranslations("overview");
  const to = useTranslations("page_overview");
  const tsh = useTranslations("page_shell");
  const tu = useTranslations("subUnits");
  const mt = useModuleText();
  const groupName = useModuleGroupName();
  const f = useFormat();
  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const stateConfig = getStateConfig(stateSlug, districtSlug);
  const subUnitEn = stateConfig?.subDistrictUnitPlural ?? "Taluks";
  const subUnitPlural = tu.has(subUnitEn) ? tu(subUnitEn) : subUnitEn;
  const reg = getDistrict(stateSlug, districtSlug);
  const displayName = placeName({ name: districtData.name, nameLocal: districtData.nameLocal, names: reg?.names }, locale);

  // ── Data (existing hooks; React Query shares them with other components) ──
  const { data: crops } = useCropPrices(districtSlug, stateSlug);
  const { data: alerts } = useAlerts(districtSlug, stateSlug);
  const { data: newsData, isLoading: newsLoading } = useNews(districtSlug, stateSlug);
  const { data: examsData } = useExams(districtSlug, stateSlug);
  const fresh = useFreshness(stateSlug, districtSlug);

  // ── Warning banner ──
  const serious = pickSeriousAlert(alerts?.data ?? []);

  // ── Recent: headlines, exam, weather, mandi ──
  const headlines = (newsData?.data ?? []).filter((n) => {
    const age = ageInDays(n.publishedAt);
    return age !== null && age <= NEWS_MAX_DAYS;
  }).slice(0, 3);
  const nextExam = pickNextExam(examsData?.data);
  const latestCrop = crops?.data?.[0];
  const cropAge = latestCrop ? ageInDays(latestCrop.date) : null;
  const cropFresh = cropAge !== null && cropAge <= MANDI_MAX_DAYS;
  const day = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });

  // ── All topics (folded index) ──
  const groups = getGroupedModules().map((g) => ({ ...g, modules: g.modules.filter((m) => m.slug !== "overview") })).filter((g) => g.modules.length > 0);
  const topicCount = groups.reduce((n, g) => n + g.modules.length, 0);

  return (
    <ModulePage className="ftp-overview">
      {/* ═══ 1. District hero ═══ */}
      <DistrictIdentityCard
        districtSlug={districtSlug}
        name={districtData.name}
        nameLocal={districtData.nameLocal}
        names={reg?.names}
        stateName={stateName}
        tagline={districtData.tagline}
        badges={districtData.tagline ? districtData.badges?.slice(0, 1) : districtData.badges?.slice(0, 2)}
        subUnitCount={districtData.taluks.length || null}
        subUnitLabel={subUnitPlural}
        showStats={false}
      />

      {/* ═══ 2. Number tiles ═══ */}
      <div style={{ marginTop: 14 }}>
        <GlanceRow stateSlug={stateSlug} districtSlug={districtSlug} />
      </div>

      {/* ═══ 3. Serious warning (only while one is active) ═══ */}
      {serious && (
        <Link href={`${base}/alerts`} className="ftp-ov-alert" data-severity={serious.severity.toLowerCase()}>
          <AlertTriangle size={18} aria-hidden />
          <span>
            <strong>{to("v5.alertLead")}: </strong>
            {serious.title}
          </span>
          <span className="ftp-ov-alert-see">{to("v5.alertSee")}</span>
        </Link>
      )}
      <div style={{ marginTop: 12 }}>
        <LiveElectionBanner stateSlug={stateSlug} leadershipHref={`${base}/leadership`} />
      </div>

      {/* ═══ 4. Leaders, people, projects and money ═══ */}
      <Section title={to("v5.basics")}>
        <div className="ftp-ov-grid">
          <LeadersSnippet district={districtSlug} state={stateSlug} base={base} />
          <PopulationSnippet district={districtSlug} state={stateSlug} base={base} />
          <InfraSnippet district={districtSlug} state={stateSlug} base={base} />
          <MoneySnippet district={districtSlug} state={stateSlug} base={base} />
          <TenderSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />
        </div>
      </Section>

      {/* ═══ 5. Recent news and notices ═══ */}
      <Section
        title={to("v5.recent")}
        action={
          <Link href={`${base}/news`} style={{ fontSize: 14, fontWeight: 600, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            {to("v5.allNews")}
          </Link>
        }
      >
        <Card padding={0}>
          {headlines.length > 0 ? (
            <ul className="ftp-ov-news">
              {headlines.map((n) => (
                <li key={n.id}>
                  <a href={n.url ?? `${base}/news`} target={n.url ? "_blank" : undefined} rel={n.url ? "noopener noreferrer" : undefined} className="ftp-ov-news-link">
                    <span className="ftp-ov-news-title">{n.headline}</span>
                    <span className="ftp-ov-news-meta">
                      {to("v5.newsMeta", { publisher: n.publisher || n.source, date: f.ago(n.publishedAt) })}
                      {n.url && (
                        <>
                          {" "}
                          <ExternalLink size={11} aria-hidden />
                          <span className="sr-only">{to("v5.opensNewTab")}</span>
                        </>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !newsLoading && <p className="ftp-ov-empty">{to("v5.noNews")}</p>
          )}

          <ul className="ftp-ov-lines">
            {nextExam && (
              <NoticeLine href={`${base}/exams`} module="exams" icon={BookOpen}>
                {nextExam.kind === "exam"
                  ? to("v5.examNext", { title: nextExam.exam.title, date: day(nextExam.date) })
                  : to("v5.examApply", { title: nextExam.exam.title, date: day(nextExam.date) })}
              </NoticeLine>
            )}
            {/* Today + tomorrow from the forecast service (falls back to the stored reading, labelled with its age). */}
            <TodayWeatherTile locale={locale} state={stateSlug} district={districtSlug} />
            {latestCrop && (
              <NoticeLine href={`${base}/crops`} module="crops" icon={Wheat}>
                {cropFresh
                  ? to("v5.mandiNow", {
                      commodity: latestCrop.commodity,
                      price: f.number(Math.round(latestCrop.modalPrice / 100)),
                      market: latestCrop.market,
                      date: day(latestCrop.date),
                    })
                  : to("v5.mandiOld", { date: day(latestCrop.date), n: calendarDaysAgoIST(latestCrop.date) ?? 0 })}
              </NoticeLine>
            )}
          </ul>
        </Card>
        {/* AI reading of the district — hides itself when older than 30
            days or older than the data it would describe. */}
        <div style={{ marginTop: 12 }}>
          <AIInsightCard module="overview" district={districtSlug} />
        </div>
      </Section>

      {/* ═══ 6. Taluks ═══ */}
      {districtData.taluks.length > 0 && (
        <Section title={t("subUnits", { units: subUnitPlural, name: displayName })}>
          <ul className={`ftp-ov-taluks ${hueClass(getDistrictHue(districtSlug))}`}>
            {districtData.taluks.map((tal) => {
              const names = placeNamePair(
                { name: tal.name, nameLocal: tal.nameLocal, names: reg?.taluks.find((x) => x.slug === tal.slug)?.names },
                locale,
              );
              return (
                <li key={tal.slug}>
                  <Link href={`${base}/${tal.slug}`} className="ftp-ov-taluk">
                    <MapPin size={13} aria-hidden className="ftp-ov-taluk-pin" />
                    <span lang={names.primaryLang}>{names.primary}</span>
                    {names.secondary && (
                      <span lang={names.secondaryLang} className="ftp-ov-taluk-local">{names.secondary}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* ═══ 7. Report card (folded) ═══ */}
      <div style={{ marginTop: 28 }}>
        <DistrictHealthScoreCard districtSlug={districtSlug} />
      </div>

      {/* ═══ 8. All topics (folded; the sidebar and drawer list them too) ═══ */}
      <details className="ftp-ov-topics">
        <summary>{to("v5.topics.open", { n: topicCount, name: displayName })}</summary>
        <p className="ftp-ov-topics-note">{to("v5.topics.soonNote", { name: displayName })}</p>
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`ftp-ov-topics-${g.key}`}>
            <h3 id={`ftp-ov-topics-${g.key}`} className="ftp-ov-topics-group">{groupName(g.key)}</h3>
            <ul className="ftp-ov-topics-list">
              {g.modules.map((m) => {
                const soon = fresh.primary(m.slug)?.status === "not_collected";
                return (
                  <li key={m.slug} className={hueClass(m.slug)}>
                    <Link href={`${base}/${m.slug}`} className="ftp-ov-topic" data-soon={soon ? "true" : undefined}>
                      <span className="ftp-ov-topic-emoji ftp-emoji" aria-hidden>{m.emoji}</span>
                      <span>{mt.label(m.slug)}</span>
                      {soon && <span className="ftp-ov-soon">{tsh("nav.comingSoon")}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </details>

      {/* ═══ 9. Check this data, then supporters last ═══ */}
      <div style={{ marginTop: 28 }}>
        <VerifyPanel stateSlug={stateSlug} districtSlug={districtSlug} variant="overview" />
      </div>
      <div style={{ marginTop: 28 }}>
        <DistrictSponsorBanner
          district={districtSlug}
          state={stateSlug}
          districtName={districtData.name}
          stateName={stateName}
          locale={locale}
        />
      </div>
    </ModulePage>
  );
}

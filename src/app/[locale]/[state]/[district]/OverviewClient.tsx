/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
//  District overview — Design v3 "Civic Ledger" (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════
//
//  The page reads top to bottom like a page of a public ledger:
//
//   1. Identity card  — H1 name + local-script name, tagline chips,
//                       health grade ring, then 4 Census numbers and
//                       a row of "how fresh is the data" pills.
//   2. Today in X     — 5 small tiles (weather, mandi, one headline,
//                       next exam or alert, budget spent). Each tile
//                       only shows when its data is recent enough
//                       (weather 24 h, the rest 30 days); otherwise the
//                       slot says so honestly in one line.
//   3. Module groups  — the same 5 groups as the left rail, as cards
//                       listing every module with a freshness dot.
//   4. At a glance    — leaders, population, infrastructure, tenders
//                       snippets (each hides itself when empty).
//   5. Sub-districts, supporters and "Report an issue" as quiet links.
//
//  All data hooks are unchanged from v2; only the layout changed.
"use client";

import { useTranslations } from "next-intl";
import { scriptLang } from "@/lib/utils/script-lang";
import { useFormat, useModuleText } from "@/i18n/client";
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import {
  useOverview, useCropPrices, useWeather, useAlerts, useBudget, useNews, useExams,
  usePopulationProfile,
} from "@/hooks/useRealtimeData";
import type { ExamsData, LocalAlert } from "@/hooks/useRealtimeData";
import { useFreshness } from "@/hooks/useFreshness";
import type { FreshnessStatus } from "@/hooks/useFreshness";
import { getTieredModules } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { ageInDays, isWithinMinutes } from "@/lib/utils/timeAgo";
import {
  AsOfText, Card, EmptyState, FreshnessPill, LoadingShell, Pill, ProgressBar, Section,
  SourcePill,
} from "@/components/district/ui";
import { weatherEmoji } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import { DistrictHealthScoreCard } from "@/components/district/DistrictHealthScoreCard";
import DistrictIdentityCard from "@/components/district/DistrictIdentityCard";
import DistrictSponsorBanner from "@/components/common/DistrictSponsorBanner";
import { getStateConfig } from "@/lib/constants/state-config";
import InfraSnippet from "@/components/district/InfraSnippet";
import LeadersSnippet from "@/components/district/LeadersSnippet";
import PopulationSnippet from "@/components/district/PopulationSnippet";
import TenderSnippet from "@/components/district/TenderSnippet";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
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

// ── Freshness thresholds for the "Today" tiles ─────────────
const WEATHER_MAX_MINUTES = 24 * 60; // weather older than a day is not "today"
const TODAY_MAX_DAYS = 30; // everything else: last 30 days

/** Freshness-API status → kit tone for the small dot in the module list. */
const STATUS_DOT: Record<FreshnessStatus, string> = {
  green: "var(--ftp-live)",
  amber: "var(--ftp-warn)",
  red: "var(--ftp-danger)",
  unknown: "var(--ftp-border-strong)",
};

/** Modules whose freshness we show in the identity card's freshness row. */
const FRESHNESS_ROW: Array<{ slug: string; label: string }> = [
  { slug: "weather", label: "freshWeather" },
  { slug: "crops", label: "freshMandi" },
  { slug: "water", label: "freshDams" },
  { slug: "news", label: "freshNews" },
];

type Exam = ExamsData["stateExams"][number];

/**
 * The next exam date (or the soonest open application deadline) from today.
 * Reads the clock here, outside the component body, so render stays pure.
 */
function pickNextExam(data: ExamsData | undefined): { exam: Exam; date: string; kind: "Exam" | "Apply by" } | null {
  if (!data) return null;
  const nowMs = Date.now();
  const all = [...(data.districtExams ?? []), ...(data.stateExams ?? [])];
  const upcoming: Array<{ exam: Exam; date: string; kind: "Exam" | "Apply by" }> = [];
  for (const exam of all) {
    if (exam.examDate && new Date(exam.examDate).getTime() >= nowMs) upcoming.push({ exam, date: exam.examDate, kind: "Exam" });
    else if (exam.endDate && new Date(exam.endDate).getTime() >= nowMs) upcoming.push({ exam, date: exam.endDate, kind: "Apply by" });
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}

/** Highest-severity active alert, if any. */
function pickAlert(alerts: LocalAlert[]): LocalAlert | null {
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const active = alerts.filter((a) => a.active !== false);
  active.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));
  return active[0] ?? null;
}

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

// ── Today tile ─────────────────────────────────────────────
/**
 * One compact "Today" tile: label row (icon + 11 px label), a mono value,
 * one line of context, then "As of …" + a (non-link) SourcePill. The whole
 * tile links to its module. The SourcePill is plain text here because a
 * link inside a link is invalid HTML.
 */
function TodayTile({
  href, emoji, hue, label, value, unit, sub, asOf, asOfText, source, visual,
}: {
  href: string;
  emoji: string;
  hue: string;
  label: string;
  value?: React.ReactNode;
  unit?: string;
  sub?: string;
  asOf?: string | null;
  /** Used instead of `asOf` when the as-of is a period (e.g. "FY 2024-25"). */
  asOfText?: string;
  source?: string | null;
  /** Optional picture under the number (progress bar, glyph…). */
  visual?: React.ReactNode;
}) {
  return (
    <div className={`ftp-hue-${hue}`} style={{ height: "100%" }}>
      <Card href={href} padding={14} tinted style={{ height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 17, borderRadius: 10 }}>
            {emoji}
          </span>
          <span className="ftp-label" style={{ color: "var(--hue-deep)" }}>{label}</span>
        </div>
        {value !== undefined && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap", minWidth: 0 }}>
            <span className="ftp-bignum" style={{ fontSize: 28, lineHeight: "32px", color: "var(--hue-deep)" }}>{value}</span>
            {unit && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ftp-text-2)" }}>{unit}</span>}
          </div>
        )}
        {sub && (
          <p
            className="ftp-body"
            style={{ color: "var(--ftp-text)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
          >
            {sub}
          </p>
        )}
        {visual && <div style={{ marginTop: 10 }}>{visual}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {asOf ? <AsOfText asOf={asOf} /> : asOfText ? <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{asOfText}</span> : null}
          {source && <SourcePill label={source} />}
        </div>
      </Card>
    </div>
  );
}

/** A Today slot with no recent data: one honest sentence + a link to the module. */
function TodayEmpty({ label, emoji, hue, sentence, href }: { label: string; emoji: string; hue: string; sentence: string; href: string }) {
  return (
    // order: 1 → empty slots sit after the tiles that have data.
    <div className={`ftp-hue-${hue}`} style={{ height: "100%", order: 1 }}>
      <Card href={href} padding={14} style={{ height: "100%", borderStyle: "dashed", boxShadow: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 17, borderRadius: 10, filter: "grayscale(0.6)" }}>
            {emoji}
          </span>
          <span className="ftp-label">{label}</span>
        </div>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{sentence}</p>
      </Card>
    </div>
  );
}

export default function OverviewClient({ locale, stateSlug, districtSlug, stateName, districtData }: Props) {
  const t = useTranslations("overview");
  const ts = useTranslations("status");
  const tu = useTranslations("subUnits");
  const mt = useModuleText();
  const f = useFormat();
  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const stateConfig = getStateConfig(stateSlug);
  const subUnitEn = stateConfig?.subDistrictUnitPlural ?? "Taluks";
  const subUnitPlural = tu.has(subUnitEn) ? tu(subUnitEn) : subUnitEn;
  // In sentences, use the district's local name when the UI is in its language.
  const displayName =
    districtData.nameLocal && districtData.nameLocal !== districtData.name && scriptLang(districtData.nameLocal) === locale
      ? districtData.nameLocal
      : districtData.name;

  // ── Data (same hooks and API calls as v2) ──
  const { data: overview } = useOverview(districtSlug, stateSlug);
  const { data: crops, isLoading: cropsLoading } = useCropPrices(districtSlug, stateSlug);
  const { data: weather, isLoading: weatherLoading } = useWeather(districtSlug, stateSlug);
  const { data: alerts } = useAlerts(districtSlug, stateSlug);
  const { data: budgetData, isLoading: budgetLoading } = useBudget(districtSlug, stateSlug);
  const { data: newsData, isLoading: newsLoading } = useNews(districtSlug, stateSlug);
  const { data: examsData, isLoading: examsLoading } = useExams(districtSlug, stateSlug);
  const fresh = useFreshness(stateSlug, districtSlug);
  const { data: censusData } = usePopulationProfile(districtSlug, stateSlug);

  // Identity-card numbers: use the sourced census row from the database when
  // it exists. The registry figures are a mix of census counts and later
  // estimates, so they are shown without a census label.
  const census = censusData?.data ?? null;
  const cardPopulation = census?.totalPopulation ?? districtData.population;
  const cardLiteracy = census?.literacyTotal ?? districtData.literacy;
  const cardArea = census?.areaSqKm ?? districtData.area;
  const cardStatsAsOf = census?.totalPopulation ? census.dataset : null;
  const cardStatsSource = census?.totalPopulation && census.sourceUrl
    ? { label: t("censusOfIndia"), href: census.sourceUrl }
    : null;

  // Taluk count: prefer the live DB list, fall back to the registry.
  const dbTalukCount = overview?.data?.taluks?.length;
  const displayedTalukCount = dbTalukCount ?? districtData.talukCount;

  // ── Weather: latest reading, only if under 24 h old ──
  const latestWeather = weather?.data?.[0];
  const weatherFresh = latestWeather ? isWithinMinutes(latestWeather.recordedAt, WEATHER_MAX_MINUTES) : false;

  // ── Mandi: newest price row, only if under 30 days old ──
  const latestCrop = crops?.data?.[0];
  const cropAge = latestCrop ? ageInDays(latestCrop.date) : null;
  const cropFresh = cropAge !== null && cropAge <= TODAY_MAX_DAYS;

  // ── Headline: newest news item, only if under 30 days old ──
  const headline = newsData?.data?.[0];
  const headlineAge = headline ? ageInDays(headline.publishedAt) : null;
  const headlineFresh = headlineAge !== null && headlineAge <= TODAY_MAX_DAYS;

  // ── Alert (preferred) or next exam ──
  const topAlert = pickAlert(alerts?.data ?? []);
  const nextExam = pickNextExam(examsData?.data);

  // ── Budget: latest fiscal year only (matches the finance page) ──
  const allBudgetEntries = budgetData?.data?.entries ?? [];
  const latestFY = allBudgetEntries.length > 0 ? allBudgetEntries[0].fiscalYear : null;
  const budgetEntries = latestFY ? allBudgetEntries.filter((e) => e.fiscalYear === latestFY) : [];
  const totalAllocated = budgetEntries.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = budgetEntries.reduce((s, e) => s + e.spent, 0);
  const spentPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const budgetSource = budgetEntries.find((e) => e.source)?.source ?? null;

  const groups = getTieredModules();

  return (
    // Side padding 24 px on desktop, 16 px on phones (CONCEPT-v3 §2.2);
    // content capped at the 960 px reading width.
    <div className="px-4 md:px-6 pt-6 pb-12" style={{ maxWidth: "calc(var(--ftp-reading-max) + 48px)" }}>

      {/* ═══ 1. Identity card ═══════════════════════════════ */}
      <DistrictIdentityCard
        districtSlug={districtSlug}
        name={districtData.name}
        nameLocal={districtData.nameLocal}
        stateName={stateName}
        tagline={districtData.tagline}
        badges={districtData.badges}
        population={cardPopulation}
        area={cardArea}
        literacy={cardLiteracy}
        statsAsOf={cardStatsAsOf}
        statsSource={cardStatsSource}
        subUnitCount={displayedTalukCount}
        subUnitLabel={subUnitPlural}
        healthSlug={districtSlug}
      >
        {/* Freshness row — one pill per live feed, from /api/data/freshness. */}
        {Object.keys(fresh.modules).length > 0 && (
          <div
            role="group"
            aria-label={ts("howRecent")}
            style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--ftp-border)" }}
          >
            {FRESHNESS_ROW.map(({ slug, label }) => {
              const f = fresh.forModule(slug);
              if (!f?.asOf) return null;
              return (
                <span key={slug} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{t(label)}</span>
                  <FreshnessPill asOf={f.asOf} status={f.status} />
                </span>
              );
            })}
          </div>
        )}
      </DistrictIdentityCard>

      {/* Election notice — renders only when polling is within 30 days. */}
      <div style={{ marginTop: 16 }}>
        <LiveElectionBanner stateSlug={stateSlug} leadershipHref={`${base}/leadership`} />
      </div>

      {/* ═══ 2. Today in <district> ═════════════════════════ */}
      <Section title={t("today", { name: displayName })} emoji="☀️">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 100%), 1fr))",
            gap: 12,
          }}
        >
          {/* Weather (≤ 24 h) */}
          {weatherLoading ? (
            <LoadingShell rows={1} />
          ) : latestWeather && weatherFresh ? (
            <TodayTile
              href={`${base}/weather`}
              emoji={weatherEmoji(latestWeather.conditions)}
              hue="sky"
              label={t("weather")}
              value={latestWeather.temperature != null ? `${Math.round(latestWeather.temperature)}` : "—"}
              unit={latestWeather.temperature != null ? "°C" : undefined}
              sub={latestWeather.conditions ?? undefined}
              asOf={latestWeather.recordedAt}
              source={latestWeather.source}
            />
          ) : (
            <TodayEmpty href={`${base}/weather`} emoji="🌦️" hue="sky" label={t("weather")} sentence={t("noWeather")} />
          )}

          {/* Mandi (≤ 30 d) — modal price is per quintal; shown per kg. */}
          {cropsLoading ? (
            <LoadingShell rows={1} />
          ) : latestCrop && cropFresh ? (
            <TodayTile
              href={`${base}/crops`}
              emoji="🌾"
              hue="green"
              label={t("mandi")}
              value={`₹${Math.round(latestCrop.modalPrice / 100).toLocaleString("en-IN")}`}
              unit="/kg"
              sub={`${latestCrop.commodity} · ${latestCrop.market}`}
              asOf={latestCrop.date}
              source={latestCrop.source}
            />
          ) : (
            <TodayEmpty href={`${base}/crops`} emoji="🌾" hue="green" label={t("mandi")} sentence={t("noMandi")} />
          )}

          {/* One headline (≤ 30 d) */}
          {newsLoading ? (
            <LoadingShell rows={1} />
          ) : headline && headlineFresh ? (
            <TodayTile
              href={`${base}/news`}
              emoji="📰"
              hue="blue"
              label={t("headline")}
              sub={headline.headline}
              asOf={headline.publishedAt}
              source={headline.publisher || headline.source}
            />
          ) : (
            <TodayEmpty href={`${base}/news`} emoji="📰" hue="blue" label={t("headline")} sentence={t("noNews")} />
          )}

          {/* Alert (preferred) or next exam */}
          {topAlert ? (
            <div className="ftp-hue-rose" style={{ height: "100%" }}>
            <Card href={`${base}/alerts`} padding={14} tinted style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 17, borderRadius: 10 }}>⚠️</span>
                <span className="ftp-label" style={{ color: "var(--hue-deep)" }}>{t("alert")}</span>
                <Pill tone={topAlert.severity === "critical" || topAlert.severity === "high" ? "danger" : "warn"} style={{ marginLeft: "auto", textTransform: "capitalize" }}>
                  {topAlert.severity}
                </Pill>
              </div>
              <p className="ftp-body" style={{ fontWeight: 500, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {topAlert.title}
              </p>
              <div style={{ marginTop: 8 }}>
                <AsOfText asOf={topAlert.startDate ?? topAlert.createdAt} prefix="Issued" />
              </div>
            </Card>
            </div>
          ) : examsLoading ? (
            <LoadingShell rows={1} />
          ) : nextExam ? (
            <TodayTile
              href={`${base}/exams`}
              emoji="📝"
              hue="violet"
              label={nextExam.kind === "Exam" ? t("nextExam") : t("applyBy")}
              value={shortDay(nextExam.date)}
              sub={nextExam.exam.title}
              asOfText={nextExam.exam.department}
            />
          ) : (
            <TodayEmpty href={`${base}/exams`} emoji="📝" hue="violet" label={t("examsAlerts")} sentence={t("noExams")} />
          )}

          {/* Budget spent % for the latest financial year */}
          {budgetLoading ? (
            <LoadingShell rows={1} />
          ) : budgetEntries.length > 0 && totalAllocated > 0 ? (
            <TodayTile
              href={`${base}/finance`}
              emoji="💰"
              hue="amber"
              label={t("budgetSpent")}
              value={spentPct.toFixed(1)}
              unit="%"
              sub={t("spentOf", { spent: f.number(Math.round(totalSpent / 1e7)), total: f.number(Math.round(totalAllocated / 1e7)) })}
              visual={<ProgressBar pct={spentPct} height={8} />}
              asOfText={latestFY ? `FY ${latestFY}` : undefined}
              source={budgetSource}
            />
          ) : (
            <TodayEmpty href={`${base}/finance`} emoji="💰" hue="amber" label={t("budgetSpent")} sentence={t("noBudget")} />
          )}
        </div>
      </Section>

      {/* AI summary of the overview (renders nothing when there is none). */}
      <div style={{ marginTop: 16 }}>
        <AIInsightCard module="overview" district={districtSlug} />
      </div>

      {/* ═══ 3. Every dashboard, as colourful emoji tiles ═════ */}
      <Section title={t("explore", { name: displayName })} emoji="🧭">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groups.map((group) => {
            const mods = group.modules.filter((m) => m.slug !== "overview");
            if (mods.length === 0) return null;
            return (
              <section key={group.label} aria-label={mt.group(group.label)}>
                <h3 className="ftp-display" style={{ margin: "0 0 10px", fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>
                  {mt.group(group.label)}
                </h3>
                <ul className="ftp-module-grid">
                  {mods.map((mod) => {
                    const f = fresh.forModule(mod.slug);
                    return (
                      <li key={mod.slug} className={hueClass(mod.slug)}>
                        <Link href={`${base}/${mod.slug}`} className="ftp-module-tile ftp-card-link">
                          <span className="ftp-module-emoji ftp-emoji" aria-hidden>
                            {mod.emoji}
                          </span>
                          <span className="ftp-module-name">{mt.label(mod.slug)}</span>
                          <span className="ftp-module-desc">{mt.description(mod.slug)}</span>
                          {f && (
                            <>
                              <span
                                aria-hidden
                                className="ftp-module-dot"
                                title={f.age ? t("dataUpdated", { age: f.age }) : t("noRecentData")}
                                style={{ background: STATUS_DOT[f.status] }}
                              />
                              <span className="sr-only">{f.age ? t("dataUpdated", { age: f.age }) : t("noRecentData")}</span>
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      {/* ═══ 4. At a glance — each snippet hides itself when it has no data ═══ */}
      <Section title={t("atAGlance")} emoji="👀">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))",
            gap: 12,
            alignItems: "start",
          }}
        >
          <LeadersSnippet district={districtSlug} state={stateSlug} base={base} />
          <PopulationSnippet district={districtSlug} state={stateSlug} base={base} />
          <InfraSnippet district={districtSlug} state={stateSlug} base={base} />
          <TenderSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />
        </div>
        <div style={{ marginTop: 12 }}>
          <DistrictHealthScoreCard districtSlug={districtSlug} />
        </div>
      </Section>

      {/* ═══ 5a. Sub-districts ══════════════════════════════ */}
      {districtData.taluks.length > 0 && (
        <Section title={t("subUnits", { units: subUnitPlural, name: displayName })} emoji="🏘️">
          <ul
            style={{
              listStyle: "none", margin: 0, padding: 0,
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 8,
            }}
          >
            {districtData.taluks.map((t) => (
              <li key={t.slug}>
                <Card href={`${base}/${t.slug}`} padding={12} style={{ minHeight: 44 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span className="ftp-title" style={{ fontSize: 13, lineHeight: "20px" }}>{t.name}</span>
                    {t.nameLocal && t.nameLocal !== t.name && (
                      <span lang="und" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{t.nameLocal}</span>
                    )}
                  </span>
                  {t.tagline && <span style={{ display: "block", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{t.tagline}</span>}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ═══ 5b. Supporters + report an issue (quiet) ═══════ */}
      <div style={{ marginTop: 32 }}>
        <DistrictSponsorBanner
          district={districtSlug}
          state={stateSlug}
          districtName={districtData.name}
          stateName={stateName}
          locale={locale}
        />
      </div>
      <p className="ftp-body" style={{ marginTop: 16, color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <MessageSquareWarning size={14} aria-hidden />
        {t("somethingWrong")}
        <Link
          href={`/${locale}/feedback`}
          style={{ color: "var(--ftp-brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}
        >
          {t("reportIssue")}
        </Link>
      </p>

      {/* When nothing at all has loaded for a brand-new district, say so. */}
      {!weatherLoading && !cropsLoading && !newsLoading && !budgetLoading && !latestWeather && !latestCrop && !headline && budgetEntries.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            title={t("addedRecently", { name: displayName })}
            body={t("addedRecentlyBody")}
          />
        </div>
      )}
    </div>
  );
}

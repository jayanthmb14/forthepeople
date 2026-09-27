/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Orchestrator for /[locale]/india/[moduleSlug] — the per-module
 * deep-dive dashboard:
 *
 *   1. Breadcrumb (Home › India › super-category › module)
 *   2. Hero: chips, title, description, latest published figures
 *   3. Legal note (defence, health, elections, justice)
 *   4. "Being set up" notice for modules that are not live yet
 *   5. Pictures, each only when its real rows exist:
 *        top states · energy mix · goal progress · rings · trend
 *   6. News, what is planned next, related modules, sources
 *
 * Honesty (Sep 2026): everything numeric here reads IndiaIndicator,
 * IndiaTimeSeries or IndiaStateBreakdown. The earlier placeholders — the
 * registry mockValue headline, a hash-generated 10-year line, a state map
 * and leaderboard filled from mock-state-data, and a "MOCK" AI analysis —
 * are gone. A picture with no rows behind it is simply not drawn.
 *
 * v4.1 (Sep 2026): the page sits in the kit's 1320 px ModulePage frame
 * (docs/LAYOUT.md); an "In simple words" sentence is built from the
 * headline row; every figure tile and every state bar opens a
 * DetailSheet; the pictures sit in an auto-fill grid (1 column on phones,
 * 2 on tablets, 2–3 on laptops and PCs).
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Home } from "lucide-react";
import { type IndiaModuleDef, getModuleNewsKeywords } from "@/lib/india/india-modules";
import { getSuperCategoryBySlug } from "@/lib/india/india-super-categories";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { ModulePage as PageFrame, Section } from "@/components/district/ui";
import { ChartCard } from "@/components/district/visuals";
import ModuleHero from "./ModuleHero";
import { toFigure } from "./figures";
import ModuleNewsStrip from "./ModuleNewsStrip";
import ModuleSourcePanel from "./ModuleSourcePanel";
import ModuleRelatedModules from "./ModuleRelatedModules";
import ModuleComingSoonRail from "./ModuleComingSoonRail";
import { TopStatesBars, MixDonut, PercentRings, GoalBars, type BarItem, type MixPart } from "./ModuleVisuals";
import TrendLine from "./TrendLine";
import IndiaReportIssueButton from "@/components/india/IndiaReportIssueButton";
import { indiaCategoryHue } from "./v4";
import {
  GOAL_PAIRS,
  getModuleIndicators,
  getModuleSeries,
  getModuleStates,
  groupIndicators,
  pickHeadline,
  type IndicatorRow,
} from "./data";
import { fmtDate, fmtDecimal, formatIndicator, formatIndicatorText } from "../format";
import { INDIA_NS, indiaText } from "../i18n";

interface Props {
  locale: string;
  module: IndiaModuleDef;
}

const MIX_ORDER = ["coal", "renewables", "hydro", "nuclear"];
const MIX_EMOJI: Record<string, string> = { coal: "🪨", renewables: "☀️", hydro: "💧", nuclear: "⚛️" };
/** Colours people already link with each source: coal grey, sun amber, water blue, atom violet. */
const MIX_COLOR: Record<string, string> = { coal: "#475569", renewables: "#D97706", hydro: "#0369A1", nuclear: "#7C3AED" };
const MAX_TILES = 8;

function tileEmoji(row: IndicatorRow, fallback: string): string {
  if (row.unit === "rank") return "🏆";
  if (row.unit === "percent") return "📊";
  if (row.unit === "year") return "📅";
  return fallback;
}

export default async function ModulePage({ locale, module }: Props) {
  const [t, tp, ti, ts] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-module" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
    getTranslations({ locale, namespace: "states" }),
  ]);
  const x = indiaText(tp, ti);
  const superCategory = getSuperCategoryBySlug(module.superCategory);
  const title = x.moduleTitle(module);
  const isLive = module.status === "live";
  // Name of the first registered source; a key missing from the registry
  // (e.g. "NCERT_POLITY_11") is never shown raw.
  const firstSource =
    module.sources.map((s) => INDIA_SOURCES[s.sourceKey]?.name).find(Boolean) ?? t("soon.theSource");

  const [indicators, series, states] = await Promise.all([
    getModuleIndicators(module.slug),
    getModuleSeries(module.slug),
    getModuleStates(module.slug),
  ]);
  const groups = groupIndicators(indicators);

  const label = (row: IndicatorRow) => {
    const k = `metric.${row.moduleSlug}.${row.metricKey}`;
    return t.has(k) ? t(k) : row.metricLabel;
  };
  const text = (value: number, unit: string | null) => formatIndicatorText(tp, locale, value, unit);
  const stateName = (slug: string, fallback: string) => (ts.has(slug) ? ts(slug) : fallback);

  const hue = indiaCategoryHue(module.category);

  // ── Hero tiles (each opens its own detail sheet) ──────────────────
  const figures = groups.tiles.slice(0, MAX_TILES).map((row) =>
    toFigure(row, { tp, locale, label: label(row), emoji: tileEmoji(row, module.icon) }),
  );

  // ── "In simple words": one sentence from the headline row ─────────
  const headline = pickHeadline(module.headlineMetric?.key, indicators);
  const simple = headline
    ? t("explain.figure", {
        label: label(headline),
        value: text(headline.value ?? 0, headline.unit),
        date: fmtDate(locale, headline.asOf),
        source: headline.source,
      })
    : t("explain.none", { module: title, source: firstSource });

  // ── Pictures ──────────────────────────────────────────────────────
  const pictures: ReactNode[] = [];

  // 1. Top states: IndiaStateBreakdown rows first, else top_state_* indicators.
  const stateRows = Object.values(states).find((rows) => rows.length >= 3);
  let bars: BarItem[] = [];
  let barsSource: { label: string; href?: string } | undefined;
  let barsAsOf: string | undefined;
  if (stateRows) {
    bars = stateRows.slice(0, 5).map((r) => ({
      label: stateName(r.stateSlug, r.stateName),
      value: r.value,
      display: text(r.value, r.unit),
    }));
    barsSource = { label: stateRows[0].source, href: stateRows[0].sourceUrl || undefined };
    barsAsOf = stateRows[0].asOf;
  } else if (groups.topStates.length >= 3) {
    bars = groups.topStates.slice(0, 5).map((s) => {
      const name = stateName(s.stateSlug, s.stateSlug);
      return {
        label: s.crop ? t(`crop.${s.crop}`, { state: name }) : name,
        value: s.row.value ?? 0,
        display: text(s.row.value ?? 0, s.row.unit),
      };
    });
    barsSource = { label: groups.topStates[0].row.source, href: groups.topStates[0].row.sourceUrl || undefined };
    barsAsOf = groups.topStates[0].row.asOf;
  }
  if (bars.length >= 3) {
    pictures.push(
      <TopStatesBars
        key="top"
        title={t("vis.topTitle")}
        emoji="🏆"
        simple={t("vis.topSimple", { first: bars[0].label, value: bars[0].display })}
        items={bars}
        source={barsSource}
        asOf={barsAsOf}
        hueClassName={hue}
      />,
    );
  }

  // 2. Energy mix donut (the parts are published shares; any gap to 100 is "other").
  if (groups.mix.length >= 2) {
    const ordered = [...groups.mix].sort((a, b) => MIX_ORDER.indexOf(a.part) - MIX_ORDER.indexOf(b.part));
    const parts: MixPart[] = ordered.map((m) => ({
      label: t.has(`parts.${m.part}`) ? t(`parts.${m.part}`) : label(m.row),
      emoji: MIX_EMOJI[m.part],
      color: MIX_COLOR[m.part],
      pct: m.row.value ?? 0,
      display: `${fmtDecimal(locale, m.row.value ?? 0, 1)}%`,
    }));
    const sum = parts.reduce((s, p) => s + p.pct, 0);
    if (sum < 99.5) {
      parts.push({ label: t("vis.mixOther"), emoji: "🔋", color: "#CBD5E1", pct: 100 - sum, display: `${fmtDecimal(locale, 100 - sum, 1)}%` });
    }
    const top = [...parts].sort((a, b) => b.pct - a.pct)[0];
    pictures.push(
      <MixDonut
        key="mix"
        title={t("vis.mixTitle")}
        emoji="🔌"
        simple={t("vis.mixSimple", { part: top.label, pct: top.display })}
        parts={parts}
        centerValue={top.display}
        centerLabel={t("vis.mixCenter", { part: top.label })}
        source={{ label: ordered[0].row.source, href: ordered[0].row.sourceUrl || undefined }}
        asOf={ordered[0].row.asOf}
      />,
    );
  }

  // 3. Progress towards a published goal.
  const byKey = new Map(indicators.map((r) => [r.metricKey, r]));
  const goals = (GOAL_PAIRS[module.slug] ?? [])
    .map(([nowKey, goalKey]) => ({ now: byKey.get(nowKey), goal: byKey.get(goalKey) }))
    .filter((p): p is { now: IndicatorRow; goal: IndicatorRow } =>
      Boolean(p.now && p.goal && p.now.value !== null && p.goal.value && p.goal.value > 0),
    )
    .map(({ now, goal }) => {
      const pct = ((now.value ?? 0) / (goal.value ?? 1)) * 100;
      return {
        label: label(now),
        pct,
        pctText: `${fmtDecimal(locale, pct, 0)}%`,
        line: t("vis.goalLine", { now: text(now.value ?? 0, now.unit), goal: text(goal.value ?? 0, goal.unit) }),
        source: { label: goal.source, href: goal.sourceUrl || undefined },
        asOf: now.asOf,
      };
    });
  if (goals.length > 0) {
    pictures.push(
      <GoalBars
        key="goal"
        title={t("vis.goalTitle")}
        emoji="🎯"
        simple={t("vis.goalSimple", { label: goals[0].label, pct: goals[0].pctText })}
        items={goals}
        source={goals[0].source}
        asOf={goals[0].asOf}
      />,
    );
  }

  // 4. Rings for two or more percentages.
  if (groups.percents.length >= 2) {
    pictures.push(
      <PercentRings
        key="rings"
        title={t("vis.ringsTitle")}
        emoji="🍩"
        simple={t("vis.ringsSimple")}
        items={groups.percents.slice(0, 6).map((r) => ({
          label: label(r),
          pct: r.value ?? 0,
          display: `${fmtDecimal(locale, r.value ?? 0, 1)}%`,
        }))}
        source={{ label: groups.percents[0].source, href: groups.percents[0].sourceUrl || undefined }}
        asOf={groups.percents[0].asOf}
      />,
    );
  }

  // 5. A real time series (two or more points).
  const trend = series[0];
  if (trend) {
    const first = trend.points[0];
    const last = trend.points[trend.points.length - 1];
    const year = (iso: string) => String(new Date(iso).getUTCFullYear());
    const unit = formatIndicator(tp, locale, last.value, trend.unit).unit;
    const trendRow = byKey.get(trend.metricKey);
    pictures.push(
      <ChartCard
        key="trend"
        title={t("vis.trendTitle")}
        emoji="📈"
        units={trendRow ? label(trendRow) : undefined}
        simple={t("vis.trendSimple", {
          from: text(first.value, trend.unit),
          fromYear: year(first.date),
          to: text(last.value, trend.unit),
          toYear: year(last.date),
        })}
        source={{ label: trend.source, href: trend.sourceUrl || undefined }}
        asOf={last.date}
        table={trend.points.map((p) => ({ label: year(p.date), value: text(p.value, trend.unit) }))}
      >
        <TrendLine points={trend.points.map((p) => ({ label: year(p.date), value: p.value }))} unitLabel={unit} />
      </ChartCard>,
    );
  }

  const legalNote =
    module.legalNote && ti.has(`disclaimers.${module.legalNote}`) ? ti(`disclaimers.${module.legalNote}`) : null;

  return (
    <main role="main" className={hue} style={{ minHeight: "100vh" }}>
      <PageFrame>
        <nav
          aria-label={t("crumbs.aria")}
          style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13, color: "var(--ftp-text-2)", marginBottom: 14 }}
        >
          <Link href={`/${locale}`} style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Home size={13} aria-hidden />
            {ti("breadcrumb.home")}
          </Link>
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <Link href={`/${locale}/india`} style={{ color: "inherit", textDecoration: "none" }}>
            {ti("breadcrumb.india")}
          </Link>
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          {superCategory ? (
            <Link href={`/${locale}/india/category/${superCategory.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
              {x.scTitle(superCategory)}
            </Link>
          ) : (
            <span>{x.category(module.category)}</span>
          )}
          <ChevronRight size={13} aria-hidden style={{ color: "var(--ftp-border-strong)" }} />
          <span aria-current="page" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
            {title}
          </span>
        </nav>

        <ModuleHero
          module={module}
          title={title}
          description={x.moduleDescription(module)}
          categoryLabel={x.category(module.category)}
          statusLabel={x.status(module.status)}
          isLive={isLive}
          figures={figures}
          figuresTitle={t("hero.figures")}
          tapHint={t("hero.tapHint")}
          simple={simple}
          hueClassName={hue}
          empty={{ title: t("hero.emptyTitle"), body: t("hero.emptyBody", { source: firstSource }) }}
        />

        {legalNote ? (
          <p
            role="note"
            style={{
              margin: "16px 0 0",
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--ftp-text-2)",
              background: "var(--hue-tint)",
              borderInlineStart: "3px solid var(--hue)",
              borderRadius: 10,
            }}
          >
            <span className="ftp-emoji" aria-hidden style={{ marginInlineEnd: 6 }}>
              ⚖️
            </span>
            {legalNote}
          </p>
        ) : null}

        {!isLive ? (
          <div
            role="status"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: "var(--ftp-radius-card)",
              background: "var(--ftp-warn-tint)",
              border: "1px solid color-mix(in srgb, var(--ftp-warn) 30%, #fff)",
              color: "var(--ftp-text)",
              fontSize: 14,
              lineHeight: "21px",
            }}
          >
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 22 }}>
              🚧
            </span>
            <span>
              <strong style={{ display: "block", marginBottom: 2 }}>{t("soon.title")}</strong>
              {t("soon.body", { module: title, source: firstSource })}
            </span>
          </div>
        ) : null}

        {pictures.length > 0 ? (
          <Section title={t("vis.heading")} emoji="🖼️">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
                gap: 16,
                alignItems: "start",
              }}
            >
              {pictures}
            </div>
          </Section>
        ) : null}

        <ModuleNewsStrip locale={locale} newsKeywords={getModuleNewsKeywords(module)} moduleTitle={title} />
        <ModuleComingSoonRail locale={locale} module={module} moduleTitle={title} />
        <ModuleRelatedModules locale={locale} module={module} />
        <ModuleSourcePanel locale={locale} module={module} moduleTitle={title} />
      </PageFrame>

      <IndiaReportIssueButton moduleSlug={module.slug} moduleLabel={title} />
    </main>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & soil advice — layout v4.1 (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "How do I grow my crop better?"
//  The answer, in one line: "There are 6 crop advisories for 4 crops, the
//  newest for the week of 22 Sep. Soil was tested in 12 villages; in 8 of
//  them it is neutral."
//
//    PageHeader → Explainer → 4 StatTiles → picture: every village's soil
//    pH on one strip (or, with no soil tests, what the advice is about) →
//    advisory picture cards, filterable by topic (tap → AdvisorySheet:
//    full advice, crop, topic, week, source, Kisan Call Centre) → soil
//    cards (tap → SoilSheet: pH sentence, N/P/K meters, date, source) →
//    AI insight → charts (soil nutrients · what the advice is about) →
//    news → footer.
//
//  Data: useSoil() → { soil (≤ 20 village reports), advisories (≤ 10
//  newest KVK / ICAR advisories) }. Every advisory shows its week and
//  every soil report its test date, so the header carries no "Updated"
//  pill (the fetch time would look newer than the data). Words come from
//  "page_farm"; numbers and dates through useFormat().
"use client";

import { use, useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { Tractor } from "lucide-react";
import { useSoil } from "@/hooks/useRealtimeData";
import type { AgriAdvisory, SoilHealth } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import {
  PhScale,
  NutrientBars,
  NUTRIENT_FILL,
  advisoryEmoji,
  advisoryTopic,
  nutrientLevel,
  phBand,
  PH_ACIDIC_BELOW,
  PH_ALKALINE_ABOVE,
} from "@/components/farm/SoilVisuals";
import type { NutrientRow } from "@/components/farm/SoilVisuals";
import { cropEmoji } from "@/components/crops/CropVisuals";
import { HueDonut, useDistrictName } from "@/components/land-water/visuals";
import type { DonutSlice } from "@/components/land-water/visuals";
import { Chip, EmojiTile, TapCard, TapHint } from "@/components/land-water/cards";
import { AdvisorySheet, SoilSheet, adviceTexts } from "@/components/land-water/FarmSheets";
import { LandWaterFooter } from "@/components/land-water/PageFooter";
import { scriptLang } from "@/lib/utils/script-lang";

const SHC = { label: "Soil Health Card", href: "https://soilhealth.dac.gov.in" };

/** pH band → colour of the number on a soil card (semantic colour as text only). */
const PH_COLOR = (ph: number) => {
  const band = phBand(ph);
  return band === "acidic" ? "var(--ftp-danger)" : band === "alkaline" ? "var(--ftp-warn)" : "var(--ftp-live-text)";
};

/** "Pest" from "pest" / "PEST" — unknown category chips are sentence case. */
function sentenceCase(s: string): string {
  const x = s.trim().toLowerCase();
  return x ? x[0].toUpperCase() + x.slice(1) : x;
}

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function FarmPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_farm");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useSoil(district, state);
  const [topicFilter, setTopicFilter] = useState("all");
  const [openAdvice, setOpenAdvice] = useState<AgriAdvisory | null>(null);
  const [openSoil, setOpenSoil] = useState<SoilHealth | null>(null);

  const weekDate = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  /** Translated topic for an advisory category; unknown categories are shown as sent. */
  const topicLabel = (category: string) => {
    const topic = advisoryTopic(category);
    return topic ? t(`topic.${topic}`) : sentenceCase(category);
  };
  const levelLabel = (value: string) => {
    const lv = nutrientLevel(value);
    return lv ? t(`level.${lv}`) : value;
  };

  const soilData = data?.data?.soil ?? [];
  const advisories = data?.data?.advisories ?? [];
  const activeAdvisories = advisories.filter((a) => a.active);

  // Soil pH — only villages whose report has a pH reading count.
  const phReadings = soilData.flatMap((s) => (s.pH !== null && s.pH !== undefined ? [{ id: s.id, ph: s.pH }] : []));
  const neutralCount = phReadings.filter((r) => phBand(r.ph) === "neutral").length;
  const avgPh = phReadings.length > 0 ? phReadings.reduce((s, r) => s + r.ph, 0) / phReadings.length : null;
  const latestTest = soilData.reduce<string | null>((best, s) => (s.testedAt && (!best || s.testedAt > best) ? s.testedAt : best), null);
  const latestWeek = activeAdvisories.reduce<string | null>((best, a) => (!best || a.weekOf > best ? a.weekOf : best), null);
  const cropsCovered = new Set(activeAdvisories.map((a) => a.crop.trim().toLowerCase())).size;

  // Topics of the active advisories (filter chips + donut).
  const topicCounts = new Map<string, { key: string; label: string; emoji: string; n: number }>();
  for (const a of activeAdvisories) {
    const key = advisoryTopic(a.category) ?? `other:${a.category.trim().toLowerCase()}`;
    const prev = topicCounts.get(key);
    topicCounts.set(key, { key, label: topicLabel(a.category), emoji: advisoryEmoji(a.category), n: (prev?.n ?? 0) + 1 });
  }
  const topics = Array.from(topicCounts.values()).sort((a, b) => b.n - a.n);
  const topicSlices: DonutSlice[] = topics.map((x) => ({ key: x.key, label: x.label, value: x.n, emoji: x.emoji }));
  const showTopics = activeAdvisories.length >= 2 && topicSlices.length >= 2;
  const topicKeyOf = (a: AgriAdvisory) => advisoryTopic(a.category) ?? `other:${a.category.trim().toLowerCase()}`;
  const shownAdvisories = [...activeAdvisories]
    .sort((a, b) => b.weekOf.localeCompare(a.weekOf))
    .filter((a) => topicFilter === "all" || topicKeyOf(a) === topicFilter);

  // Nitrogen / phosphorus / potassium ratings across villages (recognised ratings only).
  const nutrientRows: NutrientRow[] = (["nitrogen", "phosphorus", "potassium"] as const)
    .map((key) => {
      const row: NutrientRow = { key, low: 0, medium: 0, high: 0 };
      for (const s of soilData) {
        const lv = nutrientLevel(s[key]);
        if (lv) row[lv] += 1;
      }
      return row;
    })
    .filter((r) => r.low + r.medium + r.high > 0);
  const nutrientVillages = Math.max(0, ...nutrientRows.map((r) => r.low + r.medium + r.high));
  const showNutrients = nutrientRows.length > 0 && nutrientVillages >= 2;
  const mostLow = [...nutrientRows].sort((a, b) => b.low / (b.low + b.medium + b.high) - a.low / (a.low + a.medium + a.high))[0];

  const showSoilPicture = phReadings.length >= 2;
  // With no soil picture, the topic donut is the page's picture (and not repeated as a chart).
  const topicsAsPicture = !showSoilPicture && showTopics;

  const shareText = t("share", { district: districtName, advisories: activeAdvisories.length, villages: soilData.length });
  const hasAny = !isLoading && !error && (soilData.length > 0 || advisories.length > 0);

  const topicDonut = (
    <HueDonut
      slices={topicSlices}
      centerValue={f.number(activeAdvisories.length)}
      centerLabel={t("topicsCenter", { n: activeAdvisories.length })}
      ariaLabel={t("topicsAria", {
        list: new Intl.ListFormat(f.intl, { style: "long", type: "conjunction" }).format(
          topicSlices.map((s) => t("topicsAriaItem", { topic: s.label, n: s.value })),
        ),
      })}
    />
  );
  const topicsSimple = topicSlices.length > 0 ? t.rich("topicsSimple", { b: bold, topic: topicSlices[0].label, n: topicSlices[0].value, total: activeAdvisories.length }) : null;

  return (
    <ModulePage>
      <PageHeader icon={Tractor} title={mt.label("farm")} description={t("description")} backHref={base} source={SHC} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && soilData.length === 0 && advisories.length === 0 && (
        <EmptyState emoji="🌱" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
      )}

      {hasAny && (
        <>
          {/* 1 · The answer in plain words. */}
          <Explainer emoji="🚜">
            {activeAdvisories.length > 0 && latestWeek
              ? t.rich("answerAdvice", { b: bold, n: activeAdvisories.length, crops: cropsCovered, date: weekDate(latestWeek) })
              : t("answerNoAdvice")}
            {phReadings.length > 0 && <> {t.rich("answerSoil", { b: bold, total: phReadings.length, neutral: neutralCount })}</>} {t("tapHint")}
          </Explainer>

          {/* 2 · The big numbers. */}
          <StatStrip>
            {advisories.length > 0 && (
              <StatTile
                emoji="📢"
                label={t("tileAdvisories")}
                value={f.number(activeAdvisories.length)}
                sub={latestWeek ? t("tileAdvisoriesSub", { date: weekDate(latestWeek) }) : t("tileAdvisoriesNone")}
              />
            )}
            {activeAdvisories.length > 0 && <StatTile emoji="🌾" label={t("tileCrops")} value={f.number(cropsCovered)} />}
            {soilData.length > 0 && <StatTile emoji="🧪" label={t("tileTested")} value={f.number(soilData.length)} asOf={latestTest} />}
            {avgPh !== null && (
              <StatTile
                emoji="⚖️"
                label={t("tileAvgPh")}
                value={f.number(avgPh, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                sub={t("tileAvgPhSub", { band: phBand(avgPh), n: phReadings.length })}
                countUp={false}
              />
            )}
          </StatStrip>

          {/* 3 · The picture: every village's soil pH on one strip. */}
          {showSoilPicture && (
            <Card tinted padding={18} style={{ marginTop: 16 }}>
              <p className="ftp-display" style={{ margin: "0 0 4px", fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
                {t("soilPictureTitle", { n: phReadings.length })}
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                {t("phBandsHelp", { low: f.number(PH_ACIDIC_BELOW), high: f.number(PH_ALKALINE_ABOVE) })}
              </p>
              <PhScale readings={phReadings} />
            </Card>
          )}
          {topicsAsPicture && (
            <div style={{ marginTop: 16 }}>
              <ChartCard title={t("topicsTitle")} emoji="📢" units={t("topicsUnits")} simple={topicsSimple} source={{ label: "KVK / ICAR" }} asOf={latestWeek}>
                {topicDonut}
              </ChartCard>
            </div>
          )}

          {/* 4a · Advisories as picture cards. Tap → the full advice. */}
          {activeAdvisories.length > 0 && (
            <Section title={t("advisoriesTitle")} emoji="📢">
              {topics.length >= 2 && activeAdvisories.length > 3 && (
                <div style={{ marginBottom: 14 }}>
                  <Chips
                    label={t("topicGroup")}
                    value={topicFilter}
                    onChange={setTopicFilter}
                    items={[
                      { value: "all", label: t("topicAll"), count: activeAdvisories.length },
                      ...topics.map((x) => ({ value: x.key, label: `${x.emoji} ${x.label}`, count: x.n })),
                    ]}
                  />
                </div>
              )}
              <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "280px" }}>
                {shownAdvisories.map((a) => {
                  const lead = adviceTexts(a, locale)[0];
                  return (
                    <li key={a.id}>
                      <TapCard onClick={() => setOpenAdvice(a)} label={t("detailsFor", { name: a.crop })} tinted={advisoryTopic(a.category) === "pest"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <EmojiTile emoji={advisoryEmoji(a.category)} size={48} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, overflowWrap: "anywhere" }}>
                              <span className="ftp-emoji" aria-hidden style={{ marginInlineEnd: 6 }}>
                                {cropEmoji(a.crop)}
                              </span>
                              {a.crop}
                            </h3>
                            {a.cropLocal && a.cropLocal !== a.crop && (
                              <div lang={scriptLang(a.cropLocal)} style={{ fontSize: 13, lineHeight: "18px", color: "var(--hue-deep)" }}>
                                {a.cropLocal}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Chip tone={advisoryTopic(a.category) === "pest" ? "strong" : "hue"}>{topicLabel(a.category)}</Chip>
                          <Chip tone="quiet">{t("weekOf", { date: weekDate(a.weekOf) })}</Chip>
                        </div>
                        <p
                          lang={lead.lang}
                          style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: "22px",
                            color: "var(--ftp-text)",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {lead.text}
                        </p>
                        <TapHint>{t("readAdvice")}</TapHint>
                      </TapCard>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* 4b · Soil reports, one card per village. Tap → the full report. */}
          {soilData.length > 0 && (
            <Section title={t("soilTitle", { n: soilData.length })} emoji="🧪">
              <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "220px" }}>
                {soilData.map((s) => {
                  const hasPh = s.pH !== null && s.pH !== undefined;
                  const npk = (["nitrogen", "phosphorus", "potassium"] as const).filter((k) => Boolean(s[k]));
                  return (
                    <li key={s.id}>
                      <TapCard onClick={() => setOpenSoil(s)} label={t("detailsFor", { name: s.villageName ?? t("villageUnnamed") })}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <EmojiTile emoji="🏡" size={38} />
                          <h3 className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "21px", fontWeight: 650, minWidth: 0, overflowWrap: "anywhere" }}>
                            {s.villageName ?? t("villageUnnamed")}
                          </h3>
                        </div>
                        {hasPh && (
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{t("phLabel")}</span>
                            <span className="ftp-bignum" style={{ fontSize: 26, lineHeight: "30px", color: PH_COLOR(s.pH as number) }}>
                              {f.number(s.pH as number, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: PH_COLOR(s.pH as number) }}>{t(`phBand.${phBand(s.pH as number)}`)}</span>
                          </div>
                        )}
                        {npk.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {npk.map((k) => (
                              <Chip key={k} tone="hue">
                                {t("nutrientChip", { nutrient: t(`nutrient.${k}`), level: levelLabel(s[k] as string) })}
                              </Chip>
                            ))}
                          </div>
                        )}
                        {s.testedAt && (
                          <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            {t("testedOn", { date: f.date(s.testedAt, { day: "numeric", month: "short", year: "numeric" }) })}
                          </span>
                        )}
                        <TapHint>{t("details")}</TapHint>
                      </TapCard>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="farm" district={district} />
          </div>

          {/* 5 · Charts, each with its one-line takeaway. */}
          {(showNutrients || (showTopics && !topicsAsPicture)) && (
            <div className="ftp-grid" style={{ marginTop: 8, ["--ftp-grid-min" as string]: "340px" }}>
              {showNutrients && mostLow && (
                <ChartCard
                  title={t("nutrientsTitle")}
                  emoji="🧪"
                  units={t("nutrientsUnits")}
                  simple={
                    mostLow.low > 0
                      ? t.rich("nutrientsSimple", {
                          b: bold,
                          nutrient: t(`nutrient.${mostLow.key}`),
                          n: mostLow.low,
                          total: mostLow.low + mostLow.medium + mostLow.high,
                        })
                      : t("nutrientsNoneLow")
                  }
                  legend={(["low", "medium", "high"] as const).map((lv) => ({ label: t(`level.${lv}`), swatch: NUTRIENT_FILL[lv] }))}
                  source={SHC}
                  asOf={latestTest}
                  table={nutrientRows.map((r) => ({
                    label: t(`nutrient.${r.key}`),
                    value: t("nutrientRow", { low: r.low, medium: r.medium, high: r.high }),
                  }))}
                >
                  <NutrientBars rows={nutrientRows} />
                </ChartCard>
              )}
              {showTopics && !topicsAsPicture && (
                <ChartCard
                  title={t("topicsTitle")}
                  emoji="📢"
                  units={t("topicsUnits")}
                  simple={topicsSimple}
                  source={{ label: "KVK / ICAR" }}
                  asOf={latestWeek}
                  table={topicSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
                >
                  {topicDonut}
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="farm" />

      <LandWaterFooter
        ns="page_farm"
        about={t("summary")}
        sources={[
          { name: t("sourceShc"), url: SHC.href, frequency: t("footer.frequencyShc") },
          { name: t("sourceKvk"), frequency: t("footer.frequencyKvk") },
        ]}
        locale={locale}
        district={district}
        moduleSlug="farm"
        shareText={shareText}
      />

      <AdvisorySheet advisory={openAdvice} locale={locale} topicLabel={topicLabel} onClose={() => setOpenAdvice(null)} />
      <SoilSheet soil={openSoil} onClose={() => setOpenSoil(null)} />
    </ModulePage>
  );
}

export default function FarmPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("farm")}>
      <FarmPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

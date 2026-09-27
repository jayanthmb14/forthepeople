/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & Soil — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md §4)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useSoil() → { soil: village soil-health reports, advisories:
//  weekly KVK / ICAR crop advisories }. Every advisory shows its week
//  ("Week of 12 Sep") and every soil report its test date, so nothing on
//  this page looks newer than it is. For that reason the header carries
//  no "Updated" pill: the fetch time would read newer than the data.
//
//  Page order: header → summary → AI insight → emoji StatTiles → picture
//  row (soil pH in plain words + a pH strip with one dot per village) →
//  second picture row (nitrogen / phosphorus / potassium ratings, and what
//  the active advisories are about) → active advisories → soil cards →
//  sources → news → toolbar.
//
//  Every word comes from the "page_farm" messages; numbers and dates go
//  through useFormat(). Advisory text, crop names and village names are
//  data and stay as the source publishes them.
"use client";
import { use } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { Leaf } from "lucide-react";
import { useSoil } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import {
  PageHeader,
  Section,
  Card,
  Pill,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AsOfText,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
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
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { scriptLang } from "@/lib/utils/script-lang";

const PH_COLOR = (ph: number) => {
  const band = phBand(ph);
  return band === "acidic" ? "var(--ftp-danger)" : band === "alkaline" ? "var(--ftp-warn)" : "var(--ftp-live-text)";
};

/** The scraper's own summary line ("N: Low, P: Medium, K: High") repeats the nutrient chips. */
const AUTO_NPK_LINE = /^\s*N:\s*\w+,\s*P:\s*\w+,\s*K:\s*\w+\s*$/i;

/** "Pest" from "pest" / "PEST" — category chips are sentence case. */
function sentenceCase(s: string): string {
  const x = s.trim().toLowerCase();
  return x ? x[0].toUpperCase() + x.slice(1) : x;
}

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Small labelled value inside a soil card. */
function SoilFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      {children}
    </div>
  );
}

/** Category chip for an advisory: pest warnings keep the danger tone, the rest wear the page hue. */
function CategoryChip({ category, label }: { category: string; label: string }) {
  const emoji = advisoryEmoji(category);
  if (advisoryTopic(category) === "pest") {
    return (
      <Pill tone="danger">
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
        {label}
      </Pill>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 24,
        padding: "0 9px",
        borderRadius: "var(--ftp-radius-pill)",
        background: "var(--hue-tint)",
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
      }}
    >
      <span className="ftp-emoji" aria-hidden>
        {emoji}
      </span>
      {label}
    </span>
  );
}

function FarmPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_farm");
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useSoil(district, state);

  const weekDate = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  /** Translated topic for an advisory category; unknown categories are shown as sent. */
  const topicLabel = (category: string) => {
    const topic = advisoryTopic(category);
    return topic ? t(`topic.${topic}`) : sentenceCase(category);
  };
  /** Translated nutrient rating, or the rating as the source wrote it. */
  const levelLabel = (value: string) => {
    const lv = nutrientLevel(value);
    return lv ? t(`level.${lv}`) : value;
  };

  const soilData = data?.data?.soil ?? [];
  const advisories = data?.data?.advisories ?? [];
  const activeAdvisories = advisories.filter((a) => a.active);

  // Soil pH figures for the tiles and the picture — only villages whose
  // report has a pH reading count.
  const phReadings = soilData.flatMap((s) => (s.pH !== null && s.pH !== undefined ? [{ id: s.id, ph: s.pH }] : []));
  const acidicCount = phReadings.filter((r) => r.ph < PH_ACIDIC_BELOW).length;
  const alkalineCount = phReadings.filter((r) => r.ph > PH_ALKALINE_ABOVE).length;
  const neutralCount = phReadings.length - acidicCount - alkalineCount;
  const avgPh = phReadings.length > 0 ? phReadings.reduce((s, r) => s + r.ph, 0) / phReadings.length : null;
  const latestTest = soilData.reduce<string | null>((best, s) => (s.testedAt && (!best || s.testedAt > best) ? s.testedAt : best), null);
  const latestWeek = activeAdvisories.reduce<string | null>((best, a) => (!best || a.weekOf > best ? a.weekOf : best), null);

  const neutralPicture =
    phReadings.length <= 12
      ? { filled: neutralCount, total: phReadings.length, label: t("neutralCount", { n: neutralCount, total: phReadings.length }) }
      : {
          filled: (neutralCount / phReadings.length) * 10,
          total: 10,
          label: t("neutralAbout", { n: Math.round((neutralCount / phReadings.length) * 10) }),
        };

  // Picture 2a: nitrogen / phosphorus / potassium ratings across villages.
  // Only ratings we recognise (low / medium / high) are counted.
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
  // The nutrient most often rated low (share of rated villages), for the sentence.
  const mostLow = [...nutrientRows].sort((a, b) => b.low / (b.low + b.medium + b.high) - a.low / (a.low + a.medium + a.high))[0];

  // Picture 2b: what the active advisories are about.
  const topicCounts = new Map<string, { label: string; emoji: string; n: number }>();
  for (const a of activeAdvisories) {
    const label = topicLabel(a.category);
    const prev = topicCounts.get(label);
    topicCounts.set(label, { label, emoji: advisoryEmoji(a.category), n: (prev?.n ?? 0) + 1 });
  }
  const topicSlices: DonutSlice[] = Array.from(topicCounts.values())
    .sort((a, b) => b.n - a.n)
    .map((x) => ({ key: x.label, label: x.label, value: x.n, emoji: x.emoji }));
  const showTopics = activeAdvisories.length >= 2 && topicSlices.length >= 2;

  const shareText = t("share", { district: districtName, advisories: activeAdvisories.length, villages: soilData.length });

  return (
    <ModulePage>
      <PageHeader
        icon={Leaf}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("farm")}
        source={{ label: "Soil Health Card", href: "https://soilhealth.dac.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>{t("summary")}</ModuleSummary>

      <AIInsightCard module="farm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && soilData.length === 0 && advisories.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState emoji="🌱" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
        </div>
      )}

      {!isLoading && (soilData.length > 0 || advisories.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          <StatStrip>
            {advisories.length > 0 && (
              <StatTile
                emoji="📢"
                label={t("tileAdvisories")}
                value={f.number(activeAdvisories.length)}
                sub={latestWeek ? t("tileAdvisoriesSub", { date: weekDate(latestWeek) }) : t("tileAdvisoriesNone")}
              />
            )}
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
            {phReadings.length > 0 && (
              <StatTile
                emoji="🌱"
                label={t("tileNeutral")}
                value={`${f.number(neutralCount)}/${f.number(phReadings.length)}`}
                sub={t("tileNeutralSub", { low: f.number(PH_ACIDIC_BELOW), high: f.number(PH_ALKALINE_ABOVE) })}
                countUp={false}
              />
            )}
          </StatStrip>
        </div>
      )}

      {/* The picture: soil pH in one plain sentence, a row of village
          sprouts lit for neutral soil, and every village as a dot on a pH
          strip. Needs at least two villages with a pH reading. */}
      {!isLoading && phReadings.length >= 2 && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="🧪">
              {t.rich("phExplainer", {
                b: bold,
                total: phReadings.length,
                neutral: neutralCount,
                low: f.number(PH_ACIDIC_BELOW),
                high: f.number(PH_ALKALINE_ABOVE),
              })}
              {acidicCount > 0 || alkalineCount > 0 ? " " : null}
              {acidicCount > 0 && alkalineCount > 0
                ? t.rich("phBoth", { b: bold, acidic: acidicCount, alkaline: alkalineCount })
                : acidicCount > 0
                  ? t.rich("phAcidicOnly", { b: bold, n: acidicCount })
                  : alkalineCount > 0
                    ? t.rich("phAlkalineOnly", { b: bold, n: alkalineCount })
                    : null}
            </Explainer>
            <Pictogram filled={neutralPicture.filled} total={neutralPicture.total} emoji="🌱" label={neutralPicture.label} size={24} />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center" }}>
            <PhScale readings={phReadings} />
          </Card>
        </div>
      )}

      {/* Second picture row: soil nutrients across villages, and what the
          active advisories are about. Each shows only with real data. */}
      {!isLoading && (showNutrients || showTopics) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
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
              source={{ label: "Soil Health Card", href: "https://soilhealth.dac.gov.in" }}
              asOf={latestTest}
              table={nutrientRows.map((r) => ({
                label: t(`nutrient.${r.key}`),
                value: t("nutrientRow", { low: r.low, medium: r.medium, high: r.high }),
              }))}
            >
              <div style={{ marginTop: 14 }}>
                <NutrientBars rows={nutrientRows} />
              </div>
            </ChartCard>
          )}
          {showTopics && (
            <ChartCard
              title={t("topicsTitle")}
              emoji="📢"
              units={t("topicsUnits")}
              simple={t.rich("topicsSimple", { b: bold, topic: topicSlices[0].label, n: topicSlices[0].value, total: activeAdvisories.length })}
              source={{ label: "KVK / ICAR" }}
              asOf={latestWeek}
              table={topicSlices.map((s) => ({ label: s.label, value: f.number(s.value) }))}
            >
              <div style={{ marginTop: 14 }}>
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
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {!isLoading && activeAdvisories.length > 0 && (
        <Section title={t("advisoriesTitle")} emoji="📢">
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {activeAdvisories.map((a) => (
              <Card key={a.id} as="li" padding={14}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 21, borderRadius: 12 }}>
                    {cropEmoji(a.crop)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="ftp-title">{a.crop}</span>
                        {a.cropLocal && (
                          <span lang={scriptLang(a.cropLocal)} style={{ fontSize: 13, color: "var(--hue-deep)" }}>
                            {a.cropLocal}
                          </span>
                        )}
                        <CategoryChip category={a.category} label={topicLabel(a.category)} />
                      </div>
                      <span
                        className="ftp-num"
                        style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "var(--ftp-text-2)", flexShrink: 0 }}
                      >
                        {t("weekOf", { date: weekDate(a.weekOf) })}
                      </span>
                    </div>
                    {/* In Kannada (or the state's language) the local advisory leads when the source has one. */}
                    {a.advisoryLocal && scriptLang(a.advisoryLocal) === locale ? (
                      <>
                        <p lang={scriptLang(a.advisoryLocal)} className="ftp-body" style={{ margin: 0 }}>
                          {a.advisoryLocal}
                        </p>
                        <p lang="en" className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "6px 0 0" }}>
                          {a.advisory}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="ftp-body" style={{ margin: 0 }}>
                          {a.advisory}
                        </p>
                        {a.advisoryLocal && (
                          <p lang={scriptLang(a.advisoryLocal)} className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "6px 0 0" }}>
                            {a.advisoryLocal}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        </Section>
      )}

      {!isLoading && soilData.length > 0 && (
        <Section
          emoji="🧪"
          title={
            <>
              {t("soilTitle")}{" "}
              <span className="ftp-num" style={{ color: "var(--ftp-text-2)" }}>
                {t("soilTitleCount", { n: soilData.length })}
              </span>
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
            {soilData.map((s) => {
              const npk = [
                { key: "nitrogen" as const, value: s.nitrogen },
                { key: "phosphorus" as const, value: s.phosphorus },
                { key: "potassium" as const, value: s.potassium },
              ].filter((n): n is { key: "nitrogen" | "phosphorus" | "potassium"; value: string } => Boolean(n.value));
              const showRecommendation = s.recommendation && !(npk.length > 0 && AUTO_NPK_LINE.test(s.recommendation));
              return (
                <Card key={s.id} as="article">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>
                      🏡
                    </span>
                    <h3 className="ftp-title" style={{ margin: 0, minWidth: 0 }}>
                      {s.villageName ?? t("villageUnnamed")}
                    </h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {s.pH !== null && s.pH !== undefined && (
                      <SoilFigure label={t("phLabel")}>
                        <div className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", color: PH_COLOR(s.pH) }}>
                          {f.number(s.pH, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: "16px", color: PH_COLOR(s.pH) }}>{t(`phBand.${phBand(s.pH)}`)}</div>
                      </SoilFigure>
                    )}
                    {s.organicCarbon && (
                      <SoilFigure label={t("organicCarbon")}>
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{levelLabel(s.organicCarbon)}</div>
                      </SoilFigure>
                    )}
                  </div>
                  {/* Nitrogen / Phosphorus / Potassium levels as reported. */}
                  {npk.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {npk.map(({ key, value }) => (
                        <span
                          key={key}
                          style={{
                            display: "inline-flex",
                            alignItems: "baseline",
                            gap: 4,
                            padding: "3px 9px",
                            borderRadius: "var(--ftp-radius-pill)",
                            background: "var(--hue-tint)",
                            fontSize: 12,
                            lineHeight: "18px",
                          }}
                        >
                          <span style={{ color: "var(--ftp-text-2)", fontWeight: 600 }}>{t(`nutrient.${key}`)}</span>
                          <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{levelLabel(value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {showRecommendation && (
                    <div style={{ paddingTop: 10, borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))" }}>
                      <div className="ftp-label" style={{ marginBottom: 2 }}>
                        {t("recommendation")}
                      </div>
                      <p className="ftp-body" style={{ margin: 0 }}>
                        {s.recommendation}
                      </p>
                    </div>
                  )}
                  {s.testedAt && (
                    <div style={{ marginTop: 8 }}>
                      <AsOfText asOf={s.testedAt} prefix={t("tested")} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      <ModuleSources module="farm" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="farm" />
      <ModuleToolbar locale={locale} district={district} moduleSlug="farm" moduleLabel={t("title")} shareText={shareText} />
    </ModulePage>
  );
}

export default function FarmPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const t = useTranslations("page_farm");
  return (
    <ModuleErrorBoundary moduleName={t("title")}>
      <FarmPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

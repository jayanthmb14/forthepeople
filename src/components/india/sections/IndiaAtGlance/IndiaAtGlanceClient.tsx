"use client";

/**
 * "India at a glance" band (macro-snapshot) — three columns:
 *   left    identity zone: title, live count, the 7-module directory
 *   middle  featured module (population) with its headline, growth pill,
 *           world-rank callout and four cells
 *   right   India's world ranks (drawn medals for the top three) and the
 *           latest updates
 *
 * Sep 2026: all text through next-intl (page_india "band.*", "glance.*",
 * "fmt.*"); numbers in the page language and correct in the server HTML
 * (BandNumber counts up once after that); the directory is a plain list
 * (the auto-scrolling marquee and its duplicate copy are gone); "View all
 * 12 ranks" pointed at "#" and now jumps to the "India in the world" card
 * on this page. Missing data → "—". Never invents.
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CategoryGlyph } from "@/components/graphics";
import { indiaModuleGlyph, medalPick } from "../../glyphs";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { BandNumber, BandVisibleProvider, useBandText, useBandVisible } from "../band-kit";
import { useFormat } from "@/i18n/client";
import {
  MACRO_DIRECTORY,
  FEATURED_HEADLINE,
  FEATURED_GROWTH,
  FEATURED_RANK,
  FEATURED_CELLS,
  WORLD_RANKINGS,
  indicatorKey,
  type DirectoryRow,
  type FeaturedCell,
  type DirectoryFormat,
  type RankEntry,
  type RankFormat,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import { getIndiaModuleBySlug } from "@/lib/india/india-modules";
import { oldFigureYear } from "@/lib/india/figure-dates";

/** Page-load time: a cell figure older than 18 months shows its year. */
const LOADED_AT = Date.now();
import type { MacroSnapshotData, MacroIndicator, LatestUpdate } from "@/lib/india/getMacroSnapshotData";

type Props = {
  data: MacroSnapshotData;
  locale: string;
};

type Text = ReturnType<typeof useBandText>;

const EM_DASH = "—";

function getInd(byKey: Record<string, MacroIndicator>, ref: { moduleSlug: string; metricKey: string }): MacroIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function DirectoryValue({ format, primary, companion, t }: { format: DirectoryFormat; primary: number; companion?: number; t: Text["t"] }) {
  switch (format) {
    case "trillion_usd":
      return <BandNumber value={primary} decimals={1} render={(v) => t("fmt.usdT", { value: v })} />;
    case "percent":
      return <BandNumber value={primary} decimals={1} render={(v) => t("fmt.pct", { value: v })} />;
    case "lakh_crore_inr":
      return <BandNumber value={primary} decimals={1} render={(v) => t("fmt.inrLakhCr", { value: v })} />;
    case "lakh_crore_per_month":
      return <BandNumber value={primary} decimals={1} render={(v) => t("fmt.inrLakhCrMonth", { value: v })} />;
    case "billion_people":
      return <BandNumber value={primary / 1e9} decimals={2} render={(v) => t("fmt.billion", { value: v })} />;
    case "millions_people":
      return <BandNumber value={Math.round(primary / 1e6)} render={(v) => t("fmt.millionPlus", { value: v })} />;
    case "states_uts_combined":
      if (companion === undefined) return <BandNumber value={primary} />;
      return (
        <>
          <BandNumber value={primary} /> + <BandNumber value={companion} />
        </>
      );
  }
}

function DirectoryRowItem({ row, data, locale, text }: { row: DirectoryRow; data: MacroSnapshotData; locale: string; text: Text }) {
  const module_ = data.moduleBySlug[row.moduleSlug];
  const def = getIndiaModuleBySlug(row.moduleSlug);
  const headlineInd = getInd(data.indicatorByKey, row.headlineRef);
  const companionInd = row.companion ? getInd(data.indicatorByKey, row.companion) : undefined;
  if (!module_) return null;

  return (
    <Link href={`/${locale}/india/${row.moduleSlug}`} className={styles.directoryRow}>
      <span className={styles.directoryRowLabel}>
        <CategoryGlyph pick={indiaModuleGlyph(row.moduleSlug, def?.category)} size={16} style={{ alignSelf: "center" }} />{" "}
        {def ? text.x.moduleTitle(def) : module_.title}
        {row.isFeatured && <span className={styles.directoryRowFeaturedTag}>{text.t("band.featured")}</span>}
      </span>
      <span className={styles.directoryRowValue}>
        {headlineInd ? <DirectoryValue format={row.format} primary={headlineInd.value} companion={companionInd?.value} t={text.t} /> : EM_DASH}
      </span>
    </Link>
  );
}

function FeaturedCellItem({ cell, data, text }: { cell: FeaturedCell; data: MacroSnapshotData; text: Text }) {
  const { tb, t } = text;
  const { number } = useFormat();
  const primary = getInd(data.indicatorByKey, cell.primary);
  const companion = cell.companion ? getInd(data.indicatorByKey, cell.companion) : undefined;

  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "millions_people":
        valueNode = <BandNumber value={Math.round(primary.value / 1e6)} render={(v) => t("fmt.millionPlus", { value: v })} />;
        break;
      case "states_uts_combined":
        valueNode =
          companion !== undefined ? (
            <>
              <BandNumber value={primary.value} /> + <BandNumber value={companion.value} />
            </>
          ) : (
            <BandNumber value={primary.value} />
          );
        break;
      case "count":
        valueNode = <BandNumber value={primary.value} />;
        break;
    }
  }

  let subNode: React.ReactNode = null;
  switch (cell.sub.kind) {
    case "static":
      subNode = tb(`cells.${cell.key}.sub`);
      break;
    case "computed_pct_of": {
      const num = getInd(data.indicatorByKey, cell.sub.numerator);
      const den = getInd(data.indicatorByKey, cell.sub.denominator);
      subNode = num && den && den.value !== 0 ? tb(`cells.${cell.key}.sub`, { pct: number(Math.round((num.value / den.value) * 100)) }) : EM_DASH;
      break;
    }
    case "computed_sum": {
      const a = getInd(data.indicatorByKey, cell.sub.first);
      const b = getInd(data.indicatorByKey, cell.sub.second);
      subNode = a && b ? tb(`cells.${cell.key}.sub`, { n: number(a.value + b.value) }) : EM_DASH;
      break;
    }
  }

  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{tb(`cells.${cell.key}.label`)}</div>
      <div>
        <div className={styles.featuredCellValue}>
          {valueNode}
          {/* Density (2023) sits beside the 2025 population: say the year of an old figure. */}
          {primary && oldFigureYear(primary.asOfDate, LOADED_AT) ? (
            <span style={{ fontSize: "0.55em", fontWeight: 400, color: "var(--ftp-text-2)" }}> ({oldFigureYear(primary.asOfDate, LOADED_AT)})</span>
          ) : null}
        </div>
        {subNode !== null && <div className={styles.featuredCellSub}>{subNode}</div>}
      </div>
    </div>
  );
}

function rankValue(value: number, format: RankFormat, t: Text["t"], number: (n: number, o?: Intl.NumberFormatOptions) => string): string {
  switch (format) {
    case "billion_people":
      return t("fmt.billion", { value: number(value / 1e9, { maximumFractionDigits: 2 }) });
    case "trillion_usd":
      return t("fmt.usdT", { value: number(value, { maximumFractionDigits: 1 }) });
    case "billion_usd":
      return t("fmt.usdB", { value: number(Math.round(value)) });
    case "millions_people":
      return t("fmt.millionPlus", { value: number(Math.round(value)) });
  }
}

function WorldRankCard({ data, text }: { data: MacroSnapshotData; text: Text }) {
  const { tb, t } = text;
  const { number } = useFormat();
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>{tb("rankTitle")}</span>
        <span className={styles.rightCardIcon} aria-hidden>
          <CategoryGlyph glyph="globe" size={16} />
        </span>
      </div>
      <div className={styles.rightCardList}>
        {WORLD_RANKINGS.map((entry: RankEntry) => {
          const rank = getInd(data.indicatorByKey, entry.rankRef);
          const value = getInd(data.indicatorByKey, entry.valueRef);
          if (!rank || !value) return null;
          const medal = medalPick(Math.round(rank.value));
          return (
            <div key={entry.key} className={styles.rightCardListItem}>
              <span className={styles.rightCardListItemLeft}>
                <span className={styles.rightCardListItemRank}>
                  {medal ? (
                    <CategoryGlyph pick={medal} size={16} style={{ display: "inline-block", verticalAlign: "-3px", marginInlineEnd: 2 }} />
                  ) : null}
                  #<BandNumber value={rank.value} />
                </span>
                <span className={styles.rightCardListItemLabel}>{tb(`ranks.${entry.key}`)}</span>
              </span>
              <span className={styles.rightCardListItemValue}>{rankValue(value.value, entry.format, t, number)}</span>
            </div>
          );
        })}
      </div>
      {/* Was a dead "#" link ("View all 12 ranks"); the full list of ranks
          is the "India in the world" card near the top of this page. */}
      <a href="#india-in-the-world" className={styles.rightCardLink}>
        {tb("allRanks")}
      </a>
    </div>
  );
}

function LatestUpdatesCard({ updates, locale, text }: { updates: LatestUpdate[]; locale: string; text: Text }) {
  const { tb } = text;
  const tm = useTranslations("page_india-module");
  const { ago } = useFormat();
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>{tb("latestTitle")}</span>
        <span className={styles.rightCardLiveBadge}>{tb("recent")}</span>
      </div>
      <div className={styles.rightCardList}>
        {updates.map((u, i) => {
          const k = `metric.${u.moduleSlug}.${u.metricKey}`;
          const translated = tm.has(k);
          return (
            <div key={`${u.moduleSlug}-${u.metricKey}-${i}`} className={styles.rightCardListUpdate}>
              <span className={styles.rightCardListUpdateTime} suppressHydrationWarning>
                {ago(u.asOfDate)}
              </span>
              <span className={styles.rightCardListUpdateLabel} lang={translated ? undefined : "en"}>
                {translated ? tm(k) : u.label}
              </span>
            </div>
          );
        })}
      </div>
      <Link href={`/${locale}/india/updates`} className={styles.rightCardLink}>
        {tb("allUpdates")}
      </Link>
    </div>
  );
}

export function IndiaAtGlanceClient({ data, locale }: Props) {
  const [ref, visible] = useBandVisible();
  const text = useBandText("glance");
  const { t, tb, x } = text;

  const headlineInd = getInd(data.indicatorByKey, FEATURED_HEADLINE);
  const growthInd = getInd(data.indicatorByKey, FEATURED_GROWTH);
  const rankInd = getInd(data.indicatorByKey, FEATURED_RANK);
  const featuredModuleSlug = FEATURED_HEADLINE.moduleSlug;
  const featuredDef = getIndiaModuleBySlug(featuredModuleSlug);
  const featuredModule = data.moduleBySlug[featuredModuleSlug];

  return (
    <BandVisibleProvider visible={visible}>
      <section
        ref={ref}
        data-tint-id="macro"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="india-at-a-glance-title"
      >
        <div className={styles.layout}>
          {/* LEFT — identity zone with the module directory */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              {t("band.sectionOf", { n: data.superCategory.displayOrder, total: INDIA_SUPER_CATEGORIES.length })}
            </div>
            <h2 id="india-at-a-glance-title" className={styles.identityTitle}>
              {x.scTitle(data.superCategory)}
            </h2>
            <p className={styles.identityDesc}>{x.scTagline(data.superCategory)}</p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>{t("band.modules")}</span>
              <span className={styles.modulesCountValue}>{t("band.liveOf", { live: data.liveCount, total: data.totalCount })}</span>
            </div>

            <div className={styles.directoryWindow}>
              <div className={styles.directoryTrack}>
                {MACRO_DIRECTORY.map((row) => (
                  <DirectoryRowItem key={row.moduleSlug} row={row} data={data} locale={locale} text={text} />
                ))}
              </div>
            </div>

            <Link href={`/${locale}/india/category/${data.superCategory.slug}`} className={styles.browseBtn}>
              <span>{t("band.browseAll", { n: data.totalCount })}</span>
            </Link>

            <SectionWatermark slug="macro-snapshot" className={styles.compassWatermark} />
          </div>

          {/* MIDDLE — featured module */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  <CategoryGlyph pick={indiaModuleGlyph(featuredModuleSlug, featuredDef?.category)} size={18} />
                </span>
                <span className={styles.featuredTitle}>{featuredDef ? x.moduleTitle(featuredDef) : featuredModuleSlug}</span>
                {headlineInd?.source && <span className={styles.featuredSourceInline}>{headlineInd.source}</span>}
              </div>
              {featuredModule?.status === "live" && <span className={styles.livePill}>{t("band.liveModule")}</span>}
            </div>

            <div className={styles.headlineRow}>
              {headlineInd ? (
                <>
                  <span className={styles.headlineMajor}>
                    <BandNumber value={headlineInd.value / 1e9} decimals={2} duration={1500} />
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>{tb("headlineUnit")}</span>
                    {growthInd && (
                      <span className={styles.growthPill}>
                        <span className={styles.growthArrow} aria-hidden>
                          ↑
                        </span>
                        <span className={styles.growthValue}>
                          <BandNumber value={growthInd.value} decimals={1} render={(v) => tb("growth", { value: v })} />
                        </span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className={styles.headlineMajor}>{EM_DASH}</span>
              )}

              {rankInd && (
                <div className={styles.rankCallout}>
                  <div className={styles.rankLabel}>{tb("rankLabel")}</div>
                  <div className={styles.rankValue}>
                    #<BandNumber value={rankInd.value} />
                  </div>
                  <div className={styles.rankSubtitle}>{tb("rankSub")}</div>
                </div>
              )}
            </div>

            <div className={styles.featuredDesc}>{tb("desc")}</div>

            <div className={styles.featuredGrid}>
              {FEATURED_CELLS.map((cell) => (
                <FeaturedCellItem key={cell.key} cell={cell} data={data} text={text} />
              ))}
            </div>

            <div className={styles.featuredBottom}>
              <span className={styles.featuredSources}>{t("band.sources", { list: data.sources.slice(0, 3).join(", ") })}</span>
              <Link href={`/${locale}/india/${featuredModuleSlug}`} className={styles.openModuleLink}>
                {t("band.openModule")}
              </Link>
            </div>
          </div>

          {/* RIGHT — world ranks + latest updates */}
          <div className={styles.rightColumn}>
            <WorldRankCard data={data} text={text} />
            <LatestUpdatesCard updates={data.latestUpdates} locale={locale} text={text} />
          </div>
        </div>
      </section>
    </BandVisibleProvider>
  );
}

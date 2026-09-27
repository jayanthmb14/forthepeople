"use client";

/**
 * "Know about India" band — Section 02.
 *
 *   left    identity zone with the module directory (a plain list)
 *   middle  the featured module (how the Constitution works)
 *   right   the drafting timeline and five well-known Articles
 *
 * All know-india modules are status "planned" today, so the count strip
 * says "All planned" and the featured module carries a "Planned" pill.
 *
 * Sep 2026: text through next-intl (page_india "band.*", "know.*");
 * numbers and dates in the page language, right in the server HTML; the
 * marquee copy and the two "#" links are gone ("Full timeline" and "All
 * articles" now open the matching module pages). The featured caption
 * said the Constitution was "adopted 26 January 1950"; it was adopted on
 * 26 November 1949 and came into force on 26 January 1950.
 */

import Link from "next/link";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { BandNumber, BandVisibleProvider, useBandText, useBandVisible } from "../band-kit";
import { useFormat } from "@/i18n/client";
import {
  KNOW_DIRECTORY,
  FEATURED_CELLS,
  CONSTITUTION_TIMELINE,
  NOTABLE_ARTICLES,
  IN_FORCE_DATE,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import { getIndiaModuleBySlug } from "@/lib/india/india-modules";
import type { KnowAboutIndiaData, KnowIndicator } from "@/lib/india/getKnowAboutIndiaData";

type Props = {
  data: KnowAboutIndiaData;
  locale: string;
};

type Text = ReturnType<typeof useBandText>;

const EM_DASH = "—";

function getInd(byKey: Record<string, KnowIndicator>, ref: { moduleSlug: string; metricKey: string }): KnowIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function DirectoryValue({ format, primary, companion, text }: { format: DirectoryFormat; primary: number; companion?: number; text: Text }) {
  const { t, tb } = text;
  switch (format) {
    case "count_with_suffix":
      return <BandNumber value={primary} render={(v) => t("fmt.plus", { value: v })} />;
    case "year_span":
      return <BandNumber value={primary} render={(v) => t("fmt.years", { value: v })} />;
    case "million_km2":
      return <BandNumber value={primary} decimals={2} render={(v) => tb("fmt.millionKm2", { value: v })} />;
    case "lok_rajya":
      if (companion === undefined) return <BandNumber value={primary} />;
      return (
        <>
          <BandNumber value={primary} /> + <BandNumber value={companion} />
        </>
      );
    case "millions_voters":
      return <BandNumber value={Math.round(primary)} render={(v) => tb("fmt.millionVoters", { value: v })} />;
    case "stages_count":
      return <BandNumber value={Math.round(primary)} render={(v) => tb("fmt.stages", { value: v })} />;
  }
}

function DirectoryRowItem({ row, data, locale, text }: { row: DirectoryRow; data: KnowAboutIndiaData; locale: string; text: Text }) {
  const module_ = data.moduleBySlug[row.moduleSlug];
  const def = getIndiaModuleBySlug(row.moduleSlug);
  const headlineInd = getInd(data.indicatorByKey, row.headlineRef);
  const companionInd = row.companion ? getInd(data.indicatorByKey, row.companion) : undefined;
  if (!module_) return null;

  return (
    <Link href={`/${locale}/india/${row.moduleSlug}`} className={styles.directoryRow}>
      <span className={styles.directoryRowLabel}>
        <span aria-hidden>{row.emoji}</span> {def ? text.x.moduleTitle(def) : module_.title}
        {row.isFeatured && <span className={styles.directoryRowFeaturedTag}>{text.t("band.featured")}</span>}
      </span>
      <span className={styles.directoryRowValue}>
        {headlineInd ? <DirectoryValue format={row.format} primary={headlineInd.value} companion={companionInd?.value} text={text} /> : EM_DASH}
      </span>
    </Link>
  );
}

function FeaturedCellItem({ cell, data, text }: { cell: FeaturedCell; data: KnowAboutIndiaData; text: Text }) {
  const { t, tb } = text;
  const { date } = useFormat();
  const primary = getInd(data.indicatorByKey, cell.primary);

  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "with_plus":
        valueNode = <BandNumber value={primary.value} render={(v) => t("fmt.plus", { value: v })} />;
        break;
      case "count":
        valueNode = <BandNumber value={primary.value} />;
        break;
      case "in_force_date":
        // The stored row is the year; the exact day is a fixed historical fact.
        valueNode =
          Math.round(primary.value) === 1950
            ? date(IN_FORCE_DATE, { dateStyle: "medium" })
            : String(Math.round(primary.value));
        break;
    }
  }

  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{tb(`cells.${cell.key}`)}</div>
      <div className={styles.featuredCellValue}>{valueNode}</div>
    </div>
  );
}

function DraftingTimelineCard({ locale, text }: { locale: string; text: Text }) {
  const { tb } = text;
  const { date } = useFormat();
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>{tb("timelineTitle")}</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⏳
        </span>
      </div>
      <ol className={styles.rightCardList} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {CONSTITUTION_TIMELINE.map((entry) => (
          <li key={entry.key} className={styles.rightCardListEntry}>
            <span className={styles.rightCardListEntryDate}>{date(entry.date, { dateStyle: "medium" })}</span>
            <span className={styles.rightCardListEntryLabel}>{tb(`timeline.${entry.key}`)}</span>
          </li>
        ))}
      </ol>
      <Link href={`/${locale}/india/know-india-history-timeline`} className={styles.rightCardLink}>
        {tb("timelineLink")}
      </Link>
    </div>
  );
}

function NotableArticlesCard({ locale, data, text }: { locale: string; data: KnowAboutIndiaData; text: Text }) {
  const { tb } = text;
  const { number } = useFormat();
  const articles = getInd(data.indicatorByKey, { moduleSlug: "know-india-constitution", metricKey: "articles_count" });
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>{tb("articlesTitle")}</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⚖
        </span>
      </div>
      <ul className={styles.rightCardList} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {NOTABLE_ARTICLES.map((entry) => (
          <li key={entry.num} className={styles.rightCardListEntry}>
            <span className={styles.rightCardListArticleNum}>{tb("article", { n: entry.num })}</span>
            <span className={styles.rightCardListArticleLabel}>{tb(`articles.${entry.key}`)}</span>
          </li>
        ))}
      </ul>
      <Link href={`/${locale}/india/know-india-constitution`} className={styles.rightCardLink}>
        {articles ? tb("articlesLink", { n: number(articles.value) }) : tb("articlesLinkPlain")}
      </Link>
    </div>
  );
}

export function KnowAboutIndiaClient({ data, locale }: Props) {
  const [ref, visible] = useBandVisible();
  const text = useBandText("know");
  const { t, tb, x } = text;

  const featuredRow = KNOW_DIRECTORY.find((r) => r.isFeatured);
  const featuredModuleSlug = featuredRow?.moduleSlug;
  const featuredDef = featuredModuleSlug ? getIndiaModuleBySlug(featuredModuleSlug) : undefined;
  const featuredModule = featuredModuleSlug ? data.moduleBySlug[featuredModuleSlug] : undefined;
  const featuredHeadlineInd = featuredRow ? getInd(data.indicatorByKey, featuredRow.headlineRef) : undefined;

  const statusText =
    data.plannedCount === data.totalCount ? t("band.allPlanned") : t("band.liveOf", { live: data.liveCount, total: data.totalCount });

  return (
    <BandVisibleProvider visible={visible}>
      <section
        ref={ref}
        data-tint-id="know"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="know-about-india-title"
      >
        <div className={styles.layout}>
          {/* LEFT — identity zone */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              {t("band.sectionOf", { n: data.superCategory.displayOrder, total: INDIA_SUPER_CATEGORIES.length })}
            </div>
            <h2 id="know-about-india-title" className={styles.identityTitle}>
              {x.scTitle(data.superCategory)}
            </h2>
            <p className={styles.identityDesc}>{x.scTagline(data.superCategory)}</p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>{t("band.inDevelopment", { n: data.totalCount })}</span>
              <span className={styles.modulesCountValue}>{statusText}</span>
            </div>

            <div className={styles.directoryWindow}>
              <div className={styles.directoryTrack}>
                {KNOW_DIRECTORY.map((row) => (
                  <DirectoryRowItem key={row.moduleSlug} row={row} data={data} locale={locale} text={text} />
                ))}
              </div>
            </div>

            <Link href={`/${locale}/india/category/${data.superCategory.slug}`} className={styles.browseBtn}>
              <span>{t("band.browseAll", { n: data.totalCount })}</span>
            </Link>

            <SectionWatermark slug="know-india" className={styles.bookWatermark} />
          </div>

          {/* MIDDLE — featured (the Constitution) */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  {featuredRow?.emoji ?? ""}
                </span>
                <span className={styles.featuredTitle}>{featuredDef ? x.moduleTitle(featuredDef) : featuredModuleSlug ?? ""}</span>
                {featuredHeadlineInd?.source && <span className={styles.featuredSourceInline}>{featuredHeadlineInd.source}</span>}
              </div>
              {featuredModule?.status === "planned" && <span className={styles.plannedPill}>{t("band.planned")}</span>}
            </div>

            <div className={styles.headlineRow}>
              {featuredHeadlineInd ? (
                <>
                  <span className={styles.headlineMajor}>
                    <BandNumber value={featuredHeadlineInd.value} duration={1500} render={(v) => t("fmt.plus", { value: v })} />
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>{tb("headlineUnit")}</span>
                    <span className={styles.featuredCaption}>{tb("caption")}</span>
                  </div>
                </>
              ) : (
                <span className={styles.headlineMajor}>{EM_DASH}</span>
              )}
            </div>

            <div className={styles.featuredDesc}>{tb("desc")}</div>

            <div className={styles.featuredGrid}>
              {FEATURED_CELLS.map((cell) => (
                <FeaturedCellItem key={cell.key} cell={cell} data={data} text={text} />
              ))}
            </div>

            <div className={styles.featuredBottom}>
              <span className={styles.featuredSources}>{featuredHeadlineInd?.source ?? ""}</span>
              {featuredModuleSlug && (
                <Link href={`/${locale}/india/${featuredModuleSlug}`} className={styles.openModuleLink}>
                  {t("band.openModule")}
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT — drafting timeline + notable articles */}
          <div className={styles.rightColumn}>
            <DraftingTimelineCard locale={locale} text={text} />
            <NotableArticlesCard locale={locale} data={data} text={text} />
          </div>
        </div>
      </section>
    </BandVisibleProvider>
  );
}

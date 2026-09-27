"use client";

/**
 * v6 KnowAboutIndia band — Section 02.
 *
 * Mirrors the IndiaAtGlance v12 structure:
 *   Identity zone (320px, indigo gradient) with marquee directory
 *   Featured zone (1fr, white) showing the Constitution Works module
 *   Right column (240px) with two editorial cards:
 *     1. Drafting Timeline — 4 immutable constitution-drafting milestones
 *     2. Notable Articles — 5 well-known Article numbers + their labels
 *
 * IntersectionObserver flips `visible`; CountUpNumber animates numeric
 * cells once visible. Editorial constants render directly without
 * count-up because they're text, not numbers.
 *
 * All 6 know-india modules are status='planned' today, so:
 *   - The "modules count" strip shows "all planned" (amber dot)
 *   - The featured module gets a "PLANNED" pill (amber)
 *   - Directory rows show their seeded values, not a planned-state fallback
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "../IndiaAtGlance/CountUpNumber";
import {
  KNOW_DIRECTORY,
  FEATURED_CELLS,
  CONSTITUTION_TIMELINE,
  NOTABLE_ARTICLES,
  TOTAL_ARTICLE_COUNT_LABEL,
  FEATURED_HEADLINE_LABEL,
  FEATURED_CAPTION,
  FEATURED_DESCRIPTION,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import type {
  KnowAboutIndiaData,
  KnowIndicator,
} from "@/lib/india/getKnowAboutIndiaData";

type Props = {
  data: KnowAboutIndiaData;
  locale: string;
};

const EM_DASH = "—";

// ── Visible context ──

const VisibleCtx = createContext(false);

function CountUpValue({
  value,
  decimals,
  duration = 1200,
}: {
  value: number;
  decimals: number;
  duration?: number;
}) {
  const visible = useContext(VisibleCtx);
  return (
    <CountUpNumber
      value={value}
      decimals={decimals}
      duration={duration}
      visible={visible}
    />
  );
}

// ── Helpers ──

function getInd(
  byKey: Record<string, KnowIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): KnowIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function formatYearToDateString(year: number): string {
  // The Constitution came into force on 26 January 1950 — well-known
  // historical citation. Any other year just shows the year.
  return year === 1950 ? "26.01.1950" : `${year}`;
}

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  companion?: number,
): React.ReactNode {
  switch (format) {
    case "count_with_suffix":
      return (
        <>
          <CountUpValue value={primary} decimals={0} />+
        </>
      );
    case "year_span":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> yrs
        </>
      );
    case "million_km2":
      return (
        <>
          <CountUpValue value={primary} decimals={2} />M km²
        </>
      );
    case "lok_rajya":
      if (companion === undefined) {
        return <CountUpValue value={primary} decimals={0} />;
      }
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> +{" "}
          <CountUpValue value={companion} decimals={0} />
        </>
      );
    case "millions_voters":
      return (
        <>
          <CountUpValue value={Math.round(primary)} decimals={0} />M+ voters
        </>
      );
    case "stages_count":
      return (
        <>
          <CountUpValue value={Math.round(primary)} decimals={0} /> stages
        </>
      );
  }
}

function DirectoryRowItem({
  row,
  data,
  locale,
  duplicate = false,
}: {
  row: DirectoryRow;
  data: KnowAboutIndiaData;
  locale: string;
  duplicate?: boolean;
}) {
  const module_ = data.moduleBySlug[row.moduleSlug];
  const headlineInd = getInd(data.indicatorByKey, row.headlineRef);
  const companionInd = row.companion ? getInd(data.indicatorByKey, row.companion) : undefined;

  if (!module_) return null;

  const displayValue: React.ReactNode = headlineInd
    ? renderDirectoryDisplay(row.format, headlineInd.value, companionInd?.value)
    : EM_DASH;

  return (
    <Link
      href={`/${locale}/india/${row.moduleSlug}`}
      className={styles.directoryRow}
      aria-hidden={duplicate}
      tabIndex={duplicate ? -1 : 0}
    >
      <span className={styles.directoryRowLabel}>
        {row.emoji} {module_.title}
        {row.isFeatured && (
          <span className={styles.directoryRowFeaturedTag}>▸ featured</span>
        )}
      </span>
      <span className={styles.directoryRowValue}>{displayValue}</span>
    </Link>
  );
}

function RepeatsDivider() {
  return (
    <div className={styles.repeatsDivider} aria-hidden>
      <span className={styles.repeatsDividerIcon}>↻</span>
      <span className={styles.repeatsDividerLabel}>Repeats</span>
    </div>
  );
}

function FeaturedCellItem({
  cell,
  data,
}: {
  cell: FeaturedCell;
  data: KnowAboutIndiaData;
}) {
  const primary = getInd(data.indicatorByKey, cell.primary);

  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "with_suffix":
        valueNode = (
          <>
            <CountUpValue value={primary.value} decimals={0} />
            {cell.primarySuffix ?? ""}
          </>
        );
        break;
      case "count":
        valueNode = <CountUpValue value={primary.value} decimals={0} />;
        break;
      case "year_to_date_string":
        valueNode = formatYearToDateString(primary.value);
        break;
    }
  }

  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div className={styles.featuredCellValue}>{valueNode}</div>
    </div>
  );
}

function DraftingTimelineCard() {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Drafting timeline</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⏳
        </span>
      </div>
      <div className={styles.rightCardList}>
        {CONSTITUTION_TIMELINE.map((entry) => (
          <div key={entry.date} className={styles.rightCardListEntry}>
            <span className={styles.rightCardListEntryDate}>{entry.date}</span>
            <span className={styles.rightCardListEntryLabel}>{entry.event}</span>
          </div>
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        Full timeline
      </a>
    </div>
  );
}

function NotableArticlesCard() {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Notable articles</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⚖
        </span>
      </div>
      <div className={styles.rightCardList}>
        {NOTABLE_ARTICLES.map((entry) => (
          <div key={entry.num} className={styles.rightCardListEntry}>
            <span className={styles.rightCardListArticleNum}>
              Art {entry.num}
            </span>
            <span className={styles.rightCardListArticleLabel}>
              {entry.label}
            </span>
          </div>
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        All {TOTAL_ARTICLE_COUNT_LABEL} articles
      </a>
    </div>
  );
}

// ── Main composition ──

export function KnowAboutIndiaClient({ data, locale }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Featured zone references — Constitution Works.
  const featuredRow = KNOW_DIRECTORY.find((r) => r.isFeatured);
  const featuredModuleSlug = featuredRow?.moduleSlug;
  const featuredModule = featuredModuleSlug
    ? data.moduleBySlug[featuredModuleSlug]
    : undefined;
  const featuredHeadlineInd = featuredRow
    ? getInd(data.indicatorByKey, featuredRow.headlineRef)
    : undefined;

  // Status copy — all 6 know-india modules are 'planned'.
  const statusText =
    data.plannedCount === data.totalCount
      ? "all planned"
      : `${data.liveCount} of ${data.totalCount} live`;

  return (
    <VisibleCtx.Provider value={visible}>
      <section
        ref={ref}
        data-tint-id="know"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="know-about-india-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {INDIA_SUPER_CATEGORIES.length}
            </div>
            <h2
              id="know-about-india-title"
              className={styles.identityTitle}
            >
              {data.superCategory.title}
            </h2>
            <p className={styles.identityDesc}>
              {data.superCategory.tagline ?? ""}
            </p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>
                {data.totalCount} modules · in development
              </span>
              <span className={styles.modulesCountValue}>{statusText}</span>
            </div>

            <div className={styles.directoryWindow}>
              <div className={styles.directoryTrack}>
                {KNOW_DIRECTORY.map((row) => (
                  <DirectoryRowItem
                    key={row.moduleSlug}
                    row={row}
                    data={data}
                    locale={locale}
                  />
                ))}
                <RepeatsDivider />
                {KNOW_DIRECTORY.map((row) => (
                  <DirectoryRowItem
                    key={`dup-${row.moduleSlug}`}
                    row={row}
                    data={data}
                    locale={locale}
                    duplicate
                  />
                ))}
                <RepeatsDivider />
              </div>
            </div>

            <Link
              href={`/${locale}/india/category/${data.superCategory.slug}`}
              className={styles.browseBtn}
            >
              <span>Browse all {data.totalCount}</span>
            </Link>

            <SectionWatermark
              slug="know-india"
              className={styles.bookWatermark}
            />
          </div>

          {/* MIDDLE — Featured (Constitution) */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  {featuredRow?.emoji ?? ""}
                </span>
                <span className={styles.featuredTitle}>
                  {featuredModule?.title ?? featuredModuleSlug ?? ""}
                </span>
                {featuredHeadlineInd?.source && (
                  <span className={styles.featuredSourceInline}>
                    {featuredHeadlineInd.source}
                  </span>
                )}
              </div>
              {featuredModule?.status === "planned" && (
                <span className={styles.plannedPill}>Planned</span>
              )}
            </div>

            <div className={styles.headlineRow}>
              {featuredHeadlineInd ? (
                <>
                  <span className={styles.headlineMajor}>
                    <CountUpValue
                      value={featuredHeadlineInd.value}
                      decimals={0}
                      duration={1500}
                    />
                    +
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>
                      {FEATURED_HEADLINE_LABEL}
                    </span>
                    <span className={styles.featuredCaption}>
                      {FEATURED_CAPTION}
                    </span>
                  </div>
                </>
              ) : (
                <span className={styles.headlineMajor}>{EM_DASH}</span>
              )}
            </div>

            <div className={styles.featuredDesc}>{FEATURED_DESCRIPTION}</div>

            <div className={styles.featuredGrid}>
              {FEATURED_CELLS.map((cell) => (
                <FeaturedCellItem key={cell.label} cell={cell} data={data} />
              ))}
            </div>

            <div className={styles.featuredBottom}>
              <span className={styles.featuredSources}>
                {featuredHeadlineInd?.source ?? ""}
              </span>
              {featuredModuleSlug && (
                <Link
                  href={`/${locale}/india/${featuredModuleSlug}`}
                  className={styles.openModuleLink}
                >
                  Open module
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT — Drafting Timeline + Notable Articles */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <DraftingTimelineCard />
            <NotableArticlesCard />
          </div>
          <SectionRightRailDots count={2} accent="#2E2A6D" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

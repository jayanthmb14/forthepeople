"use client";

/**
 * v12 IndiaAtGlance band — denser magazine layout.
 *
 * Three columns: identity zone with marquee-scrolling 7-module
 * directory, featured zone with compound cells + global-rank
 * callout, right column with two cards (India's World Rank +
 * Latest updates). Owns:
 *   - IntersectionObserver flipping `visible` for the entry cascade
 *   - CountUpNumber on every numeric value once visible
 *   - Locale-aware module deep links + super-category browse link
 *
 * Missing data → "—" (em dash). Never invents.
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "./CountUpNumber";
import {
  MACRO_DIRECTORY,
  FEATURED_HEADLINE,
  FEATURED_GROWTH,
  FEATURED_RANK,
  FEATURED_CELLS,
  WORLD_RANKINGS,
  WORLD_RANK_TOTAL_COUNT,
  FEATURED_RANK_LABEL,
  FEATURED_RANK_SUBTITLE,
  FEATURED_DESCRIPTION,
  indicatorKey,
  type DirectoryRow,
  type FeaturedCell,
  type DirectoryFormat,
  type RankEntry,
  type RankFormat,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import type {
  MacroSnapshotData,
  MacroIndicator,
  LatestUpdate,
} from "@/lib/india/getMacroSnapshotData";

type Props = {
  data: MacroSnapshotData;
  locale: string;
};

const EM_DASH = "—";

// ── Formatters ──

function pctOf(numerator: number, denominator: number): string {
  if (denominator === 0) return EM_DASH;
  return `${Math.round((numerator / denominator) * 100)}`;
}

function formatRankValue(value: number, format: RankFormat): string {
  switch (format) {
    case "billion_people":
      return `${(value / 1e9).toFixed(2)}B`;
    case "trillion_usd":
      return `$${value.toFixed(1)}T`;
    case "billion_usd":
      return `$${Math.round(value)}B`;
    case "millions_people":
      return `${Math.round(value)}M+`;
  }
}

/**
 * Relative time string for the live updates feed.
 * Returns:
 *   "Today"        within 24h
 *   "{N}d ago"     within 7 days
 *   "{N}w ago"     within 4 weeks
 *   "{N}mo ago"    older
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return EM_DASH;
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  if (diffMs < 0) return "Today";
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Helpers ──

function getInd(
  byKey: Record<string, MacroIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): MacroIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

// ── Visible context — children animate when band scrolls into view ──

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

// ── Sub-components ──

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  companion?: number,
): React.ReactNode {
  switch (format) {
    case "trillion_usd":
      return (
        <>
          $<CountUpValue value={primary} decimals={1} />T
        </>
      );
    case "percent":
      return (
        <>
          <CountUpValue value={primary} decimals={1} />%
        </>
      );
    case "lakh_crore_inr":
      return (
        <>
          ₹<CountUpValue value={primary} decimals={1} />L cr
        </>
      );
    case "lakh_crore_per_month":
      return (
        <>
          ₹<CountUpValue value={primary} decimals={1} />L cr/mo
        </>
      );
    case "billion_people":
      return (
        <>
          <CountUpValue value={primary / 1e9} decimals={2} />B
        </>
      );
    case "millions_people":
      return (
        <>
          <CountUpValue value={Math.round(primary / 1e6)} decimals={0} />M+
        </>
      );
    case "states_uts_combined":
      if (companion === undefined) {
        return <CountUpValue value={primary} decimals={0} />;
      }
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> +{" "}
          <CountUpValue value={companion} decimals={0} />
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
  data: MacroSnapshotData;
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

// ── Featured cell ──

function FeaturedCellItem({
  cell,
  data,
}: {
  cell: FeaturedCell;
  data: MacroSnapshotData;
}) {
  const primary = getInd(data.indicatorByKey, cell.primary);
  const companion = cell.companion ? getInd(data.indicatorByKey, cell.companion) : undefined;

  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "with_suffix":
        valueNode = <CountUpValue value={primary.value} decimals={0} />;
        break;
      case "millions_people":
        valueNode = (
          <>
            <CountUpValue value={Math.round(primary.value / 1e6)} decimals={0} />
            M+
          </>
        );
        break;
      case "states_uts_combined":
        valueNode =
          companion !== undefined ? (
            <>
              <CountUpValue value={primary.value} decimals={0} /> +{" "}
              <CountUpValue value={companion.value} decimals={0} />
            </>
          ) : (
            <CountUpValue value={primary.value} decimals={0} />
          );
        break;
      case "count":
        valueNode = <CountUpValue value={primary.value} decimals={0} />;
        break;
      case "count_kg":
        valueNode = (
          <>
            <CountUpValue value={primary.value} decimals={0} /> kg
          </>
        );
        break;
    }
  }

  let subNode: React.ReactNode = null;
  if (cell.sub) {
    switch (cell.sub.kind) {
      case "static_label":
      case "static_attribution":
        subNode = cell.sub.text;
        break;
      case "computed_pct_of": {
        const num = getInd(data.indicatorByKey, cell.sub.numerator);
        const den = getInd(data.indicatorByKey, cell.sub.denominator);
        if (num && den) {
          subNode = `${pctOf(num.value, den.value)}${cell.sub.suffix}`;
        } else {
          subNode = EM_DASH;
        }
        break;
      }
      case "computed_sum": {
        const a = getInd(data.indicatorByKey, cell.sub.first);
        const b = getInd(data.indicatorByKey, cell.sub.second);
        if (a && b) {
          subNode = `${a.value + b.value}${cell.sub.suffix}`;
        } else {
          subNode = EM_DASH;
        }
        break;
      }
    }
  }

  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div>
        <div className={styles.featuredCellValue}>{valueNode}</div>
        {subNode !== null && (
          <div className={styles.featuredCellSub}>{subNode}</div>
        )}
      </div>
    </div>
  );
}

// ── Right column cards ──

function WorldRankCard({ data }: { data: MacroSnapshotData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>India&apos;s world rank</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🌐
        </span>
      </div>
      <div className={styles.rightCardList}>
        {WORLD_RANKINGS.map((entry: RankEntry) => {
          const rank = getInd(data.indicatorByKey, entry.rankRef);
          const value = getInd(data.indicatorByKey, entry.valueRef);
          if (!rank || !value) return null;
          const formatted = formatRankValue(value.value, entry.format);
          return (
            <div key={entry.label} className={styles.rightCardListItem}>
              <span className={styles.rightCardListItemLeft}>
                <span className={styles.rightCardListItemRank}>
                  #<CountUpValue value={rank.value} decimals={0} />
                </span>
                <span className={styles.rightCardListItemLabel}>
                  {entry.label}
                </span>
              </span>
              <span className={styles.rightCardListItemValue}>{formatted}</span>
            </div>
          );
        })}
      </div>
      <a href="#" className={styles.rightCardLink}>
        View all {WORLD_RANK_TOTAL_COUNT} ranks
      </a>
    </div>
  );
}

function LatestUpdatesCard({ updates }: { updates: LatestUpdate[] }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Latest updates</span>
        <span className={styles.rightCardLiveBadge}>Recent</span>
      </div>
      <div className={styles.rightCardList}>
        {updates.map((u, i) => (
          <div
            key={`${u.moduleSlug}-${u.label}-${i}`}
            className={styles.rightCardListUpdate}
          >
            <span className={styles.rightCardListUpdateTime}>
              {formatRelativeTime(u.asOfDate)}
            </span>
            <span className={styles.rightCardListUpdateLabel}>{u.label}</span>
          </div>
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        Live data feed
      </a>
    </div>
  );
}

// ── Main composition ──

export function IndiaAtGlanceClient({ data, locale }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    // Threshold 0.15 = ~48px of the 320px section must be in view before
    // the entry cascade fires. rootMargin shrinks the bottom edge by 10%
    // of viewport height so the trigger sits comfortably above the fold.
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Featured zone references.
  const headlineInd = getInd(data.indicatorByKey, FEATURED_HEADLINE);
  const growthInd = getInd(data.indicatorByKey, FEATURED_GROWTH);
  const rankInd = getInd(data.indicatorByKey, FEATURED_RANK);
  const featuredModuleSlug = FEATURED_HEADLINE.moduleSlug;
  const featuredModule = data.moduleBySlug[featuredModuleSlug];

  return (
    <VisibleCtx.Provider value={visible}>
      <section
        ref={ref}
        data-tint-id="macro"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="india-at-a-glance-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone with marquee directory */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {INDIA_SUPER_CATEGORIES.length}
            </div>
            <h2
              id="india-at-a-glance-title"
              className={styles.identityTitle}
            >
              {data.superCategory.title}
            </h2>
            <p className={styles.identityDesc}>
              {data.superCategory.tagline ?? ""}
            </p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>Modules</span>
              <span className={styles.modulesCountValue}>
                {data.liveCount} of {data.totalCount} live
              </span>
            </div>

            {/* Marquee window: track holds two copies of the row block,
                divided by ↻ REPEATS markers. The track translates -204px
                per cycle so the second copy seamlessly aligns with where
                the first started. */}
            <div className={styles.directoryWindow}>
              <div className={styles.directoryTrack}>
                {MACRO_DIRECTORY.map((row) => (
                  <DirectoryRowItem
                    key={row.moduleSlug}
                    row={row}
                    data={data}
                    locale={locale}
                  />
                ))}
                <RepeatsDivider />
                {MACRO_DIRECTORY.map((row) => (
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
              slug="macro-snapshot"
              className={styles.compassWatermark}
            />
          </div>

          {/* MIDDLE — Featured */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  {MACRO_DIRECTORY.find((r) => r.isFeatured)?.emoji ?? ""}
                </span>
                <span className={styles.featuredTitle}>
                  {featuredModule?.title ?? featuredModuleSlug}
                </span>
                {headlineInd?.source && (
                  <span className={styles.featuredSourceInline}>
                    {headlineInd.source}
                  </span>
                )}
              </div>
              {featuredModule?.status === "live" && (
                <span className={styles.livePill}>Live module</span>
              )}
            </div>

            <div className={styles.headlineRow}>
              {headlineInd ? (
                <>
                  <span className={styles.headlineMajor}>
                    <CountUpValue
                      value={headlineInd.value / 1e9}
                      decimals={2}
                      duration={1500}
                    />
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>billion</span>
                    {growthInd && (
                      <span className={styles.growthPill}>
                        <span className={styles.growthArrow} aria-hidden>
                          ↑
                        </span>
                        <span className={styles.growthValue}>
                          <CountUpValue
                            value={growthInd.value}
                            decimals={1}
                          />
                          % YoY
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
                  <div className={styles.rankLabel}>{FEATURED_RANK_LABEL}</div>
                  <div className={styles.rankValue}>
                    #
                    <CountUpValue value={rankInd.value} decimals={0} />
                  </div>
                  <div className={styles.rankSubtitle}>
                    {FEATURED_RANK_SUBTITLE}
                  </div>
                </div>
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
                Sources: {data.sources.slice(0, 3).join(" · ")}
              </span>
              <Link
                href={`/${locale}/india/${featuredModuleSlug}`}
                className={styles.openModuleLink}
              >
                Open module
              </Link>
            </div>
          </div>

          {/* RIGHT — World Rank + Latest Updates */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <WorldRankCard data={data} />
            <LatestUpdatesCard updates={data.latestUpdates} />
          </div>
          <SectionRightRailDots count={2} accent="#0C447C" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

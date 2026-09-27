"use client";

/**
 * v1 LivingStandardsClient — Section 03.
 *
 * Mirrors KnowAboutIndiaClient/IndiaAtGlanceClient v12:
 *   Identity zone (320px, teal gradient) with marquee directory
 *   Featured zone (1fr, white) showing Health Indicators
 *   Right column (240px) with State Leaders + Scheme Coverage cards
 *
 * IntersectionObserver flips `visible`; CountUpNumber animates
 * numeric cells once visible. Coming-soon directory rows render at
 * 55% opacity via data-status attribute and a matching CSS rule.
 *
 * All values from IndiaIndicator. State names + label strings live
 * in metrics.ts (editorial config).
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "../IndiaAtGlance/CountUpNumber";
import {
  LS_DIRECTORY,
  FEATURED_HEADLINE_REF,
  FEATURED_GROWTH_PILL_REF,
  FEATURED_GROWTH_PILL_TEMPLATE,
  FEATURED_RIGHT_CALLOUT_REF,
  FEATURED_RIGHT_CALLOUT_LABEL,
  FEATURED_RIGHT_CALLOUT_SUBLABEL,
  FEATURED_HEADLINE_LABEL,
  FEATURED_DESCRIPTION,
  FEATURED_CELLS,
  STATE_LEADERS,
  SCHEME_COVERAGE,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
  type StateLeaderEntry,
  type SchemeCoverageEntry,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import type {
  LivingStandardsData,
  LivingStandardsIndicator,
} from "@/lib/india/getLivingStandardsData";

type Props = {
  data: LivingStandardsData;
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
  byKey: Record<string, LivingStandardsIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): LivingStandardsIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  labelSuffix?: string,
): React.ReactNode {
  switch (format) {
    case "years_with_unit":
      return (
        <>
          <CountUpValue value={primary} decimals={1} /> yrs
        </>
      );
    case "crore_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={1} /> {labelSuffix ?? ""}
        </>
      );
    case "crore_simple":
      return (
        <>
          <CountUpValue value={primary} decimals={1} /> cr
        </>
      );
    case "lakh_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={1} /> {labelSuffix ?? ""}
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
  data: LivingStandardsData;
  locale: string;
  duplicate?: boolean;
}) {
  const module_ = data.moduleBySlug[row.moduleSlug];
  const headlineInd = getInd(data.indicatorByKey, row.headlineRef);

  if (!module_) return null;

  const displayValue: React.ReactNode = headlineInd
    ? renderDirectoryDisplay(row.format, headlineInd.value, row.labelSuffix)
    : EM_DASH;

  return (
    <Link
      href={`/${locale}/india/${row.moduleSlug}`}
      className={styles.directoryRow}
      data-status={module_.status}
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
  data: LivingStandardsData;
}) {
  const primary = getInd(data.indicatorByKey, cell.primary);
  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "decimal_1":
        valueNode = <CountUpValue value={primary.value} decimals={1} />;
        break;
      case "decimal_2":
        valueNode = <CountUpValue value={primary.value} decimals={2} />;
        break;
      case "integer":
        valueNode = <CountUpValue value={primary.value} decimals={0} />;
        break;
    }
  }
  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div>
        <div className={styles.featuredCellValue}>{valueNode}</div>
        <div className={styles.featuredCellSub}>{cell.subStat}</div>
      </div>
    </div>
  );
}

// ── Right cards ──

function StateLeaderRow({
  entry,
  data,
}: {
  entry: StateLeaderEntry;
  data: LivingStandardsData;
}) {
  const ind = getInd(data.indicatorByKey, entry.valueRef);
  const arrow = entry.direction === "lower_better" ? "⬇" : "⬆";
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        <span className={styles.rightCardListEntryArrow} aria-hidden>
          {arrow}
        </span>
        <span className={styles.rightCardListEntryLabel}>{entry.label}</span>
        <span className={styles.rightCardListEntryState}>· {entry.state}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>
        {ind ? (
          <>
            <CountUpValue value={ind.value} decimals={entry.decimals ?? 0} />
            {entry.valueSuffix}
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function StateLeadersCard({ data }: { data: LivingStandardsData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>State leaders</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⊕
        </span>
      </div>
      <div className={styles.rightCardList}>
        {STATE_LEADERS.map((entry) => (
          <StateLeaderRow
            key={`${entry.label}-${entry.state}`}
            entry={entry}
            data={data}
          />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        All state ranks
      </a>
    </div>
  );
}

function SchemeCoverageRow({
  entry,
  data,
}: {
  entry: SchemeCoverageEntry;
  data: LivingStandardsData;
}) {
  const ind = getInd(data.indicatorByKey, entry.valueRef);
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        <span className={styles.rightCardListEntryLabel}>{entry.label}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>
        {ind ? (
          <>
            <CountUpValue value={ind.value} decimals={entry.decimals ?? 0} />
            {entry.valueSuffix}
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function SchemeCoverageCard({ data }: { data: LivingStandardsData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Scheme coverage</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⚕
        </span>
      </div>
      <div className={styles.rightCardList}>
        {SCHEME_COVERAGE.map((entry) => (
          <SchemeCoverageRow key={entry.label} entry={entry} data={data} />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        All schemes
      </a>
    </div>
  );
}

// ── Main composition ──

export function LivingStandardsClient({ data, locale }: Props) {
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

  // Featured zone references
  const featuredRow = LS_DIRECTORY.find((r) => r.isFeatured);
  const featuredModuleSlug = featuredRow?.moduleSlug;
  const featuredModule = featuredModuleSlug
    ? data.moduleBySlug[featuredModuleSlug]
    : undefined;
  const headlineInd = getInd(data.indicatorByKey, FEATURED_HEADLINE_REF);
  const growthInd = getInd(data.indicatorByKey, FEATURED_GROWTH_PILL_REF);
  const calloutInd = getInd(data.indicatorByKey, FEATURED_RIGHT_CALLOUT_REF);

  const growthFragments = growthInd
    ? FEATURED_GROWTH_PILL_TEMPLATE.split("{value}")
    : null;

  return (
    <VisibleCtx.Provider value={visible}>
      <section
        ref={ref}
        data-tint-id="living"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="living-standards-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {INDIA_SUPER_CATEGORIES.length}
            </div>
            <h2
              id="living-standards-title"
              className={styles.identityTitle}
            >
              {data.superCategory.title}
            </h2>
            <p className={styles.identityDesc}>
              {data.superCategory.tagline ?? ""}
            </p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>
                {data.totalCount} modules
              </span>
              <span className={styles.modulesCountValue}>
                {data.liveCount} of {data.totalCount} live
              </span>
            </div>

            <div className={styles.directoryWindow}>
              <div className={styles.directoryTrack}>
                {LS_DIRECTORY.map((row) => (
                  <DirectoryRowItem
                    key={row.moduleSlug}
                    row={row}
                    data={data}
                    locale={locale}
                  />
                ))}
                <RepeatsDivider />
                {LS_DIRECTORY.map((row) => (
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
              slug="living-standards"
              className={styles.crossWatermark}
            />
          </div>

          {/* MIDDLE — Featured (Health Indicators) */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  {featuredRow?.emoji ?? ""}
                </span>
                <span className={styles.featuredTitle}>
                  {featuredModule?.title ?? featuredModuleSlug ?? ""}
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
                      value={headlineInd.value}
                      decimals={1}
                      duration={1500}
                    />
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>
                      {FEATURED_HEADLINE_LABEL}
                    </span>
                    {growthInd && growthFragments && (
                      <span className={styles.growthPill}>
                        <span className={styles.growthArrow} aria-hidden>
                          ↑
                        </span>
                        <span className={styles.growthValue}>
                          {growthFragments[0]}
                          <CountUpValue value={growthInd.value} decimals={0} />
                          {growthFragments[1]}
                        </span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className={styles.headlineMajor}>{EM_DASH}</span>
              )}

              {calloutInd && (
                <div className={styles.rightCallout}>
                  <div className={styles.rightCalloutLabel}>
                    {FEATURED_RIGHT_CALLOUT_LABEL}
                  </div>
                  <div className={styles.rightCalloutValue}>
                    <CountUpValue value={calloutInd.value} decimals={0} />
                  </div>
                  <div className={styles.rightCalloutSubtitle}>
                    {FEATURED_RIGHT_CALLOUT_SUBLABEL}
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
                {headlineInd?.source ?? ""}
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

          {/* RIGHT — State Leaders + Scheme Coverage */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <StateLeadersCard data={data} />
            <SchemeCoverageCard data={data} />
          </div>
          <SectionRightRailDots count={2} accent="#0F6E56" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

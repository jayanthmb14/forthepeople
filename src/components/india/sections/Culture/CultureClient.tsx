"use client";

/**
 * v1 CultureClient. Mirrors the WildlifeForests STATIC directory
 * pattern (no marquee for ≤5 modules). ROSE palette, Theater
 * watermark.
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "../IndiaAtGlance/CountUpNumber";
import {
  CUL_DIRECTORY,
  FEATURED_HEADLINE_REF,
  FEATURED_GROWTH_PILL_REF,
  FEATURED_GROWTH_PILL_FORMAT,
  FEATURED_RIGHT_CALLOUT_REF,
  FEATURED_RIGHT_CALLOUT_LABEL,
  FEATURED_RIGHT_CALLOUT_SUBLABEL,
  FEATURED_HEADLINE_LABEL,
  FEATURED_DESCRIPTION,
  FEATURED_CELLS,
  WORLD_HERITAGE_SITES,
  WORLD_HERITAGE_SITES_FOOTER_LABEL,
  CULTURAL_OUTPUT,
  CULTURAL_OUTPUT_FOOTER_LABEL,
  HERO_ANIMATION_DURATION_MS,
  ROW_ANIMATION_DURATION_MS,
  INTERSECTION_THRESHOLD,
  INTERSECTION_ROOT_MARGIN,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
  type WorldHeritageEntry,
  type CulturalOutputEntry,
} from "./metrics";
import type {
  CultureData,
  CultureIndicator,
} from "@/lib/india/getCultureData";

type Props = {
  data: CultureData;
  locale: string;
};

const EM_DASH = "—";

const VisibleCtx = createContext(false);

function CountUpValue({
  value,
  decimals,
  duration,
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
      duration={duration ?? ROW_ANIMATION_DURATION_MS}
      visible={visible}
    />
  );
}

function getInd(
  byKey: Record<string, CultureIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): CultureIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  labelSuffix?: string,
): React.ReactNode {
  switch (format) {
    case "count_simple":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> {labelSuffix ?? ""}
        </>
      );
    case "lakh_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> {labelSuffix ?? ""}
        </>
      );
    case "count_with_plus":
      return (
        <>
          <CountUpValue value={primary} decimals={0} />+
        </>
      );
    case "thousand_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> {labelSuffix ?? ""}
        </>
      );
  }
}

function DirectoryRowItem({
  row,
  data,
  locale,
}: {
  row: DirectoryRow;
  data: CultureData;
  locale: string;
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

function renderFeaturedCellPrimary(
  cell: FeaturedCell,
  data: CultureData,
): React.ReactNode {
  const p = cell.primary;
  if (p.kind === "static") return p.value;
  const ind = getInd(data.indicatorByKey, p.ref);
  if (!ind) return EM_DASH;
  switch (p.primaryFormat) {
    case "integer":
      return <CountUpValue value={ind.value} decimals={0} />;
    case "lakh_integer":
      return <CountUpValue value={ind.value} decimals={0} />;
  }
}

function FeaturedCellItem({
  cell,
  data,
}: {
  cell: FeaturedCell;
  data: CultureData;
}) {
  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div>
        <div className={styles.featuredCellValue}>
          {renderFeaturedCellPrimary(cell, data)}
        </div>
        <div className={styles.featuredCellSub}>{cell.sub.text}</div>
      </div>
    </div>
  );
}

function WorldHeritageRow({
  entry,
  data,
}: {
  entry: WorldHeritageEntry;
  data: CultureData;
}) {
  const ind = getInd(data.indicatorByKey, entry.yearRef);
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        <span className={styles.rightCardListEntryLabel}>{entry.name}</span>
        <span className={styles.rightCardListEntryState}>· {entry.state}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>
        {ind ? <CountUpValue value={ind.value} decimals={0} /> : EM_DASH}
      </span>
    </div>
  );
}

function WorldHeritageSitesCard({ data }: { data: CultureData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>World heritage sites</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🏛
        </span>
      </div>
      <div className={styles.rightCardList}>
        {WORLD_HERITAGE_SITES.map((entry) => (
          <WorldHeritageRow key={entry.name} entry={entry} data={data} />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        {WORLD_HERITAGE_SITES_FOOTER_LABEL}
      </a>
    </div>
  );
}

function CulturalOutputRow({
  entry,
  data,
}: {
  entry: CulturalOutputEntry;
  data: CultureData;
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
            <CountUpValue value={ind.value} decimals={0} />
            {entry.valueSuffix}
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function CulturalOutputCard({ data }: { data: CultureData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Cultural output</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🎭
        </span>
      </div>
      <div className={styles.rightCardList}>
        {CULTURAL_OUTPUT.map((entry) => (
          <CulturalOutputRow key={entry.label} entry={entry} data={data} />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        {CULTURAL_OUTPUT_FOOTER_LABEL}
      </a>
    </div>
  );
}

export function CultureClient({ data, locale }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: INTERSECTION_THRESHOLD, rootMargin: INTERSECTION_ROOT_MARGIN },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const featuredRow = CUL_DIRECTORY.find((r) => r.isFeatured);
  const featuredModuleSlug = featuredRow?.moduleSlug;
  const featuredModule = featuredModuleSlug
    ? data.moduleBySlug[featuredModuleSlug]
    : undefined;
  const headlineInd = getInd(data.indicatorByKey, FEATURED_HEADLINE_REF);
  const growthInd = getInd(data.indicatorByKey, FEATURED_GROWTH_PILL_REF);
  const calloutInd = getInd(data.indicatorByKey, FEATURED_RIGHT_CALLOUT_REF);
  const growthFragments = growthInd
    ? FEATURED_GROWTH_PILL_FORMAT.split("{value}")
    : null;

  return (
    <VisibleCtx.Provider value={visible}>
      <section
        ref={ref}
        data-tint-id="culture"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="culture-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone with STATIC directory (no marquee) */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {data.totalSuperCategories}
            </div>
            <h2 id="culture-title" className={styles.identityTitle}>
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

            <div className={styles.directory}>
              {CUL_DIRECTORY.map((row) => (
                <DirectoryRowItem
                  key={row.moduleSlug}
                  row={row}
                  data={data}
                  locale={locale}
                />
              ))}
            </div>

            <Link
              href={`/${locale}/india/category/${data.superCategory.slug}`}
              className={styles.browseBtn}
            >
              <span>Browse all {data.totalCount}</span>
            </Link>

            <SectionWatermark
              slug="culture"
              className={styles.theaterWatermark}
            />
          </div>

          {/* MIDDLE — Featured zone */}
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
                      decimals={0}
                      duration={HERO_ANIMATION_DURATION_MS}
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
                    #<CountUpValue value={calloutInd.value} decimals={0} />
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

          {/* RIGHT — World Heritage Sites + Cultural Output */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <WorldHeritageSitesCard data={data} />
            <CulturalOutputCard data={data} />
          </div>
          <SectionRightRailDots count={2} accent="#993556" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

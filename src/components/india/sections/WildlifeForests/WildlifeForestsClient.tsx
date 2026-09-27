"use client";

/**
 * v1 WildlifeForestsClient — Section 04.
 *
 * Forest-green palette. CRITICAL difference from Sections 02/03:
 * directory is STATIC — only 3 modules, no marquee, no ↻ REPEATS
 * divider. Same featured + right-column structure otherwise.
 *
 * Right column: TopForestStatesCard (5 ranked states) +
 * BiodiversityCard (Tigers / Elephants / Rhinos / Tiger reserves).
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "../IndiaAtGlance/CountUpNumber";
import {
  WF_DIRECTORY,
  FEATURED_HEADLINE_REF,
  FEATURED_GROWTH_PILL_REF,
  FEATURED_GROWTH_PILL_TEMPLATE,
  FEATURED_RIGHT_CALLOUT_REF,
  FEATURED_RIGHT_CALLOUT_LABEL,
  FEATURED_RIGHT_CALLOUT_SUBLABEL,
  FEATURED_HEADLINE_LABEL,
  FEATURED_DESCRIPTION,
  FEATURED_CELLS,
  TOP_FOREST_STATES,
  TOP_FOREST_STATES_FOOTER_LABEL,
  BIODIVERSITY,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
  type TopForestStateEntry,
  type BiodiversityEntry,
} from "./metrics";
import { INDIA_SUPER_CATEGORIES } from "@/lib/india/india-super-categories";
import type {
  WildlifeForestsData,
  WildlifeForestsIndicator,
} from "@/lib/india/getWildlifeForestsData";

type Props = {
  data: WildlifeForestsData;
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
  byKey: Record<string, WildlifeForestsIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): WildlifeForestsIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  labelSuffix?: string,
): React.ReactNode {
  switch (format) {
    case "pct_simple":
      return (
        <>
          <CountUpValue value={primary} decimals={1} />%
        </>
      );
    case "count_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={0} />
          {labelSuffix ?? ""}
        </>
      );
    case "count_with_plus":
      return (
        <>
          <CountUpValue value={primary} decimals={0} />+
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
  data: WildlifeForestsData;
  locale: string;
}) {
  const module_ = data.moduleBySlug[row.moduleSlug];
  const headlineInd = getInd(data.indicatorByKey, row.headlineRef);
  if (!module_) return null;

  const displayValue: React.ReactNode = headlineInd
    ? renderDirectoryDisplay(row.format, headlineInd.value, row.labelSuffix)
    : EM_DASH;

  return (
    <Link href={`/${locale}/india/${row.moduleSlug}`} className={styles.directoryRow}>
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

// ── Featured cell ──

function renderFeaturedCellPrimary(
  cell: FeaturedCell,
  data: WildlifeForestsData,
): React.ReactNode {
  const p = cell.primary;
  if (p.kind === "static") return p.value;
  const ind = getInd(data.indicatorByKey, p.ref);
  if (!ind) return EM_DASH;
  switch (p.primaryFormat) {
    case "pct_decimal_1":
      return (
        <>
          <CountUpValue value={ind.value} decimals={1} />%
        </>
      );
    case "pct_decimal_2":
      return (
        <>
          <CountUpValue value={ind.value} decimals={2} />%
        </>
      );
    case "integer":
      return <CountUpValue value={ind.value} decimals={0} />;
  }
}

function renderFeaturedCellSub(
  cell: FeaturedCell,
  data: WildlifeForestsData,
): React.ReactNode {
  const s = cell.sub;
  if (s.kind === "static") return s.text;
  const ind = getInd(data.indicatorByKey, s.ref);
  if (!ind) return EM_DASH;
  const decimals = s.decimals ?? 1;
  const fragments = s.template.split("{value}");
  return (
    <>
      {fragments[0]}
      <CountUpValue value={ind.value} decimals={decimals} />
      {fragments[1] ?? ""}
    </>
  );
}

function FeaturedCellItem({
  cell,
  data,
}: {
  cell: FeaturedCell;
  data: WildlifeForestsData;
}) {
  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div>
        <div className={styles.featuredCellValue}>
          {renderFeaturedCellPrimary(cell, data)}
        </div>
        <div className={styles.featuredCellSub}>
          {renderFeaturedCellSub(cell, data)}
        </div>
      </div>
    </div>
  );
}

// ── Right cards ──

function TopForestStatesRow({
  entry,
  data,
}: {
  entry: TopForestStateEntry;
  data: WildlifeForestsData;
}) {
  const ind = getInd(data.indicatorByKey, entry.valueRef);
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        <span className={styles.rightCardListEntryRank}>#{entry.rank}</span>
        <span className={styles.rightCardListEntryLabel}>{entry.state}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>
        {ind ? (
          <>
            <CountUpValue value={ind.value} decimals={1} />%
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function TopForestStatesCard({ data }: { data: WildlifeForestsData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Top forest states</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🌿
        </span>
      </div>
      <div className={styles.rightCardList}>
        {TOP_FOREST_STATES.map((entry) => (
          <TopForestStatesRow
            key={entry.state}
            entry={entry}
            data={data}
          />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        {TOP_FOREST_STATES_FOOTER_LABEL}
      </a>
    </div>
  );
}

function formatComma(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

function BiodiversityRow({
  entry,
  data,
}: {
  entry: BiodiversityEntry;
  data: WildlifeForestsData;
}) {
  const ind = getInd(data.indicatorByKey, entry.valueRef);
  // For comma_thousands we render the static formatted string (CountUp
  // doesn't support thousand separators); for integer we use CountUp.
  const valueNode = !ind
    ? EM_DASH
    : entry.format === "comma_thousands"
      ? formatComma(ind.value)
      : <CountUpValue value={ind.value} decimals={0} />;
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        {entry.emoji && (
          <span className={styles.rightCardListEntryEmoji} aria-hidden>
            {entry.emoji}
          </span>
        )}
        <span className={styles.rightCardListEntryLabel}>{entry.label}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>{valueNode}</span>
    </div>
  );
}

function BiodiversityCard({ data }: { data: WildlifeForestsData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Biodiversity</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🐾
        </span>
      </div>
      <div className={styles.rightCardList}>
        {BIODIVERSITY.map((entry) => (
          <BiodiversityRow
            key={entry.label}
            entry={entry}
            data={data}
          />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        Full census
      </a>
    </div>
  );
}

// ── Main composition ──

export function WildlifeForestsClient({ data, locale }: Props) {
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

  // Featured zone refs
  const featuredRow = WF_DIRECTORY.find((r) => r.isFeatured);
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
        data-tint-id="wildlife"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="wildlife-forests-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone with STATIC directory (no marquee) */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {INDIA_SUPER_CATEGORIES.length}
            </div>
            <h2
              id="wildlife-forests-title"
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

            <div className={styles.directory}>
              {WF_DIRECTORY.map((row) => (
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
              slug="wildlife-forests"
              className={styles.branchWatermark}
            />
          </div>

          {/* MIDDLE — Featured */}
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
                    %
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
                    <CountUpValue value={calloutInd.value} decimals={0} />%
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

          {/* RIGHT — Top Forest States + Biodiversity */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <TopForestStatesCard data={data} />
            <BiodiversityCard data={data} />
          </div>
          <SectionRightRailDots count={2} accent="#3B6D11" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

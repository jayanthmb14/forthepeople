"use client";

/**
 * v1 NaturalResourcesEnergyClient.
 *
 * Mirrors AgricultureLivestockClient: 4-row marquee directory,
 * featured zone showcasing Power Generation, right column with TOP
 * POWER STATES + ENERGY MIX.
 */

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { SectionWatermark } from "../SectionWatermark";
import { SectionRightRailDots } from "../SectionRightRailDots";
import { CountUpNumber } from "../IndiaAtGlance/CountUpNumber";
import {
  NRE_DIRECTORY,
  FEATURED_HEADLINE_REF,
  FEATURED_GROWTH_PILL_REF,
  FEATURED_GROWTH_PILL_FORMAT,
  FEATURED_RIGHT_CALLOUT_REF,
  FEATURED_RIGHT_CALLOUT_LABEL,
  FEATURED_RIGHT_CALLOUT_SUBLABEL,
  FEATURED_HEADLINE_LABEL,
  FEATURED_DESCRIPTION,
  FEATURED_CELLS,
  TOP_POWER_STATES,
  TOP_POWER_STATES_FOOTER_LABEL,
  ENERGY_MIX,
  ENERGY_MIX_FOOTER_LABEL,
  HERO_ANIMATION_DURATION_MS,
  INTERSECTION_THRESHOLD,
  INTERSECTION_ROOT_MARGIN,
  indicatorKey,
  type DirectoryRow,
  type DirectoryFormat,
  type FeaturedCell,
  type TopPowerStateEntry,
  type EnergyMixEntry,
} from "./metrics";
import type {
  NaturalResourcesEnergyData,
  NaturalResourcesEnergyIndicator,
} from "@/lib/india/getNaturalResourcesEnergyData";

type Props = {
  data: NaturalResourcesEnergyData;
  locale: string;
};

const EM_DASH = "—";

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

function getInd(
  byKey: Record<string, NaturalResourcesEnergyIndicator>,
  ref: { moduleSlug: string; metricKey: string },
): NaturalResourcesEnergyIndicator | undefined {
  return byKey[indicatorKey(ref)];
}

function renderDirectoryDisplay(
  format: DirectoryFormat,
  primary: number,
  labelSuffix?: string,
): React.ReactNode {
  switch (format) {
    case "gw_simple":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> GW
        </>
      );
    case "gw_with_label":
      return (
        <>
          <CountUpValue value={primary} decimals={0} /> {labelSuffix ?? ""}
        </>
      );
    case "mt_with_label":
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
  duplicate = false,
}: {
  row: DirectoryRow;
  data: NaturalResourcesEnergyData;
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

function FeaturedCellItem({
  cell,
  data,
}: {
  cell: FeaturedCell;
  data: NaturalResourcesEnergyData;
}) {
  const primary = getInd(data.indicatorByKey, cell.primary);
  const sub = getInd(data.indicatorByKey, cell.sub.ref);

  let valueNode: React.ReactNode = EM_DASH;
  if (primary) {
    switch (cell.primaryFormat) {
      case "gw_decimal_1":
        valueNode = (
          <>
            <CountUpValue value={primary.value} decimals={1} /> GW
          </>
        );
        break;
      case "gw_integer":
        valueNode = (
          <>
            <CountUpValue value={primary.value} decimals={0} /> GW
          </>
        );
        break;
    }
  }

  let subNode: React.ReactNode = EM_DASH;
  if (sub) {
    const fragments = cell.sub.template.split("{value}");
    subNode = (
      <>
        {fragments[0]}
        <CountUpValue value={sub.value} decimals={cell.sub.decimals ?? 0} />
        {fragments[1] ?? ""}
      </>
    );
  }

  return (
    <div className={styles.featuredCell}>
      <div className={styles.featuredCellLabel}>{cell.label}</div>
      <div>
        <div className={styles.featuredCellValue}>{valueNode}</div>
        <div className={styles.featuredCellSub}>{subNode}</div>
      </div>
    </div>
  );
}

function TopPowerStatesRow({
  entry,
  data,
}: {
  entry: TopPowerStateEntry;
  data: NaturalResourcesEnergyData;
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
            <CountUpValue value={ind.value} decimals={0} /> GW
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function TopPowerStatesCard({ data }: { data: NaturalResourcesEnergyData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Top power states</span>
        <span className={styles.rightCardIcon} aria-hidden>
          ⚡
        </span>
      </div>
      <div className={styles.rightCardList}>
        {TOP_POWER_STATES.map((entry) => (
          <TopPowerStatesRow key={entry.state} entry={entry} data={data} />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        {TOP_POWER_STATES_FOOTER_LABEL}
      </a>
    </div>
  );
}

function EnergyMixRow({
  entry,
  data,
}: {
  entry: EnergyMixEntry;
  data: NaturalResourcesEnergyData;
}) {
  const ind = getInd(data.indicatorByKey, entry.valueRef);
  return (
    <div className={styles.rightCardListEntry}>
      <span className={styles.rightCardListEntryLeft}>
        <span className={styles.rightCardListEntryEmoji} aria-hidden>
          {entry.emoji}
        </span>
        <span className={styles.rightCardListEntryLabel}>{entry.label}</span>
      </span>
      <span className={styles.rightCardListEntryValue}>
        {ind ? (
          <>
            <CountUpValue value={ind.value} decimals={entry.decimals ?? 0} />%
          </>
        ) : (
          EM_DASH
        )}
      </span>
    </div>
  );
}

function EnergyMixCard({ data }: { data: NaturalResourcesEnergyData }) {
  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>Energy mix</span>
        <span className={styles.rightCardIcon} aria-hidden>
          🔌
        </span>
      </div>
      <div className={styles.rightCardList}>
        {ENERGY_MIX.map((entry) => (
          <EnergyMixRow key={entry.label} entry={entry} data={data} />
        ))}
      </div>
      <a href="#" className={styles.rightCardLink}>
        {ENERGY_MIX_FOOTER_LABEL}
      </a>
    </div>
  );
}

export function NaturalResourcesEnergyClient({ data, locale }: Props) {
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

  const featuredRow = NRE_DIRECTORY.find((r) => r.isFeatured);
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
        data-tint-id="natural"
        className={`${styles.section} ${visible ? styles.visible : ""}`}
        aria-labelledby="natural-resources-energy-title"
      >
        <div className={styles.layout}>
          {/* LEFT — Identity zone */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              Section {data.superCategory.displayOrder} of {data.totalSuperCategories}
            </div>
            <h2
              id="natural-resources-energy-title"
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
                {NRE_DIRECTORY.map((row) => (
                  <DirectoryRowItem
                    key={row.moduleSlug}
                    row={row}
                    data={data}
                    locale={locale}
                  />
                ))}
                <RepeatsDivider />
                {NRE_DIRECTORY.map((row) => (
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
              slug="natural-resources-energy"
              className={styles.sunWatermark}
            />
          </div>

          {/* MIDDLE — Featured (Power Generation) */}
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
                    <CountUpValue value={calloutInd.value} decimals={0} /> GW
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

          {/* RIGHT — Top Power States + Energy Mix */}
          <div className={styles.rightColumn} data-ftp-right-rail="1">
            <TopPowerStatesCard data={data} />
            <EnergyMixCard data={data} />
          </div>
          <SectionRightRailDots count={2} accent="#1F5C5C" />
        </div>
      </section>
    </VisibleCtx.Provider>
  );
}

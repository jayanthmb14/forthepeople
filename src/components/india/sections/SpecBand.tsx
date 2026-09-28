"use client";

/**
 * SpecBand — renders one super-category band from its BandSpec, with that
 * band's own CSS module (all bands share the class names; each module
 * brings its palette).
 *
 *   left    identity zone: section count, title, tagline, live count,
 *           the module directory, "Browse all"
 *   middle  featured module: headline number, growth pill, callout,
 *           description, four cells, source and "Open module"
 *   right   two cards of rows (top-5 lists get a thin bar per row; a mix
 *           card gets one stacked bar of shares)
 *
 * Replaces eight near-identical 500-line band clients (Sep 2026). Every
 * word comes from next-intl (page_india), numbers are formatted in the page
 * language and are right in the server HTML (BandNumber counts up once
 * after that). Nothing moves forever; the directory is a plain list.
 * Missing data → "—". Never invents.
 */

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp } from "lucide-react";
import { CategoryGlyph } from "@/components/graphics";
import { SectionWatermark } from "./SectionWatermark";
import { BandNumber, BandVisibleProvider, RowBar, useBandText, useBandVisible } from "./band-kit";
import { indicatorKey, type BandSpec, type CardSpec, type GlyphRef, type RowSpec, type TextOrValue, type ValueSpec } from "./band-spec";
import { indiaModuleGlyph } from "../glyphs";
import { INDIA_SUPER_CATEGORIES, type IndiaSuperCategoryDef } from "@/lib/india/india-super-categories";
import { INDIA_NS } from "../i18n";
import { getIndiaModuleBySlug, type IndiaModuleStatus } from "@/lib/india/india-modules";
import { oldFigureYear } from "@/lib/india/figure-dates";

export interface BandDataLike {
  superCategory: IndiaSuperCategoryDef;
  moduleBySlug: Record<string, { slug: string; title: string; status: IndiaModuleStatus }>;
  totalCount: number;
  liveCount: number;
  indicatorByKey: Record<string, { value: number; source: string | null; asOfDate?: Date | string | null }>;
}

/** Page-load time: a directory figure older than 18 months shows its year. */
const LOADED_AT = Date.now();

/** " (2020)" after a figure that is more than 18 months old (Sept 2026 audit: R&D "0.65%" is 2020's). */
function OldYear({ asOf }: { asOf: Date | string | null | undefined }) {
  const year = oldFigureYear(asOf, LOADED_AT);
  return year ? <span style={{ fontSize: "0.8em", fontWeight: 400, color: "var(--ftp-text-2)" }}> ({year})</span> : null;
}

type Styles = Readonly<Record<string, string>>;
type Text = ReturnType<typeof useBandText>;

const EM_DASH = "—";

/** A spec's glyph as CategoryGlyph props (a name keeps the glyph's own hue). */
const glyphProps = (g: GlyphRef) => (typeof g === "string" ? { glyph: g } : { pick: g });

/** Inline pictures sit centred on the text line, not on its baseline. */
const CENTRED: React.CSSProperties = { alignSelf: "center" };

type ByKey = BandDataLike["indicatorByKey"];

/** One number from the band's indicators, formatted and wrapped in its message. */
function Value({ spec, byKey, duration }: { spec: ValueSpec; byKey: ByKey; duration?: number }) {
  const t = useTranslations(INDIA_NS);
  const ind = byKey[indicatorKey(spec.ref)];
  if (!ind) return <>{EM_DASH}</>;
  if (spec.year) {
    const y = String(Math.round(ind.value));
    return <>{spec.fmt ? t(spec.fmt, { value: y }) : y}</>;
  }
  const fmt = spec.fmt;
  return (
    <>
      {spec.rank ? "#" : null}
      <BandNumber value={ind.value} decimals={spec.decimals ?? 0} duration={duration} render={fmt ? (v) => t(fmt, { value: v }) : undefined} />
    </>
  );
}

function isValue(x: TextOrValue): x is ValueSpec {
  return "ref" in x;
}

function Card({
  card,
  spec,
  data,
  styles,
  locale,
  text,
}: {
  card: CardSpec;
  spec: BandSpec;
  data: BandDataLike;
  styles: Styles;
  locale: string;
  text: Text;
}) {
  const { tb } = text;
  const ts = useTranslations("states");
  const stateName = (slug: string) => (ts.has(slug) ? ts(slug) : slug);
  const valueOf = (r: RowSpec) => data.indicatorByKey[indicatorKey(r.value.ref)]?.value;
  const max = Math.max(0, ...card.rows.map((r) => valueOf(r) ?? 0));
  const linkN = card.linkValue ? data.indicatorByKey[indicatorKey(card.linkValue.ref)]?.value : undefined;

  const mix = card.mixBar
    ? card.rows
        .map((r) => ({ r, v: valueOf(r) }))
        .filter((m): m is { r: RowSpec; v: number } => typeof m.v === "number" && m.v > 0)
    : [];

  return (
    <div className={styles.rightCard}>
      <div className={styles.rightCardHeader}>
        <span className={styles.rightCardTitle}>{tb(`cards.${card.key}.title`)}</span>
        <span className={styles.rightCardIcon} aria-hidden>
          <CategoryGlyph {...glyphProps(card.glyph)} size={16} />
        </span>
      </div>

      {mix.length >= 2 ? (
        <div
          aria-hidden
          style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", margin: "8px 0 2px", background: "rgba(0,0,0,0.06)" }}
        >
          {mix.map(({ r, v }) => (
            <span key={r.key} className="ftp-grow-x" style={{ width: `${Math.min(100, v)}%`, background: r.color ?? spec.dotsAccent }} />
          ))}
        </div>
      ) : null}

      <ul className={styles.rightCardList} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {card.rows.map((row) => {
          const v = valueOf(row);
          return (
            <li key={row.key}>
              <div className={styles.rightCardListEntry}>
                <span className={styles.rightCardListEntryLeft}>
                  {row.arrow ? (
                    <span className={styles.rightCardListEntryArrow} aria-hidden style={{ ...CENTRED, display: "inline-flex" }}>
                      {row.arrow === "down" ? <ArrowDown size={12} strokeWidth={2.5} /> : <ArrowUp size={12} strokeWidth={2.5} />}
                    </span>
                  ) : null}
                  {row.rank !== undefined ? <span className={styles.rightCardListEntryRank}>#{row.rank}</span> : null}
                  {row.glyph || (card.mixBar && row.color) ? (
                    <span className={styles.rightCardListEntryEmoji} aria-hidden style={{ ...CENTRED, display: "inline-flex", alignItems: "center" }}>
                      {card.mixBar && row.color ? (
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: row.color, marginInlineEnd: 4 }} />
                      ) : null}
                      {row.glyph ? <CategoryGlyph {...glyphProps(row.glyph)} size={16} /> : null}
                    </span>
                  ) : null}
                  <span className={styles.rightCardListEntryLabel}>
                    {row.state ? stateName(row.state) : tb(`cards.${card.key}.rows.${row.key}`)}
                  </span>
                  {row.note ? (
                    <span className={styles.rightCardListEntryState}>
                      {"state" in row.note ? stateName(row.note.state) : tb(`notes.${row.note.text}`)}
                    </span>
                  ) : null}
                </span>
                <span className={styles.rightCardListEntryValue}>
                  <Value spec={row.value} byKey={data.indicatorByKey} />
                </span>
              </div>
              {card.bars && typeof v === "number" ? <RowBar value={v} max={max} color={spec.dotsAccent} /> : null}
            </li>
          );
        })}
      </ul>
      <Link href={`/${locale}${card.href}`} className={styles.rightCardLink}>
        {tb(`cards.${card.key}.link`, typeof linkN === "number" ? { n: Math.round(linkN) } : undefined)}
      </Link>
    </div>
  );
}

export function SpecBand({ spec, styles, data, locale }: { spec: BandSpec; styles: Styles; data: BandDataLike; locale: string }) {
  const [ref, visible] = useBandVisible();
  const text = useBandText(spec.group);
  const { t, tb, x } = text;
  const byKey = data.indicatorByKey;
  const f = spec.featured;

  const featuredDef = getIndiaModuleBySlug(f.moduleSlug);
  const featuredModule = data.moduleBySlug[f.moduleSlug];
  const headlineInd = data.indicatorByKey[indicatorKey(f.headline.ref)];
  const growthInd = f.growth ? data.indicatorByKey[indicatorKey(f.growth.ref)] : undefined;
  const calloutInd = f.callout?.value
    ? data.indicatorByKey[indicatorKey(f.callout.value.ref)]
    : f.callout?.subValue
      ? data.indicatorByKey[indicatorKey(f.callout.subValue.ref)]
      : undefined;

  const directory = (
    <>
      {spec.directory.map((row) => {
        const mod = data.moduleBySlug[row.moduleSlug];
        const def = getIndiaModuleBySlug(row.moduleSlug);
        if (!mod) return null;
        return (
          <Link key={row.moduleSlug} href={`/${locale}/india/${row.moduleSlug}`} className={styles.directoryRow} data-status={mod.status}>
            <span className={styles.directoryRowLabel}>
              <CategoryGlyph pick={indiaModuleGlyph(row.moduleSlug, def?.category)} size={16} style={CENTRED} /> {def ? x.moduleTitle(def) : mod.title}
              {row.featured && <span className={styles.directoryRowFeaturedTag}>{t("band.featured")}</span>}
            </span>
            <span className={styles.directoryRowValue}>
              <Value spec={row.value} byKey={data.indicatorByKey} />
              <OldYear asOf={data.indicatorByKey[indicatorKey(row.value.ref)]?.asOfDate} />
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <BandVisibleProvider visible={visible}>
      <section ref={ref} data-tint-id={spec.tintId} className={`${styles.section} ${visible ? styles.visible : ""}`} aria-labelledby={spec.titleId}>
        <div className={styles.layout}>
          {/* LEFT — identity zone */}
          <div className={styles.identityZone}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionLabelDot} aria-hidden />
              {t("band.sectionOf", { n: data.superCategory.displayOrder, total: INDIA_SUPER_CATEGORIES.length })}
            </div>
            <h2 id={spec.titleId} className={styles.identityTitle}>
              {x.scTitle(data.superCategory)}
            </h2>
            <p className={styles.identityDesc}>{x.scTagline(data.superCategory)}</p>

            <div className={styles.modulesCount}>
              <span className={styles.modulesCountLabel}>{t("band.countModules", { n: data.totalCount })}</span>
              <span className={styles.modulesCountValue}>{t("band.liveOf", { live: data.liveCount, total: data.totalCount })}</span>
            </div>

            {spec.staticDirectory ? (
              <div className={styles.directory}>{directory}</div>
            ) : (
              <div className={styles.directoryWindow}>
                <div className={styles.directoryTrack}>{directory}</div>
              </div>
            )}

            <Link href={`/${locale}/india/category/${data.superCategory.slug}`} className={styles.browseBtn}>
              <span>{t("band.browseAll", { n: data.totalCount })}</span>
            </Link>

            <SectionWatermark slug={spec.slug} className={styles[spec.watermarkClass] ?? ""} />
          </div>

          {/* MIDDLE — featured module */}
          <div className={styles.featured}>
            <div className={styles.featuredHeader}>
              <div className={styles.featuredHeaderLeft}>
                <span className={styles.featuredIcon} aria-hidden>
                  <CategoryGlyph pick={indiaModuleGlyph(f.moduleSlug, featuredDef?.category)} size={18} />
                </span>
                <span className={styles.featuredTitle}>{featuredDef ? x.moduleTitle(featuredDef) : f.moduleSlug}</span>
                {headlineInd?.source && <span className={styles.featuredSourceInline}>{headlineInd.source}</span>}
              </div>
              {featuredModule?.status === "live" && <span className={styles.livePill}>{t("band.liveModule")}</span>}
            </div>

            <div className={styles.headlineRow}>
              {headlineInd ? (
                <>
                  <span className={styles.headlineMajor}>
                    <Value spec={f.headline} byKey={byKey} duration={1500} />
                  </span>
                  <div className={styles.headlineMinorBlock}>
                    <span className={styles.headlineMinor}>{tb("headlineUnit")}</span>
                    {f.growth && growthInd && (
                      <span className={styles.growthPill}>
                        <span className={styles.growthArrow} aria-hidden>
                          ↑
                        </span>
                        <span className={styles.growthValue}>
                          <Value spec={f.growth} byKey={byKey} />
                        </span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className={styles.headlineMajor}>{EM_DASH}</span>
              )}

              {f.callout && calloutInd && (
                <div className={styles.rightCallout}>
                  <div className={styles.rightCalloutLabel}>{f.callout.label ? tb(f.callout.label) : t("band.target")}</div>
                  <div className={styles.rightCalloutValue}>
                    {f.callout.value ? <Value spec={f.callout.value} byKey={byKey} /> : f.callout.valueText ? tb(f.callout.valueText) : null}
                  </div>
                  <div className={styles.rightCalloutSubtitle}>
                    {f.callout.subValue ? <Value spec={f.callout.subValue} byKey={byKey} /> : f.callout.sub ? tb(f.callout.sub) : null}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.featuredDesc}>{tb("desc")}</div>

            <div className={styles.featuredGrid}>
              {f.cells.map((cell) => (
                <div key={cell.key} className={styles.featuredCell}>
                  <div className={styles.featuredCellLabel}>{tb(`cells.${cell.key}.label`)}</div>
                  <div>
                    <div className={styles.featuredCellValue}>
                      {isValue(cell.value) ? <Value spec={cell.value} byKey={byKey} /> : tb(`cells.${cell.key}.${cell.value.text}`)}
                    </div>
                    <div className={styles.featuredCellSub}>
                      {isValue(cell.sub) ? <Value spec={cell.sub} byKey={byKey} /> : tb(`cells.${cell.key}.${cell.sub.text}`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.featuredBottom}>
              <span className={styles.featuredSources}>{headlineInd?.source ?? ""}</span>
              <Link href={`/${locale}/india/${f.moduleSlug}`} className={styles.openModuleLink}>
                {t("band.openModule")}
              </Link>
            </div>
          </div>

          {/* RIGHT — two cards */}
          <div className={styles.rightColumn}>
            {spec.cards.map((card) => (
              <Card key={card.key} card={card} spec={spec} data={data} styles={styles} locale={locale} text={text} />
            ))}
          </div>
        </div>
      </section>
    </BandVisibleProvider>
  );
}

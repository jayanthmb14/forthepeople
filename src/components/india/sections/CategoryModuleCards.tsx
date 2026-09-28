/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The module cards on /[locale]/india/category/<slug> (v4.1).
 *
 * Each card shows the module's glyph, title, Live/Soon pill, its headline
 * figure (with label and date) and tagline. Tapping the card opens a
 * DetailSheet with everything the page knows about the module: what it
 * covers, every published figure (value, date, source), where the
 * numbers come from and a button to the full page. A separate "Open page"
 * link under each card keeps a plain link for anyone who wants the full
 * page straight away (and for search engines).
 *
 * Figures are IndiaIndicator rows formatted on the server; no placeholder
 * numbers. Strings arrive translated, except the sheet's own labels
 * ("page_india-category" sheet.*).
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ExternalLink } from "lucide-react";
import { DetailSheet } from "@/components/district/DetailSheet";
import { CategoryGlyph } from "@/components/graphics";
import { useFormat } from "@/i18n/client";
import { KitIcon, emojiIcon } from "@/lib/design/emoji-icons";
import type { FigureDetail } from "../FigureSheet";
import { indiaModuleGlyph } from "../glyphs";
import styles from "../india-tap.module.css";

export interface CategoryCard {
  slug: string;
  href: string;
  /** Kept for the kit's detail sheet, which draws its Lucide icon (never the emoji). */
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  isLive: boolean;
  statusLabel: string;
  /** The headline figure shown on the card. */
  headline?: { value: string; unit?: string; caption: string };
  /** Every published figure of the module (shown in the sheet). */
  figures: FigureDetail[];
  sources: Array<{ name: string; url?: string; refresh?: string }>;
}

function StatusPill({ isLive, label }: { isLive: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 650,
        padding: "2px 9px",
        borderRadius: 999,
        background: isLive ? "var(--ftp-live-tint)" : "var(--ftp-warn-tint)",
        color: isLive ? "var(--ftp-live-text)" : "var(--ftp-warn)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function CategoryModuleCards({
  cards,
  hueClassName,
  noFigureLabel,
}: {
  cards: CategoryCard[];
  hueClassName: string;
  noFigureLabel: string;
}) {
  const t = useTranslations("page_india-category");
  const f = useFormat();
  const [open, setOpen] = React.useState<CategoryCard | null>(null);
  const close = React.useCallback(() => setOpen(null), []);

  return (
    <>
      <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "260px" }}>
        {cards.map((c) => (
          <li key={c.slug} style={{ minWidth: 0 }}>
            <article className={styles.card}>
              <button type="button" className={styles.cardButton} onClick={() => setOpen(c)} aria-label={t("grid.details", { module: c.title })}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <CategoryGlyph pick={indiaModuleGlyph(c.slug)} size={42} chip />
                  <span className="ftp-display" style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 650, lineHeight: 1.3 }}>
                    {c.title}
                  </span>
                  <StatusPill isLive={c.isLive} label={c.statusLabel} />
                </span>
                {c.headline ? (
                  <span style={{ display: "block" }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span className="ftp-bignum" style={{ fontSize: 28, lineHeight: 1.1, color: "var(--hue-deep)" }}>
                        {c.headline.value}
                      </span>
                      {c.headline.unit ? <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ftp-text-2)" }}>{c.headline.unit}</span> : null}
                    </span>
                    <span style={{ display: "block", fontSize: 13, color: "var(--ftp-text-2)", marginTop: 2 }}>{c.headline.caption}</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{noFigureLabel}</span>
                )}
                <span style={{ fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{c.tagline}</span>
              </button>
              <div className={styles.cardFoot}>
                <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>
                  {c.figures.length > 0 ? t("grid.figureCount", { n: c.figures.length }) : null}
                </span>
                <Link href={c.href} className={styles.cardLink}>
                  {t("grid.openShort")}
                  <ArrowRight size={14} aria-hidden className="india-flip-rtl" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <DetailSheet
        open={open !== null}
        onClose={close}
        title={open?.title ?? ""}
        subtitle={open?.tagline}
        emoji={open?.emoji}
        hueClassName={hueClassName}
        footer={
          open ? (
            <Link href={open.href} className={`${styles.sheetAction} ${styles.sheetActionPrimary}`}>
              {t("sheet.openPage", { module: open.title })}
              <ArrowRight size={14} aria-hidden className="india-flip-rtl" />
            </Link>
          ) : undefined
        }
      >
        {open ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <StatusPill isLive={open.isLive} label={open.statusLabel} />
            </div>
            <p className="ftp-prose" style={{ margin: 0, fontSize: 15, lineHeight: "23px", color: "var(--ftp-text)" }}>
              {open.description}
            </p>

            <section>
              <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 650 }}>
                {t("sheet.figures")}
              </h3>
              {open.figures.length > 0 ? (
                <ul className={styles.figList}>
                  {open.figures.map((fig) => (
                    <li key={fig.key} className={styles.figItem}>
                      {/* The figure's kind (rank, share, year) as the kit's Lucide icon, else the module's glyph. */}
                      <span aria-hidden style={{ display: "inline-flex", height: 26, alignItems: "center", color: "var(--hue-deep)" }}>
                        {emojiIcon(fig.emoji) ? <KitIcon emoji={fig.emoji} size={20} /> : <CategoryGlyph pick={indiaModuleGlyph(open.slug)} size={20} />}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, color: "var(--ftp-text)" }} lang={fig.labelLang}>
                          {fig.label}
                        </span>
                        <span className={styles.figItemValue}>
                          {fig.value}
                          {fig.unit ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ftp-text-2)", marginInlineStart: 5 }}>{fig.unit}</span> : null}
                        </span>
                        <span className={styles.figItemMeta} style={{ display: "block" }}>
                          {t("sheet.figureMeta", { date: f.date(fig.asOf, { dateStyle: "medium" }) })}{" "}
                          {fig.source.href ? (
                            <a href={fig.source.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
                              {fig.source.label}
                            </a>
                          ) : (
                            fig.source.label
                          )}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: "var(--ftp-text-2)" }}>{t("sheet.noFigures")}</p>
              )}
            </section>

            {open.sources.length > 0 ? (
              <section>
                <h3 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 650 }}>
                  {t("sheet.sources")}
                </h3>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                  {open.sources.map((s) => (
                    <li key={s.name} style={{ fontSize: 14, lineHeight: "21px" }}>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, minHeight: 32, color: "var(--hue-deep)", fontWeight: 600 }}
                        >
                          {s.name}
                          <ExternalLink size={12} aria-hidden />
                        </a>
                      ) : (
                        s.name
                      )}
                      {s.refresh ? <span style={{ fontSize: 12, color: "var(--ftp-text-2)", marginInlineStart: 8 }}>{s.refresh}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </DetailSheet>
      <style>{`[dir="rtl"] .india-flip-rtl { transform: scaleX(-1); }`}</style>
    </>
  );
}

export default CategoryModuleCards;

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * "Tap a number, see everything about it" for the India pages (v4.1).
 *
 *   FigureTiles       a StatStrip of published figures; tapping a tile
 *                     opens a DetailSheet with the figure, its date, the
 *                     value before it and the change, what kind of figure
 *                     it is, when we recorded it and the source link.
 *   FigureSheetBody   that sheet's content, reused by other sheets.
 *
 * Every figure is an IndiaIndicator row, formatted on the server; this
 * component only lays it out. Text from "page_india-module" (sheet.*,
 * data.*) and "page_india" (quality.*).
 */
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, ExternalLink } from "lucide-react";
import { StatStrip, StatTile } from "@/components/district/ui";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { useFormat } from "@/i18n/client";
import { INDIA_NS } from "./i18n";
import styles from "./india-tap.module.css";

/** One published figure, already formatted and translated on the server. */
export interface FigureDetail {
  key: string;
  label: string;
  /** lang of the label when it is the stored English text. */
  labelLang?: string;
  value: string;
  unit?: string;
  emoji: string;
  /** ISO date the figure is true for. */
  asOf: string;
  source: { label: string; href?: string };
  /** The figure before this one, formatted. */
  previous?: { value: string; asOf: string | null } | null;
  /** Change since the previous figure. */
  change?: { dir: "up" | "down" | "same"; pct: string; year?: string } | null;
  quality?: "published" | "derived" | "estimated";
  methodologyUrl?: string | null;
  /** ISO time we recorded the figure. */
  recordedAt?: string | null;
}

/** Big number + label + every detail row, for any sheet about one figure. */
export function FigureSheetBody({ figure }: { figure: FigureDetail }) {
  const t = useTranslations("page_india-module");
  const tp = useTranslations(INDIA_NS);
  const f = useFormat();
  const date = (iso: string) => f.date(iso, { dateStyle: "medium" });
  return (
    <>
      <div className={styles.sheetFigure}>
        <span className={styles.sheetFigureValue}>{figure.value}</span>
        {figure.unit ? <span className={styles.sheetFigureUnit}>{figure.unit}</span> : null}
        <span className={styles.sheetFigureLabel} lang={figure.labelLang}>
          {figure.label}
        </span>
      </div>
      <DetailList
        rows={[
          { emoji: "📅", label: t("sheet.asOf"), value: date(figure.asOf) },
          {
            emoji: "⏪",
            label: t("sheet.before"),
            value: figure.previous
              ? figure.previous.asOf
                ? t("sheet.beforeValue", { value: figure.previous.value, date: date(figure.previous.asOf) })
                : figure.previous.value
              : null,
          },
          {
            emoji: figure.change?.dir === "down" ? "📉" : "📈",
            label: t("sheet.change"),
            value: figure.change
              ? figure.change.year
                ? t("data.changeYear", { dir: figure.change.dir, pct: figure.change.pct, year: figure.change.year })
                : t("data.changePrior", { dir: figure.change.dir, pct: figure.change.pct })
              : null,
          },
          { emoji: "🏷️", label: t("sheet.kind"), value: figure.quality ? tp(`quality.${figure.quality}`) : null },
          {
            emoji: "🏛️",
            label: t("sheet.source"),
            value: figure.source.href ? (
              <a href={figure.source.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                {figure.source.label}
              </a>
            ) : (
              figure.source.label
            ),
          },
          {
            emoji: "🕒",
            label: t("sheet.recorded"),
            value: figure.recordedAt ? date(figure.recordedAt) : null,
          },
        ]}
      />
    </>
  );
}

/** Footer buttons for a figure sheet: open the source, how it is measured. */
export function FigureSheetActions({ figure }: { figure: FigureDetail }) {
  const t = useTranslations("page_india-module");
  return (
    <>
      {figure.source.href ? (
        <a href={figure.source.href} target="_blank" rel="noopener noreferrer" className={`${styles.sheetAction} ${styles.sheetActionPrimary}`}>
          {t("sheet.openSource")}
          <ExternalLink size={14} aria-hidden />
        </a>
      ) : null}
      {figure.methodologyUrl ? (
        <a href={figure.methodologyUrl} target="_blank" rel="noopener noreferrer" className={styles.sheetAction}>
          {t("data.methodology")}
          <ExternalLink size={14} aria-hidden />
        </a>
      ) : null}
    </>
  );
}

/** One StatTile that opens its figure's sheet. */
function TapTile({ figure, onOpen }: { figure: FigureDetail; onOpen: () => void }) {
  const t = useTranslations("page_india-module");
  return (
    <div className={styles.tap}>
      <StatTile
        label={figure.label}
        value={figure.value}
        unit={figure.unit || undefined}
        emoji={figure.emoji}
        asOf={figure.asOf}
        // No link inside the tile: the whole tile is the button, and the
        // source link is in the sheet.
        source={{ label: figure.source.label }}
      />
      <button type="button" className={styles.tapCover} onClick={onOpen} aria-label={t("sheet.open", { label: figure.label })} />
      <span className={styles.tapHint} aria-hidden>
        <ChevronRight size={15} />
      </span>
    </div>
  );
}

/**
 * A StatStrip of tappable figure tiles. `hueClassName` colours the sheet
 * (it opens in a portal, outside the page's hue scope).
 */
export function FigureTiles({ figures, hueClassName }: { figures: FigureDetail[]; hueClassName?: string }) {
  const [open, setOpen] = React.useState<FigureDetail | null>(null);
  const close = React.useCallback(() => setOpen(null), []);
  if (figures.length === 0) return null;
  const cols = figures.length >= 4 ? 4 : figures.length === 3 ? 3 : 2;
  return (
    <>
      <StatStrip cols={cols}>
        {figures.map((fig) => (
          <TapTile key={fig.key} figure={fig} onOpen={() => setOpen(fig)} />
        ))}
      </StatStrip>
      <DetailSheet
        open={open !== null}
        onClose={close}
        title={open?.label ?? ""}
        titleLang={open?.labelLang}
        emoji={open?.emoji}
        hueClassName={hueClassName}
        footer={open && (open.source.href || open.methodologyUrl) ? <FigureSheetActions figure={open} /> : undefined}
      >
        {open ? <FigureSheetBody figure={open} /> : null}
      </DetailSheet>
    </>
  );
}

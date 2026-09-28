/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Public transparency feed: every IndiaIndicator update, newest first.
 *
 * v4.1 layout (docs/LAYOUT.md):
 *   1. "In simple words" — one sentence from the loaded rows
 *   2. four tiles: updates shown, topics, newest recorded, sources
 *   3. the picture: a ring of which topics changed most (beside the
 *      sentence and tiles on laptops and PCs, below them on phones)
 *   4. topic chips, then the updates as cards (1 column on phones, 2 on
 *      tablets, 3 on laptops and PCs); tapping a card opens a DetailSheet
 *      with the figure, its dates, the source link and the topic page
 *
 * Builds trust ("they actually update this"). The list is empty until the
 * first sync, which shows a friendly empty state instead of a broken page.
 *
 * i18n: text from "page_india-updates"; topic names, module titles and
 * units from "page_india"; metric labels from "page_india-module" when a
 * translation exists (otherwise the English label as stored, marked
 * lang="en"). Numbers and dates follow the page language.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ExternalLink } from "lucide-react";
import { type IndiaModuleCategory, getIndiaCategories, getIndiaModuleBySlug } from "@/lib/india/india-modules";
import { EmptyState as KitEmptyState, LoadingShell, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { CategoryGlyph, GlyphChips } from "@/components/graphics";
import { useFormat } from "@/i18n/client";
import { MixDonut, type MixPart } from "./module-page/ModuleVisuals";
import { formatIndicator } from "./format";
import { INDIA_NS, indiaText } from "./i18n";
import { indiaCategoryGlyph, indiaModuleGlyph } from "./glyphs";
import styles from "./india-tap.module.css";

interface UpdateRow {
  id: string;
  moduleSlug: string;
  moduleTitle: string;
  category: IndiaModuleCategory;
  metricKey: string;
  metricLabel: string;
  numericValue: number | null;
  textValue: string | null;
  unit: string | null;
  asOfDate: string;
  source: string;
  sourceUrl: string;
  notes: string | null;
  fetchedAt: string;
}

/** Topics shown in the ring before the rest are grouped as "other". */
const RING_TOPICS = 5;
/** One clear colour per ring slice (v4 hues: orange, blue, green, violet, pink), grey for "other". */
const RING_COLORS = ["#C2410C", "#2563EB", "#15803D", "#7C3AED", "#BE185D"];
const RING_OTHER = "#A3AEBD";

export default function IndiaUpdateLog({ hueClassName }: { hueClassName: string }) {
  const t = useTranslations("page_india-updates");
  const tp = useTranslations(INDIA_NS);
  const ti = useTranslations("india");
  const tm = useTranslations("page_india-module");
  const x = indiaText(tp, ti);
  const f = useFormat();

  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [allRows, setAllRows] = useState<UpdateRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbPending, setDbPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | IndiaModuleCategory>("all");
  const [open, setOpen] = useState<UpdateRow | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const allCategories = useMemo(() => getIndiaCategories(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = category === "all" ? "/api/india/updates" : `/api/india/updates?category=${category}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 503) {
          setDbPending(true);
          setRows([]);
        } else if (res.ok) {
          const list: UpdateRow[] = Array.isArray(data.updates) ? data.updates : [];
          setDbPending(false);
          setRows(list);
          if (category === "all") setAllRows(list);
        } else {
          setError(t("loadError"));
        }
      } catch {
        if (!cancelled) setError(t("networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, t]);

  // Summary of the unfiltered list: tiles, the sentence and the ring.
  const summary = useMemo(() => {
    if (!allRows || allRows.length === 0) return null;
    const counts = new Map<IndiaModuleCategory, number>();
    for (const r of allRows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const total = allRows.length;
    const newest = allRows.reduce((m, r) => (r.fetchedAt > m ? r.fetchedAt : m), allRows[0].fetchedAt);
    const sources = new Set(allRows.map((r) => r.source)).size;
    let ring: { parts: MixPart[]; top: [IndiaModuleCategory, number] } | null = null;
    if (total >= 2 && sorted.length >= 2) {
      const head = sorted.slice(0, RING_TOPICS);
      const rest = sorted.slice(RING_TOPICS).reduce((s, [, n]) => s + n, 0);
      const parts: MixPart[] = head.map(([c, n], i) => ({
        label: x.category(c),
        pct: (n / total) * 100,
        display: f.number(n),
        color: RING_COLORS[i % RING_COLORS.length],
      }));
      if (rest > 0) {
        parts.push({ label: t("chart.other"), pct: (rest / total) * 100, display: f.number(rest), color: RING_OTHER });
      }
      ring = { parts, top: head[0] };
    }
    return { total, topics: counts.size, newest, sources, top: sorted[0], ring };
  }, [allRows, x, f, t]);

  const metricLabel = (row: UpdateRow): { text: string; lang?: string } => {
    const k = `metric.${row.moduleSlug}.${row.metricKey}`;
    return tm.has(k) ? { text: tm(k) } : { text: row.metricLabel, lang: "en" };
  };
  const moduleTitle = (row: UpdateRow) => {
    const m = getIndiaModuleBySlug(row.moduleSlug);
    return m ? x.moduleTitle(m) : row.moduleTitle;
  };
  const valueOf = (row: UpdateRow) =>
    row.numericValue != null ? formatIndicator(tp, f.locale, row.numericValue, row.unit) : { value: row.textValue ?? "—", unit: "" };

  const sel = open;
  const selLabel = sel ? metricLabel(sel) : null;
  const selValue = sel ? valueOf(sel) : null;

  return (
    <section style={{ paddingBottom: 24 }}>
      {summary ? (
        <div className="india-updates-top">
          <div style={{ minWidth: 0 }}>
            <Explainer>
              {t("explain", {
                total: summary.total,
                ago: f.ago(summary.newest),
                top: x.category(summary.top[0]),
              })}
            </Explainer>
            <StatStrip cols={2}>
              <StatTile emoji="🔢" label={t("tiles.updates")} value={f.number(summary.total)} />
              <StatTile emoji="🗂️" label={t("tiles.topics")} value={f.number(summary.topics)} />
              <StatTile emoji="🕒" label={t("tiles.newest")} value={f.ago(summary.newest)} countUp={false} />
              <StatTile emoji="🏛️" label={t("tiles.sources")} value={f.number(summary.sources)} />
            </StatStrip>
          </div>
          {summary.ring ? (
            <MixDonut
              title={t("chart.title")}
              emoji="🍩"
              units={t("chart.units", { total: summary.total })}
              simple={t("chart.simple", { top: x.category(summary.ring.top[0]), n: f.number(summary.ring.top[1]), total: f.number(summary.total) })}
              parts={summary.ring.parts}
              centerValue={f.number(summary.total)}
              centerLabel={t("chart.center")}
            />
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          margin: "24px 0 16px",
          paddingBottom: 12,
          borderBottom: "1px solid var(--ftp-border)",
        }}
      >
        {/* Topic chips with their drawn glyphs (v5.1: were emoji chips). */}
        <GlyphChips
          label={t("filterAria")}
          value={category}
          onChange={(v) => setCategory(v as "all" | IndiaModuleCategory)}
          items={[
            { value: "all", label: t("all") },
            ...allCategories.map((c) => ({ value: c, label: x.category(c), pick: indiaCategoryGlyph(c) })),
          ]}
        />
      </div>

      {dbPending ? (
        <p
          role="status"
          style={{
            padding: "12px 14px",
            background: "var(--ftp-warn-tint)",
            border: "1px solid color-mix(in srgb, var(--ftp-warn) 30%, #fff)",
            borderRadius: 12,
            fontSize: 14,
            color: "var(--ftp-text)",
            margin: "0 0 18px",
          }}
        >
          {t("pending")}
        </p>
      ) : null}

      {loading ? (
        <LoadingShell rows={4} />
      ) : error ? (
        <p
          role="alert"
          style={{
            padding: "10px 12px",
            border: "1px solid color-mix(in srgb, var(--ftp-danger) 30%, #fff)",
            background: "var(--ftp-danger-tint)",
            borderRadius: 10,
            fontSize: 14,
            color: "var(--ftp-danger)",
            margin: 0,
          }}
        >
          {error}
        </p>
      ) : rows.length === 0 ? (
        <KitEmptyState emoji="⏳" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ftp-text-2)" }}>{t("tapHint")}</p>
          <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "300px" }}>
            {rows.map((row) => {
              const label = metricLabel(row);
              const value = valueOf(row);
              return (
                <li key={row.id} style={{ minWidth: 0 }}>
                  <article className={styles.card}>
                    <button type="button" className={styles.cardButton} onClick={() => setOpen(row)} aria-label={t("details", { metric: label.text })}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                        <CategoryGlyph pick={indiaModuleGlyph(row.moduleSlug, row.category)} size={36} chip />
                        <span style={{ minWidth: 0, fontSize: 13, fontWeight: 650, color: "var(--hue-deep)" }}>{moduleTitle(row)}</span>
                      </span>
                      <span lang={label.lang} style={{ fontSize: 15, lineHeight: "21px", color: "var(--ftp-text)" }}>
                        {label.text}
                      </span>
                      <span className="ftp-bignum" style={{ fontSize: 24, lineHeight: 1.1, color: "var(--ftp-text)" }}>
                        {value.value}
                        {value.unit ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ftp-text-2)", marginInlineStart: 5 }}>{value.unit}</span> : null}
                      </span>
                      <span style={{ display: "flex", gap: "2px 12px", flexWrap: "wrap", fontSize: 13, color: "var(--ftp-text-2)" }}>
                        <span>{t("asOf", { date: f.date(row.asOfDate, { dateStyle: "medium" }) })}</span>
                        <span suppressHydrationWarning>{t("recorded", { ago: f.ago(row.fetchedAt) })}</span>
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{row.source}</span>
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <DetailSheet
        open={sel !== null}
        onClose={close}
        title={selLabel?.text ?? ""}
        titleLang={selLabel?.lang}
        subtitle={sel ? moduleTitle(sel) : undefined}
        media={sel ? <CategoryGlyph pick={indiaModuleGlyph(sel.moduleSlug, sel.category)} size={44} chip /> : undefined}
        hueClassName={hueClassName}
        footer={
          sel ? (
            <>
              {sel.sourceUrl ? (
                <a href={sel.sourceUrl} target="_blank" rel="noopener noreferrer" className={`${styles.sheetAction} ${styles.sheetActionPrimary}`}>
                  {t("openSource")}
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : null}
              {getIndiaModuleBySlug(sel.moduleSlug) ? (
                <Link href={`/${f.locale}/india/${sel.moduleSlug}`} className={styles.sheetAction}>
                  {t("openModule", { module: moduleTitle(sel) })}
                  <ArrowRight size={14} aria-hidden className="india-flip-rtl" />
                </Link>
              ) : null}
            </>
          ) : undefined
        }
      >
        {sel && selValue ? (
          <>
            <div className={styles.sheetFigure}>
              <span className={styles.sheetFigureValue}>{selValue.value}</span>
              {selValue.unit ? <span className={styles.sheetFigureUnit}>{selValue.unit}</span> : null}
            </div>
            <DetailList
              rows={[
                { emoji: "📅", label: t("sheet.asOf"), value: f.date(sel.asOfDate, { dateStyle: "medium" }) },
                { emoji: "🕒", label: t("sheet.recorded"), value: f.date(sel.fetchedAt, { dateStyle: "medium", timeStyle: "short" }) },
                { emoji: "🗂️", label: t("sheet.topic"), value: x.category(sel.category) },
                {
                  emoji: "🏛️",
                  label: t("sourceLink"),
                  value: sel.sourceUrl ? (
                    <a href={sel.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                      {sel.source}
                    </a>
                  ) : (
                    sel.source
                  ),
                },
                { emoji: "📝", label: t("note"), value: sel.notes, lang: "en" },
              ]}
            />
          </>
        ) : null}
      </DetailSheet>

      <style>{`
        .india-updates-top { display: grid; gap: 16px; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; }
        @media (max-width: 1023px) { .india-updates-top { grid-template-columns: minmax(0, 1fr); } }
        [dir="rtl"] .india-flip-rtl { transform: scaleX(-1); }
      `}</style>
    </section>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Public transparency feed: every IndiaIndicator update, newest first,
 * with topic filter chips, a ring showing which topics changed most, and
 * an expandable detail row with the source link.
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

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ExternalLink } from "lucide-react";
import { type IndiaModuleCategory, getIndiaCategories, getIndiaModuleBySlug } from "@/lib/india/india-modules";
import { EmptyState as KitEmptyState, LoadingShell } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";
import { MixDonut, type MixPart } from "./module-page/ModuleVisuals";
import { formatIndicator } from "./format";
import { INDIA_NS, indiaText } from "./i18n";

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

const CATEGORY_EMOJI: Record<IndiaModuleCategory, string> = {
  snapshot: "🇮🇳",
  demographics: "👥",
  economy: "📈",
  budget: "🏛️",
  agriculture: "🌾",
  livestock: "🐄",
  wildlife: "🐅",
  infrastructure: "🛣️",
  energy: "⚡",
  health: "🏥",
  education: "🎓",
  defence: "🛡️",
  justice: "⚖️",
  elections: "🗳️",
  science: "🔬",
  trade: "🌐",
  tourism: "🧳",
  sports: "🏅",
  custom: "📚",
};

/** Topics shown in the ring before the rest are grouped as "other". */
const RING_TOPICS = 5;
/** One clear colour per ring slice (v4 hues: orange, blue, green, violet, pink), grey for "other". */
const RING_COLORS = ["#C2410C", "#2563EB", "#15803D", "#7C3AED", "#BE185D"];
const RING_OTHER = "#A3AEBD";

export default function IndiaUpdateLog() {
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Ring: how the latest updates (the unfiltered list) split by topic.
  const ring = useMemo(() => {
    if (!allRows || allRows.length < 2) return null;
    const counts = new Map<IndiaModuleCategory, number>();
    for (const r of allRows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length < 2) return null;
    const total = allRows.length;
    const head = sorted.slice(0, RING_TOPICS);
    const rest = sorted.slice(RING_TOPICS).reduce((s, [, n]) => s + n, 0);
    const parts: MixPart[] = head.map(([c, n], i) => ({
      label: x.category(c),
      emoji: CATEGORY_EMOJI[c],
      pct: (n / total) * 100,
      display: f.number(n),
      color: RING_COLORS[i % RING_COLORS.length],
    }));
    if (rest > 0) {
      parts.push({ label: t("chart.other"), emoji: "➕", pct: (rest / total) * 100, display: f.number(rest), color: RING_OTHER });
    }
    return { parts, total, top: head[0] };
  }, [allRows, x, f, t]);

  const metricLabel = (row: UpdateRow): { text: string; lang?: string } => {
    const k = `metric.${row.moduleSlug}.${row.metricKey}`;
    return tm.has(k) ? { text: tm(k) } : { text: row.metricLabel, lang: "en" };
  };
  const moduleTitle = (row: UpdateRow) => {
    const m = getIndiaModuleBySlug(row.moduleSlug);
    return m ? x.moduleTitle(m) : row.moduleTitle;
  };

  return (
    <section style={{ maxWidth: 880, margin: "0 auto", padding: "8px 16px 56px" }}>
      {ring ? (
        <div style={{ marginBottom: 20 }}>
          <MixDonut
            title={t("chart.title")}
            emoji="🍩"
            units={t("chart.units", { total: ring.total })}
            simple={t("chart.simple", { top: x.category(ring.top[0]), n: f.number(ring.top[1]), total: f.number(ring.total) })}
            parts={ring.parts}
            centerValue={f.number(ring.total)}
            centerLabel={t("chart.center")}
          />
        </div>
      ) : null}

      <div
        role="group"
        aria-label={t("filterAria")}
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--ftp-border)",
        }}
      >
        <Chip label={t("all")} emoji="🗂️" active={category === "all"} onClick={() => setCategory("all")} />
        {allCategories.map((c) => (
          <Chip key={c} label={x.category(c)} emoji={CATEGORY_EMOJI[c]} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {dbPending ? (
        <p
          role="status"
          style={{
            padding: "12px 14px",
            background: "#FEF8E3",
            border: "1px solid #F3DE9C",
            borderRadius: 12,
            fontSize: 14,
            color: "#713F12",
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
          style={{ padding: "10px 12px", border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 10, fontSize: 14, color: "#B91C1C", margin: 0 }}
        >
          {error}
        </p>
      ) : rows.length === 0 ? (
        <KitEmptyState emoji="⏳" title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border)",
            borderRadius: "var(--ftp-radius-card)",
            boxShadow: "var(--ftp-shadow-1)",
            overflow: "hidden",
          }}
        >
          {rows.map((row, idx) => {
            const label = metricLabel(row);
            const value =
              row.numericValue != null ? formatIndicator(tp, f.locale, row.numericValue, row.unit) : { value: row.textValue ?? "—", unit: "" };
            const open = expanded.has(row.id);
            return (
              <li key={row.id} style={{ borderBottom: idx === rows.length - 1 ? "none" : "1px solid var(--ftp-border)" }}>
                <button
                  type="button"
                  onClick={() => toggleExpand(row.id)}
                  aria-expanded={open}
                  aria-label={t("details", { metric: label.text })}
                  className="ftp-dt-row"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "12px 14px",
                    textAlign: "start",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 60,
                  }}
                >
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                    {CATEGORY_EMOJI[row.category] ?? "📌"}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--hue-deep)" }}>{moduleTitle(row)}</span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span lang={label.lang} style={{ fontSize: 14, color: "var(--ftp-text)" }}>
                        {label.text}
                      </span>
                      <span className="ftp-bignum" style={{ fontSize: 17, color: "var(--ftp-text)" }}>
                        {value.value}
                        {value.unit ? <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ftp-text-2)", marginInlineStart: 4 }}>{value.unit}</span> : null}
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: "2px 12px", flexWrap: "wrap", fontSize: 12, color: "var(--ftp-text-2)", marginTop: 2 }}>
                      <span>{row.source}</span>
                      <span>{t("asOf", { date: f.date(row.asOfDate, { day: "numeric", month: "short", year: "numeric" }) })}</span>
                      <span suppressHydrationWarning>{t("recorded", { ago: f.ago(row.fetchedAt) })}</span>
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    style={{ color: "var(--ftp-text-2)", transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms ease", flexShrink: 0 }}
                  />
                </button>

                {open ? (
                  <div
                    style={{
                      padding: "8px 14px 14px 62px",
                      background: "var(--ftp-surface-2)",
                      fontSize: 13,
                      color: "var(--ftp-text-2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <div>
                      <span style={{ marginInlineEnd: 6 }}>{t("sourceLink")}:</span>
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--hue-deep)", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        {row.sourceUrl}
                        <ExternalLink size={12} aria-hidden />
                      </a>
                    </div>
                    <div>
                      <span style={{ marginInlineEnd: 6 }}>{t("module")}:</span>
                      <code className="india-code">{row.moduleSlug}</code>
                      <span style={{ margin: "0 6px 0 12px" }}>{t("metricKey")}:</span>
                      <code className="india-code">{row.metricKey}</code>
                    </div>
                    {row.notes ? (
                      <div>
                        <span style={{ marginInlineEnd: 6 }}>{t("note")}:</span>
                        <span lang="en" style={{ fontStyle: "italic" }}>
                          {row.notes}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <style>{`
        .india-code { font-family: var(--font-mono, ui-monospace, monospace); background: var(--ftp-surface); border: 1px solid var(--ftp-border); border-radius: 4px; padding: 1px 5px; font-size: 12px; }
      `}</style>
    </section>
  );
}

function Chip({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="ftp-chip"
      style={{
        background: active ? "var(--hue)" : "var(--ftp-surface)",
        color: active ? "#FFFFFF" : "var(--ftp-text-2)",
        border: active ? "1px solid var(--hue)" : "1px solid var(--ftp-border)",
        borderRadius: 999,
        padding: "5px 12px 5px 9px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 14 }}>
        {emoji}
      </span>
      {label}
    </button>
  );
}

/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  What changed and when (Update log) — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "What changed on my district's pages, and when?"
//
//    PageHeader → Explainer (the newest change, in words) → 4 StatTiles →
//    ONE picture (who made the recent changes) → filter chips → the
//    changes GROUPED BY DAY. Inside a day, repeated changes of the same
//    kind to the same page are one line ("News · 3 new news stories ·
//    automatically"), so 288 weather readings are one line, not 288 rows.
//    Tapping a line opens a DetailSheet with every entry behind it (time,
//    the note as it was logged, records) and "Open the page" → Show older
//    changes → Share.
//
//  Data: GET /api/data/update-log (newest first, cursor paging). `filter`
//  narrows it to automatic updates, admin edits or data imports
//  ("scrapers" is only the API's filter key). `?module=<slug>` on this
//  page's URL shows one page's changes (the verification panel links here
//  that way). The notes are shown as they were logged (English), inside the
//  sheet only; every line on the page is built from the log's fields in the
//  reader's language. The person behind an admin edit is never shown.
//  Words: src/dictionaries/<locale>/page_update-log.json.
"use client";

import type React from "react";
import { Suspense, use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ChevronRight, History, X } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  ProgressBar,
  ToolbarButton,
  formatIST,
} from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { PageActions, useClientNow } from "@/components/district/page-kit";
import { getModuleMeta, hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

interface UpdateLogRow {
  id: string;
  source: string;
  actorLabel: string | null;
  action: string;
  moduleName: string | null;
  description: string | null;
  recordCount: number | null;
  tableName: string;
  timestamp: string;
}

interface UpdateLogResponse {
  data: UpdateLogRow[];
  total: number;
  nextCursor: string | null;
}

type FilterTab = "all" | "scrapers" | "admin" | "seeds";

/** Who made the change → message key; `auto` = came in on its own. */
const BY: Record<string, { key: string; auto?: boolean }> = {
  scraper: { key: "byAuto", auto: true },
  cron: { key: "byScheduled", auto: true },
  admin_edit: { key: "byAdmin" },
  api: { key: "byImport" },
  ai_bot: { key: "byAi" },
};

/** Kind of change → message key. */
const ACTIONS: Record<string, string> = { create: "actionCreate", update: "actionUpdate", delete: "actionDelete" };

/** Pages with their own wording for "N new …" (line.<slug>). */
const OWN_WORDS = new Set(["news", "weather", "crops"]);

/** Rows per API call (the API's maximum). */
const PAGE_SIZE = 100;
/** Entries listed in one line's sheet before "and N more". */
const SHEET_ROWS = 25;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** The IST calendar day of a timestamp, as "YYYY-MM-DD". */
function istDay(ts: string | number | Date): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** "Mandya Industrial Hub: ANNOUNCEMENT" → "Mandya Industrial Hub: announcement". */
function tidyNote(note: string): string {
  return note.replace(/:\s*([A-Z][A-Z_]+)\s*$/, (_, tag: string) => `: ${tag.toLowerCase().replace(/_/g, " ")}`);
}

/** One line on the page: every change of one kind to one page on one day. */
interface Line {
  key: string;
  moduleName: string | null;
  action: string;
  source: string;
  records: number;
  newest: string;
  oldest: string;
  rows: UpdateLogRow[];
}

function UpdateLogInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_update-log");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module");
  const moduleFilter = moduleParam && getModuleMeta(moduleParam) ? moduleParam : null;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpenKey(null), []);
  const num = (n: number) => f.number(n);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<UpdateLogResponse>({
    queryKey: ["update-log", district, filter, moduleFilter],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams({ district, filter, limit: String(PAGE_SIZE) });
      if (moduleFilter) qs.set("module", moduleFilter);
      if (pageParam) qs.set("cursor", String(pageParam));
      const res = await fetch(`/api/data/update-log?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const rows = useMemo(() => (data?.pages ?? []).flatMap((p) => p.data), [data]);
  const total = data?.pages[0]?.total ?? 0;
  const autoCount = rows.filter((r) => BY[r.source]?.auto).length;
  const adminCount = rows.filter((r) => r.source === "admin_edit").length;
  const newest = rows[0] ?? null;

  const pageName = (slug: string | null) => (slug ? (getModuleMeta(slug) ? mt.label(slug) : slug) : t("otherData"));
  const byLabel = (source: string) => (BY[source] ? t(BY[source].key) : source);
  const byHow = (source: string) => (BY[source] ? t(`how.${BY[source].key}`) : source);
  /** "3 new news stories" / "1 entry changed" — built from the log's fields. */
  const lineWords = (moduleName: string | null, action: string, n: number) =>
    action === "create" && moduleName && OWN_WORDS.has(moduleName)
      ? t(`line.${moduleName}`, { n })
      : t(`line.${ACTIONS[action] ? action : "update"}`, { n });

  // Group by IST day (rows arrive newest first), then fold each day's
  // changes of one kind to one page into one line (newest line first).
  const days = useMemo(() => {
    const out: Array<{ day: string; sample: string; count: number; lines: Line[] }> = [];
    for (const r of rows) {
      const day = istDay(r.timestamp);
      let g = out[out.length - 1];
      if (!g || g.day !== day) {
        g = { day, sample: r.timestamp, count: 0, lines: [] };
        out.push(g);
      }
      g.count += 1;
      const key = `${day}|${r.moduleName ?? ""}|${r.action}|${r.source}`;
      let line = g.lines.find((l) => l.key === key);
      if (!line) {
        line = { key, moduleName: r.moduleName, action: r.action, source: r.source, records: 0, newest: r.timestamp, oldest: r.timestamp, rows: [] };
        g.lines.push(line);
      }
      line.records += r.recordCount && r.recordCount > 0 ? r.recordCount : 1;
      line.oldest = r.timestamp;
      line.rows.push(r);
    }
    return out;
  }, [rows]);

  // "Today" / "Yesterday" only once the page knows the time (after hydration).
  const now = useClientNow();
  const today = now ? istDay(now) : "";
  const yesterday = now ? istDay(now - 86_400_000) : "";
  const dayLabel = (day: string, sample: string) => {
    const full = f.date(sample, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return day === today ? t("todayOn", { date: full }) : day === yesterday ? t("yesterdayOn", { date: full }) : full;
  };
  const hhmm = (ts: string) => f.time(ts, { hour: "2-digit", minute: "2-digit", hour12: false });

  // The changes on screen, counted by who made them (most first).
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
  const bySplit = [...bySource.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: t("tabAll") },
    { id: "scrapers", label: t("tabAuto") },
    { id: "admin", label: t("tabAdmin") },
    { id: "seeds", label: t("tabImports") },
  ];

  const open = openKey ? days.flatMap((d) => d.lines).find((l) => l.key === openKey) ?? null : null;
  const openSlug = open?.moduleName && getModuleMeta(open.moduleName) ? open.moduleName : null;

  return (
    <ModulePage>
      <PageHeader
        icon={History}
        title={mt.label("update-log")}
        description={mt.description("update-log")}
        backHref={base}
        freshness={newest ? { asOf: newest.timestamp } : undefined}
      />

      {!isLoading && !error && newest && (
        <Explainer>
          <span suppressHydrationWarning>
            {t.rich("explainNewestLine", {
              ago: f.ago(newest.timestamp),
              what: lineWords(newest.moduleName, newest.action, newest.recordCount && newest.recordCount > 0 ? newest.recordCount : 1),
              page: pageName(newest.moduleName),
              district: districtName,
              b: bold,
            })}
          </span>
          {filter === "all" && rows.length > 1 && (
            <>
              {" "}
              {autoCount < rows.length
                ? t.rich("explainSome", { shown: rows.length, auto: num(autoCount), b: bold })
                : t.rich("explainAll", { shown: rows.length, b: bold })}
            </>
          )}
        </Explainer>
      )}

      <StatStrip>
        <StatTile label={t("tileTotal")} value={num(total)} sub={t("tileTotalSub", { district: districtName })} />
        {newest && (
          <StatTile label={t("tileNewest")} value={f.ago(newest.timestamp)} sub={formatIST(newest.timestamp, f.intl) ?? undefined} countUp={false} />
        )}
        <StatTile label={t("tileAuto")} value={num(autoCount)} sub={t("amongShown", { shown: rows.length })} />
        <StatTile label={t("tileAdmin")} value={num(adminCount)} sub={t("amongShown", { shown: rows.length })} />
      </StatStrip>

      {/* ONE picture: who made the recent changes. */}
      {!isLoading && !error && filter === "all" && bySplit.length > 0 && (
        <Card padding={18} style={{ marginTop: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>{t("pictureTitle")}</h2>
          <p className="ftp-label" style={{ marginBottom: 10 }}>
            {t("bySplit", { shown: rows.length })}
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
            {bySplit.map(({ source, count }) => (
              <li key={source}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, lineHeight: "20px", marginBottom: 4 }}>
                  <span>{byLabel(source)}</span>
                  <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                    {num(count)}
                  </strong>
                </div>
                <ProgressBar pct={(count / rows.length) * 100} height={8} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Section title={t("changesTitle")}>
        {moduleFilter && (
          <p style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "0 0 12px", fontSize: 14, lineHeight: "20px" }}>
            {t.rich("onlyPage", { page: pageName(moduleFilter), b: bold })}
            <Link
              href={`${base}/update-log`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44, color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}
            >
              <X size={14} aria-hidden />
              {t("showAllPages")}
            </Link>
          </p>
        )}
        <div style={{ marginBottom: 14 }}>
          <Chips label={t("filterLabel")} items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))} value={filter} onChange={(v) => setFilter(v as FilterTab)} />
        </div>

        {isLoading && <LoadingShell rows={5} />}
        {error && <ErrorBlock />}
        {!isLoading && !error && rows.length === 0 && <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />}

        {!isLoading && !error && days.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {days.map((g) => (
              <section key={g.day} aria-label={dayLabel(g.day, g.sample)}>
                <h3
                  style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", margin: "0 0 8px", fontSize: 16, lineHeight: 1.35, fontWeight: 650 }}
                  suppressHydrationWarning
                >
                  {dayLabel(g.day, g.sample)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ftp-text-2)" }}>{t("changesCount", { n: g.count, count: num(g.count) })}</span>
                </h3>
                <Card padding={0}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {g.lines.map((l, i) => (
                      <li key={l.key} className={hueClass(l.moduleName && getModuleMeta(l.moduleName) ? l.moduleName : "update-log")}>
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          onClick={() => setOpenKey(l.key)}
                          className="ftp-card-link"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            minHeight: 56,
                            padding: "10px 16px",
                            border: 0,
                            borderTop: i === 0 ? 0 : "1px solid var(--ftp-border)",
                            borderRadius: 0,
                            background: "transparent",
                            font: "inherit",
                            color: "var(--ftp-text)",
                            textAlign: "start",
                            cursor: "pointer",
                          }}
                        >
                          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: "var(--hue)", flexShrink: 0 }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 15, lineHeight: "21px", fontWeight: 600 }}>{pageName(l.moduleName)}</span>
                            <span style={{ display: "block", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
                              {t("lineSummary", { what: lineWords(l.moduleName, l.action, l.records), how: byHow(l.source) })}
                            </span>
                          </span>
                          <span className="ftp-num" suppressHydrationWarning style={{ fontSize: 13, color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
                            {l.rows.length > 1 && hhmm(l.oldest) !== hhmm(l.newest) ? t("timeRange", { from: hhmm(l.oldest), to: hhmm(l.newest) }) : hhmm(l.newest)}
                          </span>
                          <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ))}
          </div>
        )}

        {!isLoading && hasNextPage && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <ToolbarButton onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? t("loading") : t("loadMore")}
            </ToolbarButton>
          </div>
        )}
      </Section>

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="update-log" compare={false} />
      </div>

      {/* Everything behind one line. */}
      <DetailSheet
        open={open !== null}
        onClose={closeSheet}
        title={open ? pageName(open.moduleName) : ""}
        subtitle={open ? t("lineSummary", { what: lineWords(open.moduleName, open.action, open.records), how: byHow(open.source) }) : undefined}
        hueClassName={openSlug ? hueClass(openSlug) : hueClass("update-log")}
        footer={
          openSlug ? (
            <Link
              href={`${base}/${openSlug}`}
              className="ftp-btn ftp-btn-primary"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, padding: "0 16px", borderRadius: 12, color: "#fff", textDecoration: "none", fontWeight: 600 }}
            >
              {t("openPage", { page: pageName(openSlug) })}
              <ChevronRight size={16} aria-hidden />
            </Link>
          ) : null
        }
      >
        {open && (
          <>
            <DetailList
              rows={[
                {
                  label: t("rowWhen"),
                  value: (
                    <span suppressHydrationWarning>
                      {open.rows.length > 1
                        ? `${formatIST(open.oldest, f.intl) ?? ""} – ${formatIST(open.newest, f.intl) ?? ""}`
                        : `${formatIST(open.newest, f.intl) ?? ""} · ${f.ago(open.newest)}`}
                    </span>
                  ),
                },
                { label: t("rowChange"), value: t(ACTIONS[open.action] ?? "actionUpdate") },
                { label: t("rowBy"), value: byLabel(open.source) },
                { label: t("rowEntries"), value: num(open.rows.length) },
                { label: t("rowTable"), value: open.rows[0]?.tableName, lang: "en" },
              ]}
            />
            <h3 style={{ margin: "18px 0 8px", fontSize: 14, lineHeight: "20px", fontWeight: 650 }}>{t("entriesTitle")}</h3>
            <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("entriesNote")}</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {open.rows.slice(0, SHEET_ROWS).map((r) => (
                <li key={r.id} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: "19px" }}>
                  <span className="ftp-num" suppressHydrationWarning style={{ color: "var(--ftp-text-2)", minWidth: 44 }}>
                    {hhmm(r.timestamp)}
                  </span>
                  <span lang={r.description ? "en" : undefined} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    {r.description ? tidyNote(r.description) : lineWords(r.moduleName, r.action, r.recordCount && r.recordCount > 0 ? r.recordCount : 1)}
                  </span>
                </li>
              ))}
            </ul>
            {open.rows.length > SHEET_ROWS && (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ftp-text-2)" }}>{t("andMore", { n: open.rows.length - SHEET_ROWS })}</p>
            )}
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function UpdateLogPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("update-log")}>
      <Suspense fallback={<LoadingShell rows={5} />}>
        <UpdateLogInner params={params} />
      </Suspense>
    </ModuleErrorBoundary>
  );
}

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
//    PageHeader → Explainer (the newest change and how many of the latest
//    changes came in automatically) → 4 StatTiles → ONE picture: 10 robots,
//    lit for the share of recent changes that were automatic, beside the
//    newest change → filter chips → the changes GROUPED BY DAY as cards;
//    tapping one opens a DetailSheet (when, page, kind of change, made by,
//    records, what changed; Open the page) → "which data changed most" →
//    Load more → sources.
//
//  Data: GET /api/data/update-log (newest first; `filter` narrows it to
//  automatic updates, admin edits or data imports — "scrapers" is only the
//  API's filter key; citizens see "Automatic updates"). Change descriptions
//  are shown as they were logged (English). The person behind an admin
//  edit is never shown. Words: src/dictionaries/<locale>/page_update-log.json.
"use client";

import type React from "react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
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
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { RankBars } from "@/components/accountability/AccountabilityVisuals";
import { AccountabilityFooter, CardChip, CardList, SheetAction, TapCard } from "@/components/accountability/AccountabilityKit";
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

/** Who made the change → message key + emoji. */
const BY: Record<string, { key: string; emoji: string; auto?: boolean }> = {
  scraper: { key: "byAuto", emoji: "🤖", auto: true },
  cron: { key: "byScheduled", emoji: "⏰", auto: true },
  admin_edit: { key: "byAdmin", emoji: "🧑‍💼" },
  api: { key: "byImport", emoji: "📥" },
  ai_bot: { key: "byAi", emoji: "✨" },
};

/** Kind of change → message key + emoji + tone. */
const ACTIONS: Record<string, { key: string; emoji: string; tone: "live" | "warn" | "danger" }> = {
  create: { key: "actionCreate", emoji: "➕", tone: "live" },
  update: { key: "actionUpdate", emoji: "✏️", tone: "warn" },
  delete: { key: "actionDelete", emoji: "➖", tone: "danger" },
};

/** Top modules in "which data changed most". */
const MAX_MODULE_BARS = 5;
const PAGE_STEP = 30;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** The IST calendar day of a timestamp, as "YYYY-MM-DD". */
function istDay(ts: string | number | Date): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Today's and yesterday's IST day keys. */
function recentDays(): { today: string; yesterday: string } {
  const now = Date.now();
  return { today: istDay(now), yesterday: istDay(now - 86_400_000) };
}

function UpdateLogInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_update-log");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [openId, setOpenId] = useState<string | null>(null);
  const num = (n: number) => f.number(n);

  const { data, isLoading, error } = useQuery<UpdateLogResponse>({
    queryKey: ["update-log", district, filter, pageSize],
    queryFn: async () => {
      const qs = new URLSearchParams({ district, filter, limit: String(pageSize) });
      const res = await fetch(`/api/data/update-log?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const autoCount = rows.filter((r) => BY[r.source]?.auto).length;
  const adminCount = rows.filter((r) => r.source === "admin_edit").length;
  const newest = rows[0] ?? null;

  const pageName = (slug: string | null) => (slug ? (getModuleMeta(slug) ? mt.label(slug) : slug) : t("otherData"));
  const actionLabel = (action: string) => (ACTIONS[action] ? t(ACTIONS[action].key) : action);
  const byLabel = (source: string) => (BY[source] ? t(BY[source].key) : source);
  const whatChanged = (r: UpdateLogRow) => r.description ?? t("actionOn", { action: actionLabel(r.action), table: r.tableName });

  // Group the loaded changes by IST day, newest day first (rows arrive newest first).
  const { today, yesterday } = recentDays();
  const groups: Array<{ day: string; rows: UpdateLogRow[] }> = [];
  for (const r of rows) {
    const day = istDay(r.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(r);
    else groups.push({ day, rows: [r] });
  }
  const dayLabel = (day: string, sample: string) =>
    day === today
      ? t("today")
      : day === yesterday
        ? t("yesterday")
        : f.date(sample, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // The changes on screen, counted by who made them (most first).
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
  const bySplit = [...bySource.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  // Which data changed most among the rows on screen.
  const moduleCounts = new Map<string, number>();
  for (const r of rows) if (r.moduleName) moduleCounts.set(r.moduleName, (moduleCounts.get(r.moduleName) ?? 0) + 1);
  const topModules = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_MODULE_BARS);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: t("tabAll") },
    { id: "scrapers", label: t("tabAuto") },
    { id: "admin", label: t("tabAdmin") },
    { id: "seeds", label: t("tabImports") },
  ];

  const open = openId ? rows.find((r) => r.id === openId) ?? null : null;
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
        <Explainer emoji="🕒">
          <span suppressHydrationWarning>
            {t.rich("explainNewest", { ago: f.ago(newest.timestamp), page: pageName(newest.moduleName), district: districtName, b: bold })}
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
        <StatTile emoji="🧮" label={t("tileTotal")} value={num(total)} sub={t("tileTotalSub", { district: districtName })} />
        {newest && (
          <StatTile
            emoji="🕒"
            label={t("tileNewest")}
            value={f.ago(newest.timestamp)}
            sub={formatIST(newest.timestamp, f.intl) ?? undefined}
            countUp={false}
          />
        )}
        <StatTile emoji="🤖" label={t("tileAuto")} value={num(autoCount)} sub={t("amongShown", { shown: rows.length })} />
        <StatTile emoji="🧑‍💼" label={t("tileAdmin")} value={num(adminCount)} sub={t("amongShown", { shown: rows.length })} />
      </StatStrip>

      {/* ONE picture: how much of the recent change came in on its own. */}
      {!isLoading && !error && filter === "all" && rows.length > 0 && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <h2 className="ftp-display" style={{ margin: "0 0 12px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
              {t("pictureTitle")}
            </h2>
            <Pictogram
              filled={(autoCount / rows.length) * 10}
              emoji="🤖"
              label={t("pictoLabel", { n: num(Math.round((autoCount / rows.length) * 10)) })}
            />
          </Card>
          {/* The same changes, counted by who made them. */}
          <Card padding={18}>
            <p className="ftp-label" style={{ marginBottom: 10 }}>
              {t("bySplit", { shown: rows.length })}
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {bySplit.map(({ source, count }) => (
                <li key={source}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, lineHeight: "20px", marginBottom: 4 }}>
                    <span>
                      <span className="ftp-emoji" aria-hidden>
                        {BY[source]?.emoji ?? "🙋"}{" "}
                      </span>
                      {byLabel(source)}
                    </span>
                    <strong className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                      {num(count)}
                    </strong>
                  </div>
                  <ProgressBar pct={(count / rows.length) * 100} height={8} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <Section title={t("changesTitle")} emoji="🗒️">
        <div style={{ marginBottom: 14 }}>
          <Chips
            label={t("filterLabel")}
            items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={filter}
            onChange={(v) => {
              setFilter(v as FilterTab);
              setPageSize(PAGE_STEP);
            }}
          />
        </div>

        {isLoading && <LoadingShell rows={5} />}
        {error && <ErrorBlock />}
        {!isLoading && !error && rows.length === 0 && <EmptyState emoji="🕒" title={t("emptyTitle")} body={t("emptyBody")} />}

        {!isLoading && !error && groups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {groups.map((g) => (
              <section key={g.day} aria-label={dayLabel(g.day, g.rows[0].timestamp)}>
                <h3
                  className="ftp-display"
                  style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "0 0 10px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}
                  suppressHydrationWarning
                >
                  <span className="ftp-emoji" aria-hidden>
                    📅
                  </span>
                  {dayLabel(g.day, g.rows[0].timestamp)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ftp-text-2)" }}>
                    {t("changesCount", { n: g.rows.length, count: num(g.rows.length) })}
                  </span>
                </h3>
                <CardList min={250} label={dayLabel(g.day, g.rows[0].timestamp)}>
                  {g.rows.map((r) => {
                    const meta = r.moduleName ? getModuleMeta(r.moduleName) : null;
                    const act = ACTIONS[r.action];
                    return (
                      <TapCard
                        key={r.id}
                        emoji={meta?.emoji ?? "🗂️"}
                        title={pageName(r.moduleName)}
                        sub={
                          <span
                            lang={r.description ? "en" : undefined}
                            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                          >
                            {whatChanged(r)}
                          </span>
                        }
                        hueClassName={meta ? hueClass(r.moduleName) : undefined}
                        onOpen={() => setOpenId(r.id)}
                      >
                        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <CardChip emoji="🕒">
                            <span className="ftp-num">{f.time(r.timestamp, { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                          </CardChip>
                          <CardChip emoji={act?.emoji} tone={act?.tone}>
                            {actionLabel(r.action)}
                          </CardChip>
                          <CardChip emoji={BY[r.source]?.emoji}>{byLabel(r.source)}</CardChip>
                        </span>
                      </TapCard>
                    );
                  })}
                </CardList>
              </section>
            ))}
          </div>
        )}

        {!isLoading && rows.length >= pageSize && rows.length < total && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <ToolbarButton onClick={() => setPageSize((n) => n + PAGE_STEP)}>{t("loadMore")}</ToolbarButton>
          </div>
        )}
      </Section>

      {/* Which data changed most — the pages behind the changes on screen. */}
      {!isLoading && !error && topModules.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("modulesTitle")}
            emoji="🗂️"
            units={t("modulesUnits", { shown: num(rows.length) })}
            simple={t.rich("modulesSimple", { module: pageName(topModules[0][0]), n: topModules[0][1], shown: num(rows.length), b: bold })}
            asOf={newest?.timestamp}
            table={topModules.map(([slug, n]) => ({ label: pageName(slug), value: num(n) }))}
          >
            <RankBars
              ariaLabel={t("modulesAria")}
              items={topModules.map(([slug, n]) => ({
                key: slug,
                label: pageName(slug),
                value: n,
                display: t("changesCount", { n, count: num(n) }),
                emoji: getModuleMeta(slug)?.emoji ?? "🗂️",
                hueClassName: getModuleMeta(slug) ? hueClass(slug) : undefined,
              }))}
            />
          </ChartCard>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <AccountabilityFooter moduleSlug="update-log" locale={locale} state={state} district={district} showCompare={false} />
      </div>

      {/* Everything about one change. */}
      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        title={open ? pageName(open.moduleName) : ""}
        subtitle={open ? <span suppressHydrationWarning>{formatIST(open.timestamp, f.intl)}</span> : undefined}
        emoji={open?.moduleName ? getModuleMeta(open.moduleName)?.emoji ?? "🗂️" : "🗂️"}
        hueClassName={openSlug ? hueClass(openSlug) : hueClass("update-log")}
        footer={
          openSlug ? (
            <SheetAction href={`${base}/${openSlug}`} emoji={getModuleMeta(openSlug)?.emoji ?? "📄"}>
              {t("openPage", { page: pageName(openSlug) })}
            </SheetAction>
          ) : null
        }
      >
        {open && (
          <DetailList
            rows={[
              { emoji: "📝", label: t("rowWhat"), value: whatChanged(open), lang: open.description ? "en" : undefined },
              {
                emoji: "🕒",
                label: t("rowWhen"),
                value: <span suppressHydrationWarning>{`${formatIST(open.timestamp, f.intl) ?? ""} · ${f.ago(open.timestamp)}`}</span>,
              },
              { emoji: ACTIONS[open.action]?.emoji ?? "✏️", label: t("rowChange"), value: actionLabel(open.action) },
              { emoji: BY[open.source]?.emoji ?? "🙋", label: t("rowBy"), value: byLabel(open.source) },
              { emoji: "🔢", label: t("rowRecords"), value: open.recordCount != null && open.recordCount > 1 ? num(open.recordCount) : null },
              { emoji: "🗃️", label: t("rowTable"), value: open.tableName, lang: "en" },
            ]}
          />
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function UpdateLogPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("update-log")}>
      <UpdateLogInner params={params} />
    </ModuleErrorBoundary>
  );
}

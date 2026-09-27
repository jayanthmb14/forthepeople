/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Update Log page — Design v4 "Rang" module recipe (see the finance page).
// Every data change for this district, newest first, as a DataTable with
// tabular timestamps (exact IST time + "x ago"). Filter chips narrow it to
// automatic updates, admin edits or data imports. Data: GET /api/data/update-log.
//   PageHeader → StatStrip of emoji tiles → picture (how many recent changes
//   were automatic, and when the newest one happened) → "which data changed
//   most" bars → changes table → sources.
// Every word on the page comes from src/dictionaries/<locale>/page_update-log.json;
// change descriptions are shown as they were logged.

"use client";
import type React from "react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  Chips,
  DataTable,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  ToolbarButton,
  formatIST,
  type Tone,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { RankBars } from "@/components/accountability/AccountabilityVisuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getModuleMeta, hueClass } from "@/lib/design/hues";
import { useFormat, useModuleText } from "@/i18n/client";

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

// "scrapers" is the API's filter key (see src/app/api/data/update-log);
// citizens only ever see the translated label ("Automatic updates").
type FilterTab = "all" | "scrapers" | "admin" | "seeds";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Who made the change → message key + pill tone. */
const SOURCE_LABELS: Record<string, { key: string; tone: Tone }> = {
  scraper: { key: "byAuto", tone: "brand" },
  cron: { key: "byScheduled", tone: "brand" },
  admin_edit: { key: "byAdmin", tone: "warn" },
  api: { key: "byImport", tone: "neutral" },
  ai_bot: { key: "byAi", tone: "features" },
};

/** What kind of change → message key + pill tone (semantic colour as text on a tint). */
const ACTIONS: Record<string, { key: string; tone: Tone }> = {
  create: { key: "actionCreate", tone: "live" },
  update: { key: "actionUpdate", tone: "warn" },
  delete: { key: "actionDelete", tone: "danger" },
};

/** Top modules in the "which data changed most" picture. */
const MAX_MODULE_BARS = 5;

/** "brand" pills on this page use the page hue instead of the brand blue. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** "create" → "Create" (labels are sentence case, never all capitals). */
function sentenceCase(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;
}

/** "5 minutes ago" in the reader's language (Intl.RelativeTimeFormat). */
function relativeTime(ts: string, intl: string): string {
  const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
  const s = Math.round((new Date(ts).getTime() - Date.now()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(s, "second");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), "month");
  return rtf.format(Math.round(s / (86400 * 365)), "year");
}

function UpdateLogInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_update-log");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [pageSize, setPageSize] = useState(20);
  const num = (n: number) => f.number(n);

  const { data, isLoading, error } = useQuery<UpdateLogResponse>({
    queryKey: ["update-log", district, filter, pageSize],
    queryFn: async () => {
      const qs = new URLSearchParams({
        district,
        filter,
        limit: String(pageSize),
      });
      const res = await fetch(`/api/data/update-log?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const autoCount = rows.filter((r) => r.source === "scraper" || r.source === "cron").length;
  const adminCount = rows.filter((r) => r.source === "admin_edit").length;
  // Newest change on screen — drives the header's freshness pill.
  const newest = rows.reduce<string | null>(
    (latest, r) => (!latest || new Date(r.timestamp) > new Date(latest) ? r.timestamp : latest),
    null,
  );

  const actionLabel = (action: string) => (ACTIONS[action] ? t(ACTIONS[action].key) : sentenceCase(action));

  // Which data changed most among the rows on screen: each change belongs
  // to at most one module, so the counts are honest shares of what is shown.
  const moduleCounts = new Map<string, number>();
  for (const r of rows) if (r.moduleName) moduleCounts.set(r.moduleName, (moduleCounts.get(r.moduleName) ?? 0) + 1);
  const topModules = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_MODULE_BARS);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: t("tabAll") },
    { id: "scrapers", label: t("tabAuto") },
    { id: "admin", label: t("tabAdmin") },
    { id: "seeds", label: t("tabImports") },
  ];

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Clock}
        title={mt.label("update-log")}
        description={mt.description("update-log")}
        backHref={base}
        accent={getModuleAccent("update-log")}
        freshness={newest ? { asOf: newest } : undefined}
      />

      {/* Stats — counts of what is loaded; "Total" comes from the server. */}
      <StatStrip cols={4}>
        <StatTile emoji="🧮" label={t("tileTotal")} value={num(total)} asOf={newest} />
        <StatTile emoji="👀" label={t("tileShown")} value={num(rows.length)} sub={t("tileShownSub")} />
        <StatTile emoji="🤖" label={t("tileAuto")} value={num(autoCount)} sub={t("amongShown")} />
        <StatTile emoji="🧑‍💼" label={t("tileAdmin")} value={num(adminCount)} sub={t("amongShown")} />
      </StatStrip>

      {/* The picture: of the changes on screen, how many came in on their
          own (automatic feeds) — lit robots; beside it, when the newest
          change happened. Only on the unfiltered view, where the share
          means something. Same numbers as the tiles above. */}
      {!isLoading && !error && filter === "all" && rows.length > 0 && newest && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="🤖">
              {autoCount < rows.length
                ? t.rich("explainSome", { shown: num(rows.length), auto: num(autoCount), b: (c) => <strong>{c}</strong> })
                : t.rich("explainAll", { shown: num(rows.length), b: (c) => <strong>{c}</strong> })}
            </Explainer>
            <Pictogram
              filled={(autoCount / rows.length) * 10}
              emoji="🤖"
              label={t("pictoLabel", { n: num(Math.round((autoCount / rows.length) * 10)) })}
            />
          </Card>
          <Card
            tinted
            padding={18}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}
          >
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 44 }}>
              🕒
            </span>
            <p className="ftp-label">{t("newestChange")}</p>
            <div className="ftp-bignum" style={{ fontSize: 30, lineHeight: 1.1, color: "var(--hue-deep)" }} suppressHydrationWarning>
              {relativeTime(newest, f.intl)}
            </div>
            <p className="ftp-body ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }} suppressHydrationWarning>
              {formatIST(newest, f.intl)}
            </p>
          </Card>
        </div>
      )}

      {/* Which data changed most — the modules behind the changes on screen. */}
      {!isLoading && !error && topModules.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("modulesTitle")}
            emoji="🗂️"
            units={t("modulesUnits", { shown: num(rows.length) })}
            simple={t.rich("modulesSimple", {
              module: mt.label(topModules[0][0]),
              n: topModules[0][1],
              shown: num(rows.length),
              b: (c) => <strong>{c}</strong>,
            })}
            asOf={newest}
            table={topModules.map(([slug, n]) => ({ label: mt.label(slug), value: num(n) }))}
          >
            <RankBars
              ariaLabel={t("modulesAria")}
              items={topModules.map(([slug, n]) => ({
                key: slug,
                label: mt.label(slug),
                value: n,
                display: t("changesCount", { n, count: num(n) }),
                emoji: getModuleMeta(slug)?.emoji ?? "🗂️",
                // Each bar in its module's own colour, as in the sidebar.
                hueClassName: getModuleMeta(slug) ? hueClass(slug) : undefined,
              }))}
            />
          </ChartCard>
        </div>
      )}

      <Section title={t("changesTitle")} emoji="🗒️">
        {/* Filter chips (32 px, 44 px on phones) */}
        <div style={{ marginBottom: 12 }}>
          <Chips
            label={t("filterLabel")}
            items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={filter}
            onChange={(v) => setFilter(v as FilterTab)}
          />
        </div>

        {isLoading && <LoadingShell rows={5} />}
        {error && <ErrorBlock />}

        {!isLoading && !error && rows.length === 0 && <EmptyState emoji="🕒" title={t("emptyTitle")} body={t("emptyBody")} />}

        {!isLoading && rows.length > 0 && (
          <DataTable
            caption={t("tableCaption")}
            columns={[
              { key: "when", label: t("colWhen"), mono: true, align: "left", width: 150 },
              { key: "module", label: t("colModule") },
              { key: "change", label: t("colChange") },
              { key: "by", label: t("colBy") },
              { key: "records", label: t("colRecords"), numeric: true },
              { key: "what", label: t("colWhat") },
            ]}
            rows={rows.map((r) => {
              const src = SOURCE_LABELS[r.source];
              const tone: Tone = src?.tone ?? "neutral";
              const exact = formatIST(r.timestamp, f.intl);
              return {
                when: (
                  <span title={exact ?? undefined} style={{ display: "flex", flexDirection: "column" }}>
                    <span suppressHydrationWarning>{exact ?? "—"}</span>
                    <span suppressHydrationWarning style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>
                      {relativeTime(r.timestamp, f.intl)}
                    </span>
                  </span>
                ),
                // The module's name in that module's own hue.
                module: r.moduleName ? (
                  <span className={getModuleMeta(r.moduleName) ? hueClass(r.moduleName) : undefined}>
                    <Pill style={HUE_PILL}>{mt.label(r.moduleName)}</Pill>
                  </span>
                ) : (
                  "—"
                ),
                change: <Pill tone={ACTIONS[r.action]?.tone ?? "neutral"}>{actionLabel(r.action)}</Pill>,
                by: (
                  <Pill tone={tone} style={tone === "brand" ? HUE_PILL : undefined}>
                    {src ? t(src.key) : r.source}
                  </Pill>
                ),
                records: r.recordCount != null && r.recordCount > 1 ? num(r.recordCount) : "—",
                what: r.description ?? t("actionOn", { action: actionLabel(r.action), table: r.tableName }),
              };
            })}
          />
        )}

        {/* Load more */}
        {rows.length >= pageSize && rows.length < total && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <ToolbarButton onClick={() => setPageSize((n) => n + 20)}>{t("loadMore")}</ToolbarButton>
          </div>
        )}
      </Section>

      <ModulePageFooter moduleSlug="update-log" locale={locale} state={state} district={district} showCompare={false} />
    </div>
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

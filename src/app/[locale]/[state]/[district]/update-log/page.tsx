/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Update Log page — Design v4 "Rang" module recipe (see the finance page).
// Every data change for this district, newest first, as a DataTable with
// tabular timestamps (exact IST time + "x ago"). Filter chips narrow it to
// automatic updates, admin edits or seeds. Data: GET /api/data/update-log.
//   PageHeader → StatStrip of emoji tiles → picture (how many recent changes
//   were automatic, and when the newest one happened) → changes table →
//   sources.

"use client";
import type React from "react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Explainer, Pictogram } from "@/components/district/visuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

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
// citizens only ever see the label "Auto-updates".
type FilterTab = "all" | "scrapers" | "admin" | "seeds";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Who made the change → citizen-facing label + pill tone. */
const SOURCE_LABELS: Record<string, { label: string; tone: Tone }> = {
  scraper:    { label: "Auto-update", tone: "brand" },
  cron:       { label: "Cron",        tone: "brand" },
  admin_edit: { label: "Admin",       tone: "warn" },
  api:        { label: "API or seed", tone: "neutral" },
  ai_bot:     { label: "AI bot",      tone: "features" },
};

/** "brand" pills on this page use the page hue instead of the brand blue. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** "create" → "Create" (labels are sentence case, never all capitals). */
function sentenceCase(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;
}

/** What kind of change → pill tone (semantic colour as text on a tint). */
const ACTION_TONE: Record<string, Tone> = {
  create: "live",
  update: "warn",
  delete: "danger",
};

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function UpdateLogInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [pageSize, setPageSize] = useState(20);

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
  const scraperCount = rows.filter((r) => r.source === "scraper" || r.source === "cron").length;
  const adminCount = rows.filter((r) => r.source === "admin_edit").length;
  // Newest change on screen — drives the header's freshness pill.
  const newest = rows.reduce<string | null>(
    (latest, r) => (!latest || new Date(r.timestamp) > new Date(latest) ? r.timestamp : latest),
    null,
  );

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "scrapers", label: "Auto-updates" },
    { id: "admin", label: "Admin" },
    { id: "seeds", label: "Seeds" },
  ];

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Clock}
        title="Update Log"
        description="All data changes and updates for this district — full transparency"
        backHref={base}
        accent={getModuleAccent("update-log")}
        freshness={newest ? { asOf: newest } : undefined}
      />

      {/* Stats — counts of what is loaded; "Total" comes from the server. */}
      <StatStrip cols={4}>
        <StatTile emoji="🧮" label="Total updates" value={total.toLocaleString("en-IN")} asOf={newest} />
        <StatTile emoji="👀" label="Shown" value={rows.length.toLocaleString("en-IN")} sub="Loaded on this page" />
        <StatTile emoji="🤖" label="Auto-updates" value={scraperCount} sub="Among those shown" />
        <StatTile emoji="🧑‍💼" label="Admin" value={adminCount} sub="Among those shown" />
      </StatStrip>

      {/* The picture: of the changes on screen, how many came in on their
          own (automatic feeds) — lit robots; beside it, when the newest
          change happened. Only on the unfiltered view, where the share
          means something. Same numbers as the tiles above. */}
      {!isLoading && !error && filter === "all" && rows.length > 0 && newest && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="🤖">
              Of the <strong>{rows.length.toLocaleString("en-IN")}</strong> latest changes shown here,{" "}
              <strong>{scraperCount.toLocaleString("en-IN")}</strong> were automatic updates from our data feeds.
              {scraperCount < rows.length && " The rest were admin edits, data imports or AI updates."}
            </Explainer>
            <Pictogram
              filled={(scraperCount / rows.length) * 10}
              emoji="🤖"
              label={`About ${Math.round((scraperCount / rows.length) * 10)} of every 10 recent changes were automatic.`}
            />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 44 }}>🕒</span>
            <p className="ftp-label">Newest change</p>
            <div className="ftp-bignum" style={{ fontSize: 30, lineHeight: 1.1, color: "var(--hue-deep)" }} suppressHydrationWarning>
              {relativeTime(newest)}
            </div>
            <p className="ftp-body ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400 }} suppressHydrationWarning>
              {formatIST(newest)}
            </p>
          </Card>
        </div>
      )}

      <Section title="Changes" emoji="🗒️">
        {/* Filter chips (32 px, 44 px on phones) */}
        <div style={{ marginBottom: 12 }}>
          <Chips
            label="Filter updates"
            items={tabs.map((t) => ({ value: t.id, label: t.label }))}
            value={filter}
            onChange={(v) => setFilter(v as FilterTab)}
          />
        </div>

        {isLoading && <LoadingShell rows={5} />}
        {error && <ErrorBlock />}

        {!isLoading && !error && rows.length === 0 && (
          <EmptyState emoji="🕒" title="No updates yet" body="Data changes will appear here as they happen." />
        )}

        {!isLoading && rows.length > 0 && (
          <DataTable
            caption="Data changes for this district, newest first"
            columns={[
              { key: "when", label: "When (IST)", mono: true, align: "left", width: 150 },
              { key: "module", label: "Module" },
              { key: "change", label: "Change" },
              { key: "by", label: "By" },
              { key: "records", label: "Records", numeric: true },
              { key: "what", label: "What changed" },
            ]}
            rows={rows.map((r) => {
              const srcInfo = SOURCE_LABELS[r.source] ?? { label: r.source, tone: "neutral" as Tone };
              return {
                when: (
                  <span title={formatIST(r.timestamp) ?? undefined} style={{ display: "flex", flexDirection: "column" }}>
                    <span suppressHydrationWarning>{formatIST(r.timestamp) ?? "—"}</span>
                    <span suppressHydrationWarning style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{relativeTime(r.timestamp)}</span>
                  </span>
                ),
                module: r.moduleName ? <Pill>{r.moduleName}</Pill> : "—",
                change: <Pill tone={ACTION_TONE[r.action] ?? "neutral"}>{sentenceCase(r.action)}</Pill>,
                by: (
                  <Pill tone={srcInfo.tone} style={srcInfo.tone === "brand" ? HUE_PILL : undefined}>
                    {srcInfo.label}
                  </Pill>
                ),
                records: r.recordCount != null && r.recordCount > 1 ? r.recordCount.toLocaleString("en-IN") : "—",
                what: r.description ?? `${r.action} on ${r.tableName}`,
              };
            })}
          />
        )}

        {/* Load more */}
        {rows.length >= pageSize && rows.length < total && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <ToolbarButton onClick={() => setPageSize((n) => n + 20)}>Load more</ToolbarButton>
          </div>
        )}
      </Section>

      <ModulePageFooter moduleSlug="update-log" locale={locale} state={state} district={district} showCompare={false} />
    </div>
  );
}

export default function UpdateLogPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Update Log">
      <UpdateLogInner params={params} />
    </ModuleErrorBoundary>
  );
}

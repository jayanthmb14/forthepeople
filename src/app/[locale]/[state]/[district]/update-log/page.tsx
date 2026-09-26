/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";
import { ModuleHeader, StatCard, LoadingShell, ErrorBlock } from "@/components/district/ui";

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

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  weather:    { bg: "#EFF6FF", text: "#2563EB" },
  crops:      { bg: "#F0FDF4", text: "#16A34A" },
  news:       { bg: "#FFF7ED", text: "#EA580C" },
  water:      { bg: "#EFF6FF", text: "#0891B2" },
  finance:    { bg: "#FEFCE8", text: "#A16207" },
  budget:     { bg: "#FEFCE8", text: "#A16207" },
  police:     { bg: "#FFF1F2", text: "#DC2626" },
  infrastructure: { bg: "#FFF7ED", text: "#D97706" },
  alerts:     { bg: "#FFF1F2", text: "#DC2626" },
  schemes:    { bg: "#F5F3FF", text: "#7C3AED" },
  schools:    { bg: "#F0F9FF", text: "#0284C7" },
  health:     { bg: "#FFF1F2", text: "#E11D48" },
  leaders:    { bg: "#F5F3FF", text: "#7C3AED" },
  leadership: { bg: "#F5F3FF", text: "#7C3AED" },
  power:      { bg: "#FEFCE8", text: "#CA8A04" },
  courts:     { bg: "#F5F5F0", text: "#525252" },
};

const SOURCE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  scraper:    { label: "Auto-Update", bg: "#EFF6FF", text: "#2563EB" },
  cron:       { label: "Cron",       bg: "#EFF6FF", text: "#1D4ED8" },
  admin_edit: { label: "Admin",      bg: "#FFF7ED", text: "#EA580C" },
  api:        { label: "API / Seed", bg: "#F0FDF4", text: "#16A34A" },
  ai_bot:     { label: "AI Bot",     bg: "#F5F3FF", text: "#7C3AED" },
};

const ACTION_COLOR: Record<string, string> = {
  create: "#16A34A",
  update: "#D97706",
  delete: "#DC2626",
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

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "scrapers", label: "Auto-Updates" },
    { id: "admin", label: "Admin" },
    { id: "seeds", label: "Seeds" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Clock}
        title="Update Log"
        description="All data changes and updates for this district — full transparency"
        backHref={base}
        liveTag
      />
      {(() => {
        const _src = getModuleSources("update-log", state);
        return (
          <DataSourceBanner
            moduleName="update-log"
            sources={_src.sources}
            updateFrequency={_src.frequency}
            isLive={_src.isLive}
          />
        );
      })()}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatCard label="Total Updates" value={total.toLocaleString("en-IN")} icon={Clock} />
        <StatCard label="Shown" value={rows.length.toLocaleString("en-IN")} />
        <StatCard label="Auto-Updates" value={scraperCount} accent="#2563EB" />
        <StatCard label="Admin" value={adminCount} accent="#EA580C" />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 20,
                border: `1px solid ${active ? "#2563EB" : "#E8E8E4"}`,
                background: active ? "#EFF6FF" : "#FFF",
                color: active ? "#2563EB" : "#6B6B6B",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && rows.length === 0 && (
        <div style={{ background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 12, padding: 24, textAlign: "center" }}>
          <Clock size={28} style={{ color: "#9B9B9B", marginBottom: 8 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6B6B6B" }}>No updates yet</div>
          <div style={{ fontSize: 13, color: "#9B9B9B" }}>Data changes will appear here in real-time</div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => {
          const mod = r.moduleName ?? "other";
          const modColor = MODULE_COLORS[mod] ?? { bg: "#F5F5F0", text: "#6B6B6B" };
          const srcInfo = SOURCE_LABELS[r.source] ?? { label: r.source, bg: "#F5F5F0", text: "#6B6B6B" };
          const actionColor = ACTION_COLOR[r.action] ?? "#6B6B6B";
          return (
            <div
              key={r.id}
              style={{
                background: "#FFF",
                border: "1px solid #E8E8E4",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {r.moduleName && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                    background: modColor.bg, color: modColor.text,
                  }}>
                    {r.moduleName.toUpperCase()}
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                  background: "#F9F9F7", color: actionColor, border: `1px solid ${actionColor}33`,
                }}>
                  {r.action.toUpperCase()}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                  background: srcInfo.bg, color: srcInfo.text,
                }}>
                  {srcInfo.label}
                </span>
                {r.recordCount != null && r.recordCount > 1 && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                    background: "#F5F5F0", color: "#525252",
                  }}>
                    {r.recordCount} records
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>
                  {relativeTime(r.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.5 }}>
                {r.description ?? `${r.action} on ${r.tableName}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {rows.length >= pageSize && rows.length < total && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => setPageSize((n) => n + 20)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              borderRadius: 8, border: "1px solid #E8E8E4",
              background: "#FFF", color: "#2563EB", cursor: "pointer",
            }}
          >
            Load more
          </button>
        </div>
      )}
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
